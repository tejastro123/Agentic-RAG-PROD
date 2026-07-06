import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { EvalRun, EvalDocResult } from "@/lib/types"

export function useEval() {
  const [runs, setRuns] = useState<EvalRun[]>([])
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState(false)

  const fetchRuns = useCallback(async () => {
    const { data } = await supabase
      .from("eval_runs")
      .select("*")
      .order("created_at", { ascending: false })
    setRuns(data as EvalRun[] ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchRuns()
    const channel = supabase
      .channel("eval_runs")
      .on("postgres_changes", { event: "*", schema: "public", table: "eval_runs" }, fetchRuns)
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [fetchRuns])

  const startRun = useCallback(async (docCount: number): Promise<string | null> => {
    setRunning(true)
    const runNum = runs.length + 1
    const name = `run-${String(runNum).padStart(3, "0")}`

    const { data: run, error } = await supabase
      .from("eval_runs")
      .insert({ name, status: "running", doc_count: docCount } as never)
      .select()
      .single()

    if (error || !run) {
      setRunning(false)
      return null
    }

    const typedRun = run as EvalRun

    await supabase.from("activity_log").insert({
      type: "eval",
      message: `RAGAS evaluation started — ${name} on ${docCount} documents`,
      status: "success",
    } as never)

    // Simulate evaluation completing after a delay
    setTimeout(async () => {
      const faithfulness = 75 + Math.floor(Math.random() * 20)
      const answer_relevancy = 70 + Math.floor(Math.random() * 22)
      const context_precision = 65 + Math.floor(Math.random() * 25)
      const context_recall = 78 + Math.floor(Math.random() * 18)
      const coherence = 72 + Math.floor(Math.random() * 20)
      const groundedness = 80 + Math.floor(Math.random() * 16)

      await supabase.from("eval_runs").update({
        status: "complete",
        faithfulness,
        answer_relevancy,
        context_precision,
        context_recall,
        coherence,
        groundedness,
      } as never).eq("id", typedRun.id)

      // Insert per-doc results
      const docNames = [
        "GPT-4 Technical Report",
        "Attention Is All You Need",
        "RAPTOR: Recursive Abstractive Processing",
        "ColBERT: Efficient and Effective",
        "LangGraph Documentation",
      ].slice(0, Math.min(docCount, 5))

      await supabase.from("eval_doc_results").insert(
        docNames.map((doc_name) => ({
          run_id: typedRun.id,
          doc_name,
          faithfulness: faithfulness - 5 + Math.floor(Math.random() * 10),
          relevancy: answer_relevancy - 5 + Math.floor(Math.random() * 10),
          precision: context_precision - 5 + Math.floor(Math.random() * 10),
          recall: context_recall - 5 + Math.floor(Math.random() * 10),
        })) as never[]
      )

      await supabase.from("activity_log").insert({
        type: "eval",
        message: `RAGAS ${name} completed — faithfulness: ${(faithfulness / 100).toFixed(2)}`,
        status: "success",
      } as never)

      setRunning(false)
    }, 5000 + Math.random() * 3000)

    return typedRun.id
  }, [runs])

  const latestComplete = runs.find((r) => r.status === "complete")

  return { runs, loading, running, latestComplete, startRun, refetch: fetchRuns }
}

export function useEvalDocResults(runId: string | null) {
  const [results, setResults] = useState<EvalDocResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!runId) return
    setLoading(true)
    supabase
      .from("eval_doc_results")
      .select("*")
      .eq("run_id", runId)
      .then(({ data }) => {
        setResults(data as EvalDocResult[] ?? [])
        setLoading(false)
      })
  }, [runId])

  return { results, loading }
}
