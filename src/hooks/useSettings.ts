import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { PlatformSettings } from "@/lib/types"

const DEFAULTS: PlatformSettings = {
  primary_llm: "GPT-4o",
  embedding_model: "BGE-M3 (Hybrid)",
  reranker: "Cohere Rerank v3",
  retrieval_strategy: "Adaptive RAG",
  chunk_size: 1024,
  chunk_overlap: 64,
  top_k: 10,
  self_rag: true,
  corrective_rag: true,
  hyde: false,
  multi_agent: true,
}

interface SettingsRow {
  key: string
  value: unknown
  updated_at: string
}

export function useSettings() {
  const [settings, setSettings] = useState<PlatformSettings>(DEFAULTS)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("platform_settings").select("key, value")
      if (data && data.length > 0) {
        const merged = { ...DEFAULTS } as Record<string, unknown>
        for (const row of data as SettingsRow[]) {
          merged[row.key] = row.value
        }
        setSettings(merged as unknown as PlatformSettings)
      }
      setLoading(false)
    }
    load()
  }, [])

  const update = useCallback(<K extends keyof PlatformSettings>(key: K, value: PlatformSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }, [])

  const save = useCallback(async () => {
    setSaving(true)
    const rows = (Object.entries(settings) as [string, unknown][]).map(([key, value]) => ({
      key,
      value,
      updated_at: new Date().toISOString(),
    }))
    const { error } = await supabase
      .from("platform_settings")
      .upsert(rows as never[], { onConflict: "key" })
    setSaving(false)
    if (!error) {
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }
  }, [settings])

  return { settings, loading, saving, saved, update, save }
}
