
/*
# OmniRAG Platform — Core Tables

Creates the foundational tables for the OmniRAG production platform.

## New Tables

### 1. documents
Stores metadata for every ingested document. The actual file binary is kept in
Supabase Storage (bucket: "documents"); this table holds the metadata and
processing status so the Documents page can list, filter, and track progress.

Columns:
- id: UUID primary key
- name: original filename
- file_type: file extension (pdf, docx, html, md, json, etc.)
- size: file size in bytes
- status: processing lifecycle — queued | processing | ready | error
- storage_path: path inside the "documents" bucket
- chunks: number of semantic chunks produced (null until processing complete)
- entities: number of graph entities extracted (null until processing complete)
- error_message: human-readable error if status = error
- created_at, updated_at

### 2. chat_sessions
Each row is one conversation thread. The title defaults to the first user message
and can be auto-generated later.

Columns:
- id: UUID primary key
- title: short descriptive title
- created_at, updated_at

### 3. messages
Individual messages inside a chat session. Steps and citations are stored as JSONB
so they can be rich objects without a separate table.

Columns:
- id: UUID primary key
- session_id: FK to chat_sessions
- role: "user" | "assistant"
- content: message text
- steps: JSONB array of agent trace steps
- citations: JSONB array of source citations
- created_at

### 4. eval_runs
Records of RAGAS / DeepEval evaluation runs. Metric scores are stored as integers
(0–100). Per-document results live in eval_doc_results.

Columns:
- id: UUID primary key
- name: run label (e.g. "run-047")
- status: running | complete | failed
- faithfulness, answer_relevancy, context_precision, context_recall, coherence, groundedness: INTEGER 0-100
- doc_count: number of documents evaluated
- created_at

### 5. eval_doc_results
Per-document breakdown for a given eval run. Used by the "Per Document" tab.

Columns:
- id: UUID primary key
- run_id: FK to eval_runs
- doc_name: document title
- faithfulness, relevancy, precision, recall: INTEGER 0-100
- created_at

### 6. platform_settings
Key/value store for all configurable platform settings (model selection, chunk
sizes, agent feature toggles, API key references, etc.). Values are JSONB to
support any shape.

Columns:
- key: text primary key
- value: JSONB
- updated_at

### 7. activity_log
Rolling audit feed displayed on the Dashboard. New events are inserted by the
frontend whenever a meaningful action occurs (document ingestion, query, eval run,
agent workflow, error).

Columns:
- id: UUID primary key
- type: ingestion | query | eval | agent | error
- message: human-readable description
- status: success | warning | error
- created_at

## Security
All tables use RLS with open anon + authenticated policies (single-tenant, no auth).

## Indexes
- messages(session_id) — fast session message loading
- messages(created_at) — chronological ordering
- eval_doc_results(run_id) — fast per-run breakdown
- activity_log(created_at) — dashboard feed ordering
- documents(status) — filter by processing state
*/

-- ─── documents ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS documents (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name         text        NOT NULL,
  file_type    text        NOT NULL DEFAULT 'pdf',
  size         bigint      NOT NULL DEFAULT 0,
  status       text        NOT NULL DEFAULT 'queued'
                           CHECK (status IN ('queued','processing','ready','error')),
  storage_path text,
  chunks       integer,
  entities     integer,
  error_message text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_documents" ON documents;
CREATE POLICY "anon_select_documents" ON documents FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_documents" ON documents;
CREATE POLICY "anon_insert_documents" ON documents FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_documents" ON documents;
CREATE POLICY "anon_update_documents" ON documents FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_documents" ON documents;
CREATE POLICY "anon_delete_documents" ON documents FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_documents_status     ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- ─── chat_sessions ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS chat_sessions (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  title      text        NOT NULL DEFAULT 'New conversation',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_chat_sessions" ON chat_sessions;
CREATE POLICY "anon_select_chat_sessions" ON chat_sessions FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_chat_sessions" ON chat_sessions;
CREATE POLICY "anon_insert_chat_sessions" ON chat_sessions FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_chat_sessions" ON chat_sessions;
CREATE POLICY "anon_update_chat_sessions" ON chat_sessions FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_chat_sessions" ON chat_sessions;
CREATE POLICY "anon_delete_chat_sessions" ON chat_sessions FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_updated_at ON chat_sessions(updated_at DESC);

-- ─── messages ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS messages (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid        NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role       text        NOT NULL CHECK (role IN ('user','assistant')),
  content    text        NOT NULL DEFAULT '',
  steps      jsonb,
  citations  jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_messages" ON messages;
CREATE POLICY "anon_select_messages" ON messages FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_messages" ON messages;
CREATE POLICY "anon_insert_messages" ON messages FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_messages" ON messages;
CREATE POLICY "anon_update_messages" ON messages FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_messages" ON messages;
CREATE POLICY "anon_delete_messages" ON messages FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_messages_session_id ON messages(session_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at ASC);

-- ─── eval_runs ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eval_runs (
  id                uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text        NOT NULL,
  status            text        NOT NULL DEFAULT 'running'
                                CHECK (status IN ('running','complete','failed')),
  faithfulness      integer     CHECK (faithfulness BETWEEN 0 AND 100),
  answer_relevancy  integer     CHECK (answer_relevancy BETWEEN 0 AND 100),
  context_precision integer     CHECK (context_precision BETWEEN 0 AND 100),
  context_recall    integer     CHECK (context_recall BETWEEN 0 AND 100),
  coherence         integer     CHECK (coherence BETWEEN 0 AND 100),
  groundedness      integer     CHECK (groundedness BETWEEN 0 AND 100),
  doc_count         integer     NOT NULL DEFAULT 0,
  created_at        timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE eval_runs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_eval_runs" ON eval_runs;
CREATE POLICY "anon_select_eval_runs" ON eval_runs FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_eval_runs" ON eval_runs;
CREATE POLICY "anon_insert_eval_runs" ON eval_runs FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_eval_runs" ON eval_runs;
CREATE POLICY "anon_update_eval_runs" ON eval_runs FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_eval_runs" ON eval_runs;
CREATE POLICY "anon_delete_eval_runs" ON eval_runs FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_eval_runs_created_at ON eval_runs(created_at DESC);

-- ─── eval_doc_results ───────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS eval_doc_results (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id        uuid        NOT NULL REFERENCES eval_runs(id) ON DELETE CASCADE,
  doc_name      text        NOT NULL,
  faithfulness  integer     CHECK (faithfulness BETWEEN 0 AND 100),
  relevancy     integer     CHECK (relevancy BETWEEN 0 AND 100),
  precision     integer     CHECK (precision BETWEEN 0 AND 100),
  recall        integer     CHECK (recall BETWEEN 0 AND 100),
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE eval_doc_results ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_eval_doc_results" ON eval_doc_results;
CREATE POLICY "anon_select_eval_doc_results" ON eval_doc_results FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_eval_doc_results" ON eval_doc_results;
CREATE POLICY "anon_insert_eval_doc_results" ON eval_doc_results FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_eval_doc_results" ON eval_doc_results;
CREATE POLICY "anon_update_eval_doc_results" ON eval_doc_results FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_eval_doc_results" ON eval_doc_results;
CREATE POLICY "anon_delete_eval_doc_results" ON eval_doc_results FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_eval_doc_results_run_id ON eval_doc_results(run_id);

-- ─── platform_settings ──────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS platform_settings (
  key        text        PRIMARY KEY,
  value      jsonb       NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_platform_settings" ON platform_settings;
CREATE POLICY "anon_select_platform_settings" ON platform_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_platform_settings" ON platform_settings;
CREATE POLICY "anon_insert_platform_settings" ON platform_settings FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_platform_settings" ON platform_settings;
CREATE POLICY "anon_update_platform_settings" ON platform_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_platform_settings" ON platform_settings;
CREATE POLICY "anon_delete_platform_settings" ON platform_settings FOR DELETE TO anon, authenticated USING (true);

-- ─── activity_log ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS activity_log (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  type       text        NOT NULL CHECK (type IN ('ingestion','query','eval','agent','error')),
  message    text        NOT NULL,
  status     text        NOT NULL DEFAULT 'success' CHECK (status IN ('success','warning','error')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_select_activity_log" ON activity_log;
CREATE POLICY "anon_select_activity_log" ON activity_log FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_insert_activity_log" ON activity_log;
CREATE POLICY "anon_insert_activity_log" ON activity_log FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_activity_log" ON activity_log;
CREATE POLICY "anon_update_activity_log" ON activity_log FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_delete_activity_log" ON activity_log;
CREATE POLICY "anon_delete_activity_log" ON activity_log FOR DELETE TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON activity_log(created_at DESC);

-- ─── default platform settings ──────────────────────────────────────────────

INSERT INTO platform_settings (key, value) VALUES
  ('primary_llm',        '"GPT-4o"'),
  ('embedding_model',    '"BGE-M3 (Hybrid)"'),
  ('reranker',           '"Cohere Rerank v3"'),
  ('retrieval_strategy', '"Adaptive RAG"'),
  ('chunk_size',         '1024'),
  ('chunk_overlap',      '64'),
  ('top_k',              '10'),
  ('self_rag',           'true'),
  ('corrective_rag',     'true'),
  ('hyde',               'false'),
  ('multi_agent',        'true')
ON CONFLICT (key) DO NOTHING;

-- ─── storage bucket ─────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'text/html',
    'text/markdown',
    'text/csv',
    'application/json',
    'application/zip',
    'application/x-zip-compressed'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS for documents bucket
DROP POLICY IF EXISTS "anon_select_storage_documents" ON storage.objects;
CREATE POLICY "anon_select_storage_documents"
ON storage.objects FOR SELECT TO anon, authenticated
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "anon_insert_storage_documents" ON storage.objects;
CREATE POLICY "anon_insert_storage_documents"
ON storage.objects FOR INSERT TO anon, authenticated
WITH CHECK (bucket_id = 'documents');

DROP POLICY IF EXISTS "anon_update_storage_documents" ON storage.objects;
CREATE POLICY "anon_update_storage_documents"
ON storage.objects FOR UPDATE TO anon, authenticated
USING (bucket_id = 'documents');

DROP POLICY IF EXISTS "anon_delete_storage_documents" ON storage.objects;
CREATE POLICY "anon_delete_storage_documents"
ON storage.objects FOR DELETE TO anon, authenticated
USING (bucket_id = 'documents');
