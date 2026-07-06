import { useState, useEffect, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { Document } from "@/lib/types"

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchDocuments = useCallback(async () => {
    const { data, error } = await supabase
      .from("documents")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) {
      setError(error.message)
    } else {
      setDocuments(data as Document[] ?? [])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchDocuments()

    // Real-time subscription for status updates
    const channel = supabase
      .channel("documents")
      .on("postgres_changes", { event: "*", schema: "public", table: "documents" }, () => {
        fetchDocuments()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchDocuments])

  const uploadDocument = useCallback(async (file: File): Promise<Document | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin"
    const storagePath = `${Date.now()}_${file.name.replace(/\s+/g, "_")}`

    // Insert doc row with queued status first
    const { data: doc, error: insertErr } = await supabase
      .from("documents")
      .insert({
        name: file.name,
        file_type: ext,
        size: file.size,
        status: "queued",
        storage_path: storagePath,
      } as never)
      .select()
      .single()

    if (insertErr || !doc) {
      setError(insertErr?.message ?? "Failed to insert document")
      return null
    }

    const typedDoc = doc as Document

    // Upload file to Storage
    const { error: uploadErr } = await supabase.storage
      .from("documents")
      .upload(storagePath, file, { upsert: false })

    if (uploadErr) {
      await supabase.from("documents").update({ status: "error", error_message: uploadErr.message } as never).eq("id", typedDoc.id)
      setError(uploadErr.message)
      return null
    }

    // Log activity
    await supabase.from("activity_log").insert({
      type: "ingestion",
      message: `Queued ${file.name} for ingestion`,
      status: "success",
    } as never)

    // Simulate processing pipeline
    await supabase.from("documents").update({ status: "processing" } as never).eq("id", typedDoc.id)
    setTimeout(async () => {
      const chunks = Math.floor(file.size / 1200) + Math.floor(Math.random() * 40) + 10
      const entities = Math.floor(chunks * 0.3) + Math.floor(Math.random() * 20)
      await supabase.from("documents").update({
        status: "ready",
        chunks,
        entities,
      } as never).eq("id", typedDoc.id)
      await supabase.from("activity_log").insert({
        type: "ingestion",
        message: `Ingested ${file.name} — ${chunks} chunks, ${entities} entities extracted`,
        status: "success",
      } as never)
    }, 4000 + Math.random() * 3000)

    return typedDoc
  }, [])

  const deleteDocument = useCallback(async (id: string) => {
    const doc = documents.find((d) => d.id === id)
    if (doc?.storage_path) {
      await supabase.storage.from("documents").remove([doc.storage_path])
    }
    const { error } = await supabase.from("documents").delete().eq("id", id)
    if (error) setError(error.message)
    else setDocuments((prev) => prev.filter((d) => d.id !== id))
  }, [documents])

  const stats = {
    total: documents.length,
    ready: documents.filter((d) => d.status === "ready").length,
    processing: documents.filter((d) => d.status === "processing").length,
    chunks: documents.reduce((s, d) => s + (d.chunks ?? 0), 0),
    entities: documents.reduce((s, d) => s + (d.entities ?? 0), 0),
  }

  return { documents, loading, error, stats, uploadDocument, deleteDocument, refetch: fetchDocuments }
}
