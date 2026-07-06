export type DocumentStatus = "queued" | "processing" | "ready" | "error"
export type MessageRole = "user" | "assistant"
export type EvalStatus = "running" | "complete" | "failed"
export type ActivityType = "ingestion" | "query" | "eval" | "agent" | "error"
export type ActivityStatus = "success" | "warning" | "error"

export interface Document {
  id: string
  name: string
  file_type: string
  size: number
  status: DocumentStatus
  storage_path: string | null
  chunks: number | null
  entities: number | null
  error_message: string | null
  created_at: string
  updated_at: string
}

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
}

export interface AgentStep {
  id: string
  label: string
  detail: string
  status: "pending" | "running" | "done"
  duration?: string
  iconName: string
}

export interface Citation {
  title: string
  score: number
  page: number
  chunk: string
}

export interface Message {
  id: string
  session_id: string
  role: MessageRole
  content: string
  steps: AgentStep[] | null
  citations: Citation[] | null
  created_at: string
}

export interface EvalRun {
  id: string
  name: string
  status: EvalStatus
  faithfulness: number | null
  answer_relevancy: number | null
  context_precision: number | null
  context_recall: number | null
  coherence: number | null
  groundedness: number | null
  doc_count: number
  created_at: string
}

export interface EvalDocResult {
  id: string
  run_id: string
  doc_name: string
  faithfulness: number | null
  relevancy: number | null
  precision: number | null
  recall: number | null
  created_at: string
}

export interface ActivityLogEntry {
  id: string
  type: ActivityType
  message: string
  status: ActivityStatus
  created_at: string
}

export interface PlatformSettings {
  primary_llm: string
  embedding_model: string
  reranker: string
  retrieval_strategy: string
  chunk_size: number
  chunk_overlap: number
  top_k: number
  self_rag: boolean
  corrective_rag: boolean
  hyde: boolean
  multi_agent: boolean
}

// Supabase database type map
export type Database = {
  public: {
    Tables: {
      documents: {
        Row: Document
        Insert: Omit<Document, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<Document, "id">>
      }
      chat_sessions: {
        Row: ChatSession
        Insert: Omit<ChatSession, "id" | "created_at" | "updated_at"> & { id?: string; created_at?: string; updated_at?: string }
        Update: Partial<Omit<ChatSession, "id">>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Omit<Message, "id">>
      }
      eval_runs: {
        Row: EvalRun
        Insert: Omit<EvalRun, "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Omit<EvalRun, "id">>
      }
      eval_doc_results: {
        Row: EvalDocResult
        Insert: Omit<EvalDocResult, "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Omit<EvalDocResult, "id">>
      }
      platform_settings: {
        Row: { key: string; value: unknown; updated_at: string }
        Insert: { key: string; value: unknown; updated_at?: string }
        Update: { value?: unknown; updated_at?: string }
      }
      activity_log: {
        Row: ActivityLogEntry
        Insert: Omit<ActivityLogEntry, "id" | "created_at"> & { id?: string; created_at?: string }
        Update: Partial<Omit<ActivityLogEntry, "id">>
      }
    }
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export function timeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now.getTime() - date.getTime()) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return date.toLocaleDateString()
}
