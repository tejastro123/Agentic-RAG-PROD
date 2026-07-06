import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { ChatSession, Message, AgentStep, Citation } from "@/lib/types"

export function useChatSessions() {
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [loading, setLoading] = useState(true)

  const fetchSessions = useCallback(async () => {
    const { data } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
    setSessions(data as ChatSession[] ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchSessions()
    const channel = supabase
      .channel("chat_sessions")
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_sessions" }, fetchSessions)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchSessions])

  const createSession = useCallback(async (title: string): Promise<ChatSession | null> => {
    const { data, error } = await supabase
      .from("chat_sessions")
      .insert({ title } as never)
      .select()
      .single()
    if (error || !data) return null
    const typed = data as ChatSession
    setSessions((prev) => [typed, ...prev])
    return typed
  }, [])

  const updateSessionTitle = useCallback(async (id: string, title: string) => {
    await supabase
      .from("chat_sessions")
      .update({ title, updated_at: new Date().toISOString() } as never)
      .eq("id", id)
  }, [])

  const deleteSession = useCallback(async (id: string) => {
    await supabase.from("chat_sessions").delete().eq("id", id)
    setSessions((prev) => prev.filter((s) => s.id !== id))
  }, [])

  return { sessions, loading, createSession, updateSessionTitle, deleteSession, refetch: fetchSessions }
}

export function useChatMessages(sessionId: string | null) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)

  const fetchMessages = useCallback(async (sid: string) => {
    setLoading(true)
    const { data } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sid)
      .order("created_at", { ascending: true })
    setMessages(data as Message[] ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!sessionId) {
      setMessages([])
      return
    }
    fetchMessages(sessionId)
  }, [sessionId, fetchMessages])

  const addUserMessage = useCallback(async (sessionId: string, content: string): Promise<Message | null> => {
    const { data, error } = await supabase
      .from("messages")
      .insert({ session_id: sessionId, role: "user", content } as never)
      .select()
      .single()
    if (error || !data) return null
    const typed = data as Message
    setMessages((prev) => [...prev, typed])
    // Touch session updated_at
    await supabase.from("chat_sessions").update({ updated_at: new Date().toISOString() } as never).eq("id", sessionId)
    return typed
  }, [])

  const addAssistantMessage = useCallback(async (
    sessionId: string,
    content: string,
    steps: AgentStep[],
    citations: Citation[]
  ): Promise<Message | null> => {
    const { data, error } = await supabase
      .from("messages")
      .insert({
        session_id: sessionId,
        role: "assistant",
        content,
        steps: steps as unknown as never,
        citations: citations as unknown as never,
      } as never)
      .select()
      .single()
    if (error || !data) return null
    const typed = data as Message
    setMessages((prev) => [...prev, typed])
    // Log to activity feed
    await supabase.from("activity_log").insert({
      type: "query",
      message: `Query completed with ${citations.length} citations`,
      status: "success",
    } as never)
    return typed
  }, [])

  const updateStreamingMessage = useCallback((id: string, updates: Partial<Message>) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, ...updates } : m))
  }, [])

  return { messages, loading, addUserMessage, addAssistantMessage, updateStreamingMessage }
}
