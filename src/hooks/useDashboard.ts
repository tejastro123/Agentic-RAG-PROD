import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { ActivityLogEntry, Document, EvalRun } from "@/lib/types"

export interface DashboardStats {
  totalDocuments: number
  totalChunks: number
  totalEntities: number
  queriesToday: number
  totalQueries: number
  latestEval: { name: string; faithfulness: number } | null
  systemStatus: "healthy" | "degraded" | "down"
}

export function useDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalDocuments: 0,
    totalChunks: 0,
    totalEntities: 0,
    queriesToday: 0,
    totalQueries: 0,
    latestEval: null,
    systemStatus: "healthy",
  })
  const [activity, setActivity] = useState<ActivityLogEntry[]>([])
  const [loading, setLoading] = useState(true)

  const fetchStats = useCallback(async () => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const [docsRes, msgsRes, msgsTodayRes, evalRes, activityRes] = await Promise.all([
      supabase.from("documents").select("chunks, entities").eq("status", "ready"),
      supabase.from("messages").select("id", { count: "exact", head: true }).eq("role", "user"),
      supabase.from("messages")
        .select("id", { count: "exact", head: true })
        .eq("role", "user")
        .gte("created_at", today.toISOString()),
      supabase.from("eval_runs").select("name, faithfulness").eq("status", "complete").order("created_at", { ascending: false }).limit(1),
      supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(8),
    ])

    const docs = docsRes.data as Pick<Document, "chunks" | "entities">[] ?? []
    const totalChunks = docs.reduce((s, d) => s + (d.chunks ?? 0), 0)
    const totalEntities = docs.reduce((s, d) => s + (d.entities ?? 0), 0)

    const evalData = evalRes.data as Pick<EvalRun, "name" | "faithfulness">[] | null

    setStats({
      totalDocuments: docs.length,
      totalChunks,
      totalEntities,
      queriesToday: msgsTodayRes.count ?? 0,
      totalQueries: msgsRes.count ?? 0,
      latestEval: evalData?.[0]
        ? { name: evalData[0].name, faithfulness: evalData[0].faithfulness ?? 0 }
        : null,
      systemStatus: "healthy",
    })
    setActivity(activityRes.data as ActivityLogEntry[] ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchStats()

    const channel = supabase
      .channel("dashboard")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, fetchStats)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, fetchStats)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "activity_log" }, fetchStats)
      .on("postgres_changes", { event: "*", schema: "public", table: "eval_runs" }, fetchStats)
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchStats])

  return { stats, activity, loading, refetch: fetchStats }
}
