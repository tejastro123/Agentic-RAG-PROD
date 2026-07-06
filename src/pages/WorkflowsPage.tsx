import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Globe,
  Search,
  Zap,
  Brain,
  Eye,
  Filter,
  MessageSquare,
  GitMerge,
  Database,
  Share2,
  Code2,
} from "lucide-react"

// ─── CRAG ────────────────────────────────────────────────────────────────────

const cragNodes = [
  { id: "retrieve", label: "Retrieve", icon: Search, x: 120, y: 100, color: "chart-1" },
  { id: "evaluate", label: "Evaluate Docs", icon: Eye, x: 350, y: 100, color: "chart-2" },
  { id: "correct", label: "All Correct", icon: CheckCircle2, x: 570, y: 40, color: "chart-2" },
  { id: "ambiguous", label: "Ambiguous", icon: AlertCircle, x: 570, y: 100, color: "chart-3" },
  { id: "incorrect", label: "All Incorrect", icon: XCircle, x: 570, y: 160, color: "destructive" },
  { id: "web", label: "Web Search", icon: Globe, x: 760, y: 160, color: "chart-3" },
  { id: "supplement", label: "Supplement", icon: Filter, x: 760, y: 100, color: "chart-3" },
  { id: "refine", label: "Refine Context", icon: Filter, x: 950, y: 100, color: "chart-4" },
  { id: "generate", label: "Generate", icon: MessageSquare, x: 1140, y: 100, color: "primary" },
]

const cragEdges = [
  { from: "retrieve", to: "evaluate" },
  { from: "evaluate", to: "correct", label: ">0.7" },
  { from: "evaluate", to: "ambiguous", label: "0.3–0.7" },
  { from: "evaluate", to: "incorrect", label: "<0.3" },
  { from: "correct", to: "refine" },
  { from: "ambiguous", to: "supplement" },
  { from: "incorrect", to: "web" },
  { from: "web", to: "refine" },
  { from: "supplement", to: "refine" },
  { from: "refine", to: "generate" },
]

// ─── SELF-RAG ─────────────────────────────────────────────────────────────────

const selfRagNodes = [
  { id: "query", label: "Query", icon: MessageSquare, x: 80, y: 120, color: "chart-1" },
  { id: "predict_retrieve", label: "[Retrieve]?", icon: Brain, x: 250, y: 120, color: "chart-2" },
  { id: "retrieve", label: "Retrieve", icon: Search, x: 420, y: 60, color: "chart-3" },
  { id: "score_relevance", label: "[IsRel]", icon: Eye, x: 590, y: 60, color: "chart-3" },
  { id: "generate", label: "Generate", icon: Zap, x: 590, y: 180, color: "primary" },
  { id: "score_support", label: "[IsSup]", icon: CheckCircle2, x: 760, y: 180, color: "chart-4" },
  { id: "score_utility", label: "[IsUse]", icon: Filter, x: 930, y: 180, color: "chart-2" },
  { id: "refine", label: "Re-retrieve", icon: RotateCcw, x: 760, y: 60, color: "chart-3" },
  { id: "done", label: "Output", icon: MessageSquare, x: 1100, y: 180, color: "chart-2" },
]

const selfRagEdges = [
  { from: "query", to: "predict_retrieve" },
  { from: "predict_retrieve", to: "retrieve", label: "yes" },
  { from: "predict_retrieve", to: "generate", label: "no" },
  { from: "retrieve", to: "score_relevance" },
  { from: "score_relevance", to: "generate", label: ">0.5" },
  { from: "score_relevance", to: "refine", label: "<0.5" },
  { from: "refine", to: "retrieve" },
  { from: "generate", to: "score_support" },
  { from: "score_support", to: "score_utility", label: "supported" },
  { from: "score_support", to: "refine", label: "unsupported" },
  { from: "score_utility", to: "done", label: ">threshold" },
  { from: "score_utility", to: "refine", label: "low" },
]

// ─── LANGGRAPH ────────────────────────────────────────────────────────────────

const lgNodes = [
  { id: "planner", label: "Planner", icon: Brain, x: 120, y: 120, color: "chart-1", desc: "Decompose task" },
  { id: "retriever", label: "Retriever", icon: Search, x: 330, y: 120, color: "chart-3", desc: "HybridRetriever" },
  { id: "graph_agent", label: "Graph Agent", icon: Share2, x: 540, y: 60, color: "chart-2", desc: "Cypher queries" },
  { id: "sql_agent", label: "SQL Agent", icon: Database, x: 540, y: 180, color: "chart-4", desc: "Text-to-SQL" },
  { id: "critic", label: "Critic", icon: Eye, x: 750, y: 120, color: "chart-3", desc: "Quality check" },
  { id: "answer", label: "Answer", icon: MessageSquare, x: 960, y: 120, color: "primary", desc: "Final synthesis" },
]

const lgEdges = [
  { from: "planner", to: "retriever" },
  { from: "retriever", to: "graph_agent", label: "graph" },
  { from: "retriever", to: "sql_agent", label: "sql" },
  { from: "graph_agent", to: "critic" },
  { from: "sql_agent", to: "critic" },
  { from: "critic", to: "retriever", label: "retry" },
  { from: "critic", to: "answer", label: "done" },
]

const lgStateSchema = `class AgentState(TypedDict):
    question: str
    plan: list[str]
    retrieved_docs: list[Document]
    draft_answer: str
    critique: str
    final_answer: str
    iteration: int`

// ─── COMPONENT ────────────────────────────────────────────────────────────────

type NodeStatus = "idle" | "active" | "done"

function WorkflowSVG({
  nodes,
  edges,
  activeNodes,
  doneNodes,
  width = 1260,
  height = 240,
}: {
  nodes: { id: string; label: string; icon: typeof Search; x: number; y: number; color: string; desc?: string }[]
  edges: { from: string; to: string; label?: string }[]
  activeNodes: Set<string>
  doneNodes: Set<string>
  width?: number
  height?: number
}) {
  const nodeMap = Object.fromEntries(nodes.map((n) => [n.id, n]))

  const getStatus = (id: string): NodeStatus => {
    if (activeNodes.has(id)) return "active"
    if (doneNodes.has(id)) return "done"
    return "idle"
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="w-full"
      style={{ minHeight: "200px", maxHeight: "260px" }}
    >
      <defs>
        <marker id="arrow" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--border)" />
        </marker>
        <marker id="arrow-active" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--primary)" />
        </marker>
        <marker id="arrow-done" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="var(--chart-2)" />
        </marker>
      </defs>

      {/* Edges */}
      {edges.map((edge, i) => {
        const from = nodeMap[edge.from]
        const to = nodeMap[edge.to]
        if (!from || !to) return null
        const isActive = activeNodes.has(edge.from) && activeNodes.has(edge.to)
        const isDone = doneNodes.has(edge.from) && doneNodes.has(edge.to)
        const dx = to.x - from.x
        const dy = to.y - from.y
        const len = Math.sqrt(dx * dx + dy * dy)
        const ux = dx / len
        const uy = dy / len
        const sx = from.x + 44 * ux
        const sy = from.y + 44 * uy
        const ex = to.x - 44 * ux
        const ey = to.y - 44 * uy
        const midX = (sx + ex) / 2
        const midY = (sy + ey) / 2
        return (
          <g key={i}>
            <line
              x1={sx}
              y1={sy}
              x2={ex}
              y2={ey}
              stroke={
                isActive
                  ? "var(--primary)"
                  : isDone
                    ? "var(--chart-2)"
                    : "var(--border)"
              }
              strokeWidth={isActive ? 2 : 1.5}
              strokeDasharray={isActive ? "5,3" : undefined}
              markerEnd={`url(#arrow${isActive ? "-active" : isDone ? "-done" : ""})`}
              opacity={isActive || isDone ? 1 : 0.5}
            />
            {edge.label && (
              <text
                x={midX}
                y={midY - 6}
                textAnchor="middle"
                fontSize="9"
                fill="var(--muted-foreground)"
              >
                {edge.label}
              </text>
            )}
          </g>
        )
      })}

      {/* Nodes */}
      {nodes.map((node) => {
        const status = getStatus(node.id)
        return (
          <g key={node.id} transform={`translate(${node.x}, ${node.y})`}>
            <rect
              x={-44}
              y={-28}
              width={88}
              height={56}
              rx={8}
              fill={
                status === "active"
                  ? "color-mix(in oklch, var(--primary) 15%, var(--card))"
                  : status === "done"
                    ? "color-mix(in oklch, var(--chart-2) 10%, var(--card))"
                    : "var(--card)"
              }
              stroke={
                status === "active"
                  ? "var(--primary)"
                  : status === "done"
                    ? "var(--chart-2)"
                    : "var(--border)"
              }
              strokeWidth={status !== "idle" ? 1.5 : 1}
              opacity={status === "idle" ? 0.7 : 1}
            />
            <text
              textAnchor="middle"
              dy={-10}
              fontSize="10"
              fontWeight="600"
              fill={
                status === "active"
                  ? "var(--primary)"
                  : status === "done"
                    ? "var(--chart-2)"
                    : "var(--foreground)"
              }
            >
              {node.label}
            </text>
            {node.desc && (
              <text
                textAnchor="middle"
                dy={6}
                fontSize="8"
                fill="var(--muted-foreground)"
              >
                {node.desc}
              </text>
            )}
            {status === "active" && (
              <circle r={4} cy={16} fill="var(--primary)" opacity={0.9}>
                <animate attributeName="opacity" values="0.9;0.3;0.9" dur="1s" repeatCount="indefinite" />
              </circle>
            )}
          </g>
        )
      })}
    </svg>
  )
}

function useStepper(steps: string[], delay = 600) {
  const [current, setCurrent] = useState(-1)
  const [running, setRunning] = useState(false)

  const run = async () => {
    if (running) return
    setRunning(true)
    setCurrent(-1)
    for (let i = 0; i < steps.length; i++) {
      setCurrent(i)
      await new Promise((r) => setTimeout(r, delay + Math.random() * 200))
    }
    setRunning(false)
  }

  const reset = () => {
    setCurrent(-1)
    setRunning(false)
  }

  const activeNodes = new Set(current >= 0 && current < steps.length ? [steps[current]] : [])
  const doneNodes = new Set(steps.slice(0, Math.max(0, current)))

  return { run, reset, running, activeNodes, doneNodes, currentStep: steps[current] }
}

export default function WorkflowsPage() {
  const cragSteps = ["retrieve", "evaluate", "ambiguous", "supplement", "refine", "generate"]
  const selfRagSteps = ["query", "predict_retrieve", "retrieve", "score_relevance", "generate", "score_support", "score_utility", "done"]
  const lgSteps = ["planner", "retriever", "graph_agent", "critic", "answer"]

  const crag = useStepper(cragSteps, 650)
  const selfRag = useStepper(selfRagSteps, 600)
  const lg = useStepper(lgSteps, 700)

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Workflows</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          CRAG · Self-RAG · LangGraph — interactive agentic pipeline visualizations
        </p>
      </div>

      <Tabs defaultValue="crag">
        <TabsList className="h-8">
          <TabsTrigger value="crag" className="text-xs gap-1.5">
            <CheckCircle2 className="h-3 w-3" />
            CRAG
          </TabsTrigger>
          <TabsTrigger value="selfrag" className="text-xs gap-1.5">
            <Eye className="h-3 w-3" />
            Self-RAG
          </TabsTrigger>
          <TabsTrigger value="langgraph" className="text-xs gap-1.5">
            <GitMerge className="h-3 w-3" />
            LangGraph
          </TabsTrigger>
        </TabsList>

        {/* ── CRAG ─────────────────────────────────────────────────────── */}
        <TabsContent value="crag" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">
                    Corrective RAG (CRAG)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Active retrieval evaluation — scores each doc and falls back to web search when context quality is insufficient
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={crag.reset} disabled={crag.running}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={crag.run} disabled={crag.running}>
                    <Play className="h-3 w-3" />
                    {crag.running ? "Running..." : "Simulate"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-muted/10 p-4 overflow-x-auto">
                <WorkflowSVG
                  nodes={cragNodes}
                  edges={cragEdges}
                  activeNodes={crag.activeNodes}
                  doneNodes={crag.doneNodes}
                  width={1260}
                  height={220}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {[
              {
                title: "Evaluation Thresholds",
                color: "text-chart-2",
                bg: "bg-chart-2/10",
                items: [
                  { label: "Correct", value: "score > 0.7", badge: "use as-is" },
                  { label: "Ambiguous", value: "0.3 – 0.7", badge: "supplement" },
                  { label: "Incorrect", value: "score < 0.3", badge: "web fallback" },
                ],
              },
              {
                title: "Knowledge Refinement",
                color: "text-chart-3",
                bg: "bg-chart-3/10",
                items: [
                  { label: "Strip irrelevant sentences", value: "per retrieved chunk" },
                  { label: "Decompose into strips", value: "sentence-level filter" },
                  { label: "Recompose relevant strips", value: "into refined context" },
                ],
              },
              {
                title: "Web Search Fallback",
                color: "text-chart-4",
                bg: "bg-chart-4/10",
                items: [
                  { label: "Tool", value: "TavilySearch" },
                  { label: "Trigger", value: "all docs incorrect" },
                  { label: "Supplement", value: "any ambiguous doc" },
                ],
              },
            ].map((section) => (
              <Card key={section.title} className="bg-card border-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {section.items.map((item) => (
                    <div key={item.label} className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">{item.label}</span>
                      <div className="flex items-center gap-1">
                        <span className={`font-medium ${section.color}`}>{item.value}</span>
                        {"badge" in item && (
                          <Badge variant="outline" className="text-[9px] h-3.5 px-1 border-border/60">
                            {(item as { badge: string }).badge}
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── SELF-RAG ──────────────────────────────────────────────────── */}
        <TabsContent value="selfrag" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">Self-RAG</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Reflection token framework — model predicts whether to retrieve, assesses relevance, support, and utility
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={selfRag.reset} disabled={selfRag.running}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={selfRag.run} disabled={selfRag.running}>
                    <Play className="h-3 w-3" />
                    {selfRag.running ? "Running..." : "Simulate"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-muted/10 p-4 overflow-x-auto">
                <WorkflowSVG
                  nodes={selfRagNodes}
                  edges={selfRagEdges}
                  activeNodes={selfRag.activeNodes}
                  doneNodes={selfRag.doneNodes}
                  width={1240}
                  height={260}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {[
              { token: "[Retrieve]", desc: "Should the model retrieve external docs?", color: "text-chart-1", bg: "bg-chart-1/10" },
              { token: "[IsRel]", desc: "Is the retrieved passage relevant to the query?", color: "text-chart-2", bg: "bg-chart-2/10" },
              { token: "[IsSup]", desc: "Is the generation supported by the passage?", color: "text-chart-3", bg: "bg-chart-3/10" },
              { token: "[IsUse]", desc: "Is the response useful to the user?", color: "text-chart-4", bg: "bg-chart-4/10" },
            ].map((token) => (
              <Card key={token.token} className="bg-card border-border">
                <CardContent className="pt-4 pb-3">
                  <div className={`inline-block px-2 py-1 rounded-md text-xs font-mono font-semibold mb-2 ${token.bg} ${token.color}`}>
                    {token.token}
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">{token.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* ── LANGGRAPH ─────────────────────────────────────────────────── */}
        <TabsContent value="langgraph" className="space-y-4 mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-sm font-medium">LangGraph Multi-Agent</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    StateGraph orchestration — Planner → Retriever → [Graph | SQL] Agent → Critic → Answer
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" onClick={lg.reset} disabled={lg.running}>
                    <RotateCcw className="h-3 w-3" />
                  </Button>
                  <Button size="sm" className="h-7 text-xs gap-1" onClick={lg.run} disabled={lg.running}>
                    <Play className="h-3 w-3" />
                    {lg.running ? "Running..." : "Simulate"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border border-border/50 bg-muted/10 p-4 overflow-x-auto">
                <WorkflowSVG
                  nodes={lgNodes}
                  edges={lgEdges}
                  activeNodes={lg.activeNodes}
                  doneNodes={lg.doneNodes}
                  width={1100}
                  height={240}
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* State schema */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <Code2 className="h-3.5 w-3.5" />
                  AgentState Schema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="text-[11px] text-foreground/80 font-mono bg-muted/30 rounded-lg p-3 leading-relaxed overflow-x-auto">
                  {lgStateSchema}
                </pre>
              </CardContent>
            </Card>

            {/* Conditional edges */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-xs font-medium flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <GitMerge className="h-3.5 w-3.5" />
                  Conditional Routing
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  {
                    from: "Retriever",
                    conditions: [
                      { label: "route = graph", target: "GraphAgent", color: "text-chart-2" },
                      { label: "route = sql", target: "SQLAgent", color: "text-chart-4" },
                      { label: "route = done", target: "Critic", color: "text-chart-3" },
                    ],
                  },
                  {
                    from: "Critic",
                    conditions: [
                      { label: "quality < threshold", target: "Retriever (retry)", color: "text-chart-3" },
                      { label: "quality ≥ threshold", target: "Answer (final)", color: "text-chart-2" },
                    ],
                  },
                ].map((routing) => (
                  <div key={routing.from} className="space-y-1.5">
                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                      {routing.from}
                    </p>
                    {routing.conditions.map((cond) => (
                      <div key={cond.label} className="flex items-center justify-between text-xs bg-muted/30 rounded px-2.5 py-1.5">
                        <code className="text-[10px] text-muted-foreground font-mono">{cond.label}</code>
                        <span className={`font-medium text-[11px] ${cond.color}`}>
                          → {cond.target}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
                <div className="mt-2 pt-2 border-t border-border/50">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-muted-foreground">Checkpointer</span>
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-primary">
                      MemorySaver()
                    </code>
                  </div>
                  <div className="flex items-center justify-between text-[11px] mt-1">
                    <span className="text-muted-foreground">Streaming</span>
                    <code className="text-[10px] bg-muted px-1.5 py-0.5 rounded font-mono text-chart-2">
                      agent.astream(state)
                    </code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Node details */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {[
              { label: "Planner", color: "text-chart-1", bg: "bg-chart-1/10", icon: Brain, detail: "Decomposes task into plan[] sub-steps" },
              { label: "Retriever", color: "text-chart-3", bg: "bg-chart-3/10", icon: Search, detail: "Routes to HybridRetriever.retrieve()" },
              { label: "Graph Agent", color: "text-chart-2", bg: "bg-chart-2/10", icon: Share2, detail: "GraphRetriever.cypher_search()" },
              { label: "SQL Agent", color: "text-chart-4", bg: "bg-chart-4/10", icon: Database, detail: "text-to-SQL on Postgres" },
              { label: "Critic", color: "text-chart-3", bg: "bg-chart-3/10", icon: Eye, detail: "Evaluates draft answer quality" },
              { label: "Answer", color: "text-primary", bg: "bg-primary/10", icon: MessageSquare, detail: "Final synthesis + citation" },
            ].map((node) => {
              const Icon = node.icon
              return (
                <Card key={node.label} className="bg-card border-border">
                  <CardContent className="pt-3 pb-3">
                    <div className={`p-1.5 rounded-md ${node.bg} inline-block mb-2`}>
                      <Icon className={`h-3.5 w-3.5 ${node.color}`} />
                    </div>
                    <p className="text-xs font-semibold">{node.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{node.detail}</p>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
