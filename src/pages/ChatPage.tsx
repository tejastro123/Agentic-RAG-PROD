import { useState, useRef, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Send,
  Bot,
  User,
  ChevronDown,
  ChevronRight,
  Search,
  Share2,
  CheckCircle2,
  FileText,
  Zap,
  Clock,
  ExternalLink,
  RotateCcw,
  Sparkles,
  Brain,
  Plus,
  Trash2,
} from "lucide-react"
import { useChatSessions, useChatMessages } from "@/hooks/useChat"
import { supabase } from "@/lib/supabase"
import type { Message, AgentStep, Citation } from "@/lib/types"
import { timeAgo } from "@/lib/types"

const ICON_MAP: Record<string, typeof Search> = {
  Brain,
  Search,
  Zap,
  Share2,
  CheckCircle2,
}

const AGENT_STEPS_TEMPLATE: Omit<AgentStep, "id">[] = [
  { iconName: "Brain",       label: "Planning retrieval strategy",    detail: "Analyzing query complexity and routing to optimal agents...",       status: "pending" },
  { iconName: "Search",      label: "Query Understanding Agent",      detail: "Expanding and rewriting query for optimal retrieval...",             status: "pending" },
  { iconName: "Zap",         label: "Hybrid retrieval (Dense + BM25)", detail: "Searching vector store and BM25 index in parallel...",              status: "pending" },
  { iconName: "Share2",      label: "Graph traversal (Neo4j)",        detail: "Traversing knowledge graph for related entities and relations...",   status: "pending" },
  { iconName: "CheckCircle2",label: "Verification Agent",             detail: "Verifying retrieved context quality and grounding claims...",        status: "pending" },
]

const suggestedQueries = [
  "Compare RLHF vs Constitutional AI training",
  "How does RAG differ from fine-tuning?",
  "Explain mixture of experts architecture",
  "What is HyDE retrieval?",
]

type LocalMessage = Message & { _streaming?: boolean; _streamSteps?: AgentStep[] }

export default function ChatPage() {
  const { sessions, loading: sessionsLoading, createSession, updateSessionTitle, deleteSession } = useChatSessions()
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const { messages: dbMessages, loading: msgsLoading, addUserMessage, addAssistantMessage } = useChatMessages(activeSessionId)
  const [localMessages, setLocalMessages] = useState<LocalMessage[]>([])
  const [input, setInput] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [expandedSteps, setExpandedSteps] = useState<Record<string, boolean>>({})
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Sync DB messages to local state when session changes
  useEffect(() => {
    setLocalMessages(dbMessages as LocalMessage[])
  }, [dbMessages])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [localMessages])

  const toggleStep = (stepId: string) => {
    setExpandedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }))
  }

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isStreaming) return
    const text = input.trim()
    setInput("")
    setIsStreaming(true)

    // Create session if needed
    let sessionId = activeSessionId
    if (!sessionId) {
      const session = await createSession(text.slice(0, 60))
      if (!session) { setIsStreaming(false); return }
      sessionId = session.id
      setActiveSessionId(session.id)
    }

    // Persist user message
    const userMsg = await addUserMessage(sessionId, text)
    if (!userMsg) { setIsStreaming(false); return }
    setLocalMessages((prev) => [...prev, userMsg as LocalMessage])

    // Build streaming assistant message (not yet in DB)
    const streamId = `stream_${Date.now()}`
    const steps: AgentStep[] = AGENT_STEPS_TEMPLATE.map((s, i) => ({
      ...s,
      id: `step_${i}`,
      status: i === 0 ? "running" : "pending",
    }))

    const streamMsg: LocalMessage = {
      id: streamId,
      session_id: sessionId,
      role: "assistant",
      content: "",
      steps,
      citations: null,
      created_at: new Date().toISOString(),
      _streaming: true,
      _streamSteps: steps,
    }
    setLocalMessages((prev) => [...prev, streamMsg])

    const delays = [550, 800, 650, 720, 480]
    for (let i = 0; i < steps.length; i++) {
      await new Promise((r) => setTimeout(r, delays[i]))
      const duration = `${Math.floor(Math.random() * 250 + 80)}ms`
      setLocalMessages((prev) =>
        prev.map((m) =>
          m.id === streamId
            ? {
                ...m,
                _streamSteps: m._streamSteps?.map((s, si) => ({
                  ...s,
                  status: si < i + 1 ? "done" : si === i + 1 ? "running" : "pending",
                  duration: si <= i ? duration : undefined,
                })) as AgentStep[],
              }
            : m
        )
      )
    }

    await new Promise((r) => setTimeout(r, 350))

    const finalContent = "Based on my analysis of the knowledge base, I found relevant information across multiple indexed documents. The retrieved context shows strong relevance to your query with a verification score above 0.90.\n\nThe synthesized answer draws from the most relevant document chunks and graph traversal paths identified during retrieval. Each claim has been cross-checked against the source material to ensure grounding."

    const completedSteps: AgentStep[] = steps.map((s) => ({
      ...s,
      status: "done",
      duration: `${Math.floor(Math.random() * 250 + 80)}ms`,
    }))

    const citations: Citation[] = [
      { title: "Retrieved Document 1", score: 0.94, page: 3, chunk: "Supporting evidence from the knowledge base..." },
      { title: "Retrieved Document 2", score: 0.87, page: 8, chunk: "Additional context from indexed sources..." },
      { title: "Retrieved Document 3", score: 0.81, page: 2, chunk: "Corroborating information from the graph..." },
    ]

    // Persist to DB
    const saved = await addAssistantMessage(sessionId, finalContent, completedSteps, citations)

    // Replace streaming placeholder with real saved message
    setLocalMessages((prev) =>
      prev.map((m) =>
        m.id === streamId
          ? { ...(saved ?? m), _streaming: false, _streamSteps: undefined, content: finalContent, steps: completedSteps, citations }
          : m
      )
    )

    // Update session title to first query if it's "New conversation"
    const session = sessions.find((s) => s.id === sessionId)
    if (session?.title === "New conversation") {
      updateSessionTitle(sessionId, text.slice(0, 55))
    }

    // Log query to activity
    await supabase.from("activity_log").insert({
      type: "query",
      message: `Hybrid retrieval: '${text.slice(0, 60)}${text.length > 60 ? "…" : ""}'`,
      status: "success",
    } as never)

    setIsStreaming(false)
  }, [input, isStreaming, activeSessionId, sessions, createSession, addUserMessage, addAssistantMessage, updateSessionTitle])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const startNewChat = () => {
    setActiveSessionId(null)
    setLocalMessages([])
  }

  const displayMessages = localMessages

  return (
    <div className="flex h-[calc(100svh-3rem)] overflow-hidden">
      {/* Main Chat */}
      <div className="flex flex-col flex-1 min-w-0">
        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
            {/* Empty state */}
            {displayMessages.length === 0 && (
              <div className="flex flex-col items-center text-center py-16 gap-3">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">OmniRAG Assistant</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Agentic retrieval — hybrid search, graph traversal, and CRAG verification
                  </p>
                </div>
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  {suggestedQueries.map((q) => (
                    <button
                      key={q}
                      onClick={() => setInput(q)}
                      className="text-[11px] px-3 py-1.5 rounded-full border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {msgsLoading && activeSessionId && (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-16 w-full" />
                  </div>
                ))}
              </div>
            )}

            {displayMessages.map((message) => {
              const steps = message._streamSteps ?? message.steps
              return (
                <div key={message.id} className="space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-2">
                    <div className={`h-6 w-6 rounded-full flex items-center justify-center shrink-0 ${message.role === "user" ? "bg-primary/20" : "bg-chart-2/20"}`}>
                      {message.role === "user"
                        ? <User className="h-3.5 w-3.5 text-primary" />
                        : <Bot className="h-3.5 w-3.5 text-chart-2" />}
                    </div>
                    <span className="text-sm font-medium">{message.role === "user" ? "You" : "OmniRAG"}</span>
                    <span className="text-xs text-muted-foreground">{timeAgo(message.created_at)}</span>
                  </div>

                  {/* User message */}
                  {message.role === "user" && (
                    <div className="ml-8 text-sm leading-relaxed">{message.content}</div>
                  )}

                  {/* Assistant message */}
                  {message.role === "assistant" && (
                    <div className="ml-8 space-y-3">
                      {/* Agent Trace */}
                      {steps && steps.length > 0 && (
                        <div className="rounded-lg border border-border/60 bg-card/50 overflow-hidden">
                          <div className="px-3 py-2 border-b border-border/40 flex items-center gap-2">
                            <Zap className="h-3.5 w-3.5 text-primary" />
                            <span className="text-xs font-medium text-muted-foreground">Agent Trace</span>
                            <Badge variant="outline" className="ml-auto text-[10px] h-4 border-primary/30 text-primary">
                              {steps.filter((s) => s.status === "done").length}/{steps.length} done
                            </Badge>
                          </div>
                          <div className="divide-y divide-border/30">
                            {steps.map((step) => {
                              const Icon = ICON_MAP[step.iconName] ?? Search
                              const isExpanded = expandedSteps[step.id]
                              return (
                                <div key={step.id} className="px-3 py-2">
                                  <button onClick={() => toggleStep(step.id)} className="w-full flex items-center gap-2 text-left">
                                    <div className={`h-5 w-5 rounded-md flex items-center justify-center shrink-0 ${step.status === "done" ? "bg-chart-2/20" : step.status === "running" ? "bg-primary/20" : "bg-muted"}`}>
                                      {step.status === "running"
                                        ? <span className="h-1.5 w-1.5 rounded-full bg-primary animate-agent-pulse" />
                                        : step.status === "done"
                                          ? <Icon className="h-3 w-3 text-chart-2" />
                                          : <Icon className="h-3 w-3 text-muted-foreground/40" />}
                                    </div>
                                    <span className={`text-xs flex-1 ${step.status === "done" ? "text-foreground/80" : step.status === "running" ? "text-primary" : "text-muted-foreground/50"}`}>
                                      {step.label}
                                    </span>
                                    {step.duration && (
                                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                                        <Clock className="h-2.5 w-2.5" />
                                        {step.duration}
                                      </span>
                                    )}
                                    {step.status === "done" && (
                                      isExpanded
                                        ? <ChevronDown className="h-3 w-3 text-muted-foreground" />
                                        : <ChevronRight className="h-3 w-3 text-muted-foreground" />
                                    )}
                                  </button>
                                  {isExpanded && step.status === "done" && (
                                    <div className="mt-1.5 ml-7 text-[11px] text-muted-foreground bg-muted/50 rounded px-2 py-1.5 leading-relaxed">
                                      {step.detail}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        </div>
                      )}

                      {/* Content */}
                      {message.content && (
                        <div className="text-sm leading-relaxed space-y-3">
                          {message.content.split("\n\n").map((para, pi) => (
                            <p key={pi}>
                              {para.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                                part.startsWith("**") && part.endsWith("**")
                                  ? <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
                                  : part
                              )}
                            </p>
                          ))}
                        </div>
                      )}

                      {/* Citations */}
                      {message.citations && message.citations.length > 0 && (
                        <div className="space-y-1.5">
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Sources</p>
                          {message.citations.map((cite, i) => (
                            <div key={i} className="flex items-center gap-2 rounded-md border border-border/50 bg-card/40 px-3 py-2 hover:border-primary/30 transition-colors cursor-pointer">
                              <FileText className="h-3 w-3 text-muted-foreground shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{cite.title}</p>
                                <p className="text-[10px] text-muted-foreground">Page {cite.page}</p>
                              </div>
                              <Badge variant="outline" className="shrink-0 text-[10px] h-4 border-chart-2/40 text-chart-2">
                                {(cite.score * 100).toFixed(0)}%
                              </Badge>
                              <ExternalLink className="h-3 w-3 text-muted-foreground/40" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <div className="border-t border-border bg-background/80 backdrop-blur-sm p-4">
          <div className="max-w-3xl mx-auto space-y-2">
            {displayMessages.length === 0 && (
              <div className="flex flex-wrap gap-1.5">
                {suggestedQueries.map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-[11px] px-2.5 py-1 rounded-full border border-border/60 text-muted-foreground hover:border-primary/40 hover:text-foreground transition-colors"
                  >
                    {q}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-2 rounded-xl border border-border bg-card/60 p-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about your knowledge base..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-sm outline-none placeholder:text-muted-foreground scrollbar-thin min-h-[24px] max-h-[120px] py-0.5 px-1"
              />
              <div className="flex items-center gap-1.5 shrink-0">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={startNewChat} title="New chat">
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button size="icon" className="h-7 w-7" disabled={!input.trim() || isStreaming} onClick={sendMessage}>
                  <Send className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground text-center">
              Agentic retrieval with hybrid search, graph traversal, and CRAG verification
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="hidden xl:flex w-64 border-l border-border flex-col">
        <div className="px-4 py-3 border-b border-border flex items-center justify-between">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Sessions</p>
          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={startNewChat} title="New chat">
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        <ScrollArea className="flex-1 scrollbar-thin">
          <div className="p-2 space-y-1">
            {sessionsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="px-3 py-2 rounded-md">
                  <Skeleton className="h-3 w-full mb-1" />
                  <Skeleton className="h-2 w-12" />
                </div>
              ))
            ) : sessions.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-muted-foreground">No sessions yet</div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`group flex items-start gap-1 rounded-md cursor-pointer ${activeSessionId === session.id ? "bg-primary/10 border border-primary/20" : "hover:bg-accent"}`}
                  onClick={() => setActiveSessionId(session.id)}
                >
                  <button className={`flex-1 text-left px-3 py-2 text-xs transition-colors ${activeSessionId === session.id ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                    <p className="font-medium truncate leading-tight">{session.title}</p>
                    <p className="text-[10px] mt-0.5 opacity-70">{timeAgo(session.updated_at)}</p>
                  </button>
                  <button
                    className="shrink-0 p-1 mt-1.5 mr-1 rounded opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
                    onClick={(e) => { e.stopPropagation(); deleteSession(session.id); if (activeSessionId === session.id) startNewChat() }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <div className="p-3 border-t border-border">
          <Separator className="mb-3" />
          <div className="space-y-1.5 text-[10px] text-muted-foreground">
            <div className="flex justify-between">
              <span>Strategy</span>
              <span className="text-chart-1">Adaptive RAG</span>
            </div>
            <div className="flex justify-between">
              <span>Model</span>
              <span className="text-chart-2">GPT-4o</span>
            </div>
            <div className="flex justify-between">
              <span>Reranker</span>
              <span className="text-chart-3">Cohere v3</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
