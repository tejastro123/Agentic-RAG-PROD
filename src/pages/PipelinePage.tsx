import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Upload,
  Scissors,
  GitBranch,
  Layers,
  Database,
  Search,
  Navigation,
  Filter,
  Sparkles,
  ChevronRight,
  ChevronDown,
  Info,
  Play,
  CheckCircle2,
  Clock,
  Zap,
  Box,
  Network,
} from "lucide-react"

type StageStatus = "idle" | "running" | "done"

interface PipelineStage {
  id: string
  label: string
  sublabel: string
  icon: typeof Upload
  color: string
  bgColor: string
  borderColor: string
  strategy: string
  stats: { label: string; value: string }[]
  details: string[]
  phase: string
}

const stages: PipelineStage[] = [
  {
    id: "ingest",
    label: "Ingestion",
    sublabel: "Phase 1",
    icon: Upload,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
    borderColor: "border-chart-1/30",
    strategy: "Multi-source loaders",
    stats: [
      { label: "Sources", value: "8" },
      { label: "Docs loaded", value: "2,847" },
      { label: "Formats", value: "PDF, DOCX, HTML, MD, JSON" },
    ],
    details: [
      "PDFLoader — pymupdf + OCR fallback via Tesseract",
      "GitHubLoader — PyGithub, raw file fetch per branch",
      "ConfluenceLoader — REST API, page tree traversal",
      "NotionLoader — official Notion SDK, block recursion",
      "Metadata schema: source · doc_type · created_at · author · url · checksum",
    ],
    phase: "DocumentPipeline",
  },
  {
    id: "chunk",
    label: "Chunking",
    sublabel: "Phase 2",
    icon: Scissors,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    borderColor: "border-chart-2/30",
    strategy: "HybridChunker",
    stats: [
      { label: "Chunks", value: "12,340" },
      { label: "Avg size", value: "512 tokens" },
      { label: "Overlap", value: "64 tokens" },
    ],
    details: [
      "SemanticChunker — sentence-transformers cosine similarity, threshold 0.85",
      "AdaptiveChunker — auto-tune per doc_type (code → large, facts → small)",
      "HybridChunker — semantic first pass → adaptive second pass on oversized",
      "Output: Chunk(text, embedding_text, metadata, parent_doc_id)",
    ],
    phase: "HybridChunker",
  },
  {
    id: "raptor",
    label: "RAPTOR",
    sublabel: "Phase 3",
    icon: GitBranch,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    borderColor: "border-chart-3/30",
    strategy: "Hierarchical Tree Indexing",
    stats: [
      { label: "Levels", value: "4" },
      { label: "Tree nodes", value: "38,491" },
      { label: "Root summaries", value: "2,847" },
    ],
    details: [
      "Level 0 — raw leaf chunks",
      "Level 1 — cluster chunks → LLM-summarize cluster (k-means, k=auto)",
      "Level 2 — cluster level-1 summaries → summarize again",
      "Level 3 — single root summary per document",
      "All levels embedded and stored in Qdrant with level metadata filter",
      "RaptorRetriever — adaptive level selection based on query complexity",
    ],
    phase: "RaptorIndexer",
  },
  {
    id: "embed",
    label: "Embeddings",
    sublabel: "Phase 4",
    icon: Layers,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    borderColor: "border-chart-4/30",
    strategy: "EmbeddingRouter",
    stats: [
      { label: "Primary model", value: "BGE-M3 (1024d)" },
      { label: "Token-level", value: "ColBERT (128d)" },
      { label: "Total vectors", value: "15.98M" },
    ],
    details: [
      "OpenAI text-embedding-3-large — 3072d, production fallback",
      "BAAI/bge-large-en-v1.5 — 1024d, primary dense retrieval",
      "intfloat/e5-large-v2 — 1024d, cross-lingual support",
      "ColBERT — token-level late interaction, MaxSim scoring at query time",
      "EmbeddingRouter — routes to backend by query type and latency budget",
    ],
    phase: "EmbeddingRouter",
  },
  {
    id: "stores",
    label: "Stores",
    sublabel: "Phases 5–6",
    icon: Database,
    color: "text-chart-5",
    bgColor: "bg-chart-5/10",
    borderColor: "border-chart-5/30",
    strategy: "Triple-store Architecture",
    stats: [
      { label: "Qdrant collections", value: "3" },
      { label: "Neo4j entities", value: "18,492" },
      { label: "pgvector rows", value: "12,340" },
    ],
    details: [
      "Qdrant — chunks (1024d), raptor_tree (1024d), colbert (128d per token)",
      "pgvector — CREATE INDEX USING ivfflat(embedding vector_cosine_ops)",
      "Neo4j — Nodes: Person · Organization · Product · Document · Concept · Chunk",
      "Neo4j — Rels: WORKS_FOR · CREATED · USES · MENTIONS · RELATED_TO · PART_OF",
      "LLMGraphTransformer — extracts entities/relations from each chunk",
    ],
    phase: "QdrantStore + PGVectorStore + GraphBuilder",
  },
  {
    id: "translate",
    label: "Query Translation",
    sublabel: "Phase 8",
    icon: Sparkles,
    color: "text-chart-1",
    bgColor: "bg-chart-1/10",
    borderColor: "border-chart-1/30",
    strategy: "Multi-strategy",
    stats: [
      { label: "HyDE", value: "Hypothetical doc gen" },
      { label: "MultiQuery", value: "5 paraphrases" },
      { label: "StepBack", value: "Concept abstraction" },
    ],
    details: [
      "HyDERetriever — question → fake answer → embed fake doc → search",
      "MultiQueryRetriever — 1 question → 5 paraphrases → 5 retrievals → deduplicate",
      "StepBackRetriever — specific question → broader concept → wider retrieval",
      "QueryDecomposer — compound question → [Q1, Q2, Q3] → RAG-Fusion merge",
    ],
    phase: "QueryTranslator",
  },
  {
    id: "route",
    label: "Routing",
    sublabel: "Phase 9",
    icon: Navigation,
    color: "text-chart-2",
    bgColor: "bg-chart-2/10",
    borderColor: "border-chart-2/30",
    strategy: "Semantic + LLM Router",
    stats: [
      { label: "Routes", value: "sql · graph · vector · web · hybrid" },
      { label: "Accuracy", value: "94.2%" },
      { label: "Latency", value: "~12ms" },
    ],
    details: [
      "SemanticRouter — per-route example embeddings, cosine similarity routing",
      "LLMRouter — LLM classifier: sql | graph | vector | web | hybrid",
      "Fallback — hybrid route when confidence < 0.65",
      "Routes: SQL for structured data, Graph for entity traversal, Vector for semantic",
    ],
    phase: "SemanticRouter + LLMRouter",
  },
  {
    id: "retrieve",
    label: "Retrieval",
    sublabel: "Phase 7",
    icon: Search,
    color: "text-chart-3",
    bgColor: "bg-chart-3/10",
    borderColor: "border-chart-3/30",
    strategy: "HybridRetriever + RRF",
    stats: [
      { label: "BM25 hits", value: "top-50" },
      { label: "Dense hits", value: "top-50" },
      { label: "RRF k", value: "60" },
    ],
    details: [
      "BM25Retriever — rank-bm25 over all indexed text",
      "Dense — Qdrant ANN search with metadata filters",
      "GraphRetriever — text-to-Cypher → Neo4j MATCH queries",
      "PGVectorStore — hybrid SQL+vector (structured filters + semantic)",
      "Reciprocal Rank Fusion: score(d) = Σ 1/(60 + rank_i(d))",
    ],
    phase: "HybridRetriever",
  },
  {
    id: "rerank",
    label: "Re-ranking",
    sublabel: "Phase 10",
    icon: Filter,
    color: "text-chart-4",
    bgColor: "bg-chart-4/10",
    borderColor: "border-chart-4/30",
    strategy: "CrossEncoder → RankGPT",
    stats: [
      { label: "Input docs", value: "50" },
      { label: "Output docs", value: "10" },
      { label: "Window", value: "10 / step 5" },
    ],
    details: [
      "CrossEncoderReranker — BAAI/bge-reranker-large (primary)",
      "Fallback — cross-encoder/ms-marco-MiniLM-L-6-v2 (fast)",
      "RankGPT — sliding window permutation, window=10, step=5",
      "RankGPT passes each window to LLM: 'rank these docs for query'",
      "Slides across top-50 → outputs top-10 reranked documents",
    ],
    phase: "CrossEncoderReranker + RankGPT",
  },
  {
    id: "generate",
    label: "Generation",
    sublabel: "Phases 11–13",
    icon: Zap,
    color: "text-primary",
    bgColor: "bg-primary/10",
    borderColor: "border-primary/30",
    strategy: "LangGraph Orchestrator",
    stats: [
      { label: "Agents", value: "Planner · Retriever · Graph · SQL · Critic" },
      { label: "CRAG", value: "Active retrieval eval" },
      { label: "Self-RAG", value: "Reflection tokens" },
    ],
    details: [
      "LangGraph StateGraph — Planner → Retriever → [GraphAgent|SQLAgent] → Critic → Answer",
      "CRAG — evaluates each doc: correct / ambiguous / incorrect; web fallback if all incorrect",
      "Self-RAG — [Retrieve] [IsRel] [IsSup] [IsUse] reflection tokens at inference",
      "MemorySaver checkpointer — persists state across conversation turns",
      "FastAPI SSE — streams LangGraph events to frontend in real time",
    ],
    phase: "LangGraphOrchestrator",
  },
]

const stageConnectors = stages.slice(0, -1).map((s) => s.id)

export default function PipelinePage() {
  const [expandedStage, setExpandedStage] = useState<string | null>(null)
  const [simulationStatus, setSimulationStatus] = useState<Record<string, StageStatus>>({})
  const [isSimulating, setIsSimulating] = useState(false)

  const simulate = async () => {
    if (isSimulating) return
    setIsSimulating(true)
    setSimulationStatus({})
    for (const stage of stages) {
      setSimulationStatus((prev) => ({ ...prev, [stage.id]: "running" }))
      await new Promise((r) => setTimeout(r, 350 + Math.random() * 300))
      setSimulationStatus((prev) => ({ ...prev, [stage.id]: "done" }))
    }
    setIsSimulating(false)
  }

  const doneCount = Object.values(simulationStatus).filter((s) => s === "done").length

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Data Pipeline</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            End-to-end architecture — Ingest → Chunk → Embed → Index → Retrieve → Rerank → Generate
          </p>
        </div>
        <div className="flex items-center gap-2">
          {doneCount > 0 && (
            <Badge variant="outline" className="text-xs gap-1 border-chart-2/40 text-chart-2">
              <CheckCircle2 className="h-3 w-3" />
              {doneCount}/{stages.length} stages complete
            </Badge>
          )}
          <Button size="sm" onClick={simulate} disabled={isSimulating} className="gap-1.5">
            <Play className="h-3.5 w-3.5" />
            {isSimulating ? "Running..." : "Simulate Pipeline"}
          </Button>
        </div>
      </div>

      {/* Progress bar when simulating */}
      {isSimulating && (
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Pipeline execution</span>
            <span>{doneCount}/{stages.length}</span>
          </div>
          <Progress value={(doneCount / stages.length) * 100} className="h-1.5" />
        </div>
      )}

      {/* Pipeline Flow Diagram */}
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="pt-4 pb-4 px-4">
          <div className="overflow-x-auto scrollbar-thin">
            <div className="flex items-center gap-0 min-w-max py-2">
              {stages.map((stage, i) => {
                const Icon = stage.icon
                const status = simulationStatus[stage.id]
                return (
                  <div key={stage.id} className="flex items-center">
                    <button
                      onClick={() =>
                        setExpandedStage(expandedStage === stage.id ? null : stage.id)
                      }
                      className={`flex flex-col items-center gap-1.5 px-3 py-2.5 rounded-lg border transition-all ${
                        expandedStage === stage.id
                          ? `${stage.bgColor} ${stage.borderColor} shadow-sm`
                          : status === "done"
                            ? "bg-chart-2/5 border-chart-2/30"
                            : status === "running"
                              ? "bg-primary/10 border-primary/40"
                              : "bg-muted/30 border-border/60 hover:border-border"
                      }`}
                    >
                      <div
                        className={`h-8 w-8 rounded-md flex items-center justify-center ${
                          status === "done"
                            ? "bg-chart-2/20"
                            : status === "running"
                              ? "bg-primary/20"
                              : stage.bgColor
                        }`}
                      >
                        {status === "running" ? (
                          <span className="h-2 w-2 rounded-full bg-primary animate-agent-pulse" />
                        ) : status === "done" ? (
                          <CheckCircle2 className="h-4 w-4 text-chart-2" />
                        ) : (
                          <Icon className={`h-4 w-4 ${stage.color}`} />
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium text-center leading-tight whitespace-nowrap ${
                          status === "done"
                            ? "text-chart-2"
                            : status === "running"
                              ? "text-primary"
                              : "text-muted-foreground"
                        }`}
                      >
                        {stage.label}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-[9px] h-3.5 px-1 ${
                          status === "done"
                            ? "border-chart-2/30 text-chart-2"
                            : "border-border/50 text-muted-foreground/60"
                        }`}
                      >
                        {stage.sublabel}
                      </Badge>
                    </button>
                    {i < stageConnectors.length && (
                      <div className="flex items-center gap-0 mx-0.5">
                        <div
                          className={`h-px w-6 transition-colors ${
                            simulationStatus[stage.id] === "done"
                              ? "bg-chart-2/60"
                              : "bg-border/60"
                          }`}
                        />
                        <ChevronRight
                          className={`h-3 w-3 shrink-0 -ml-1 transition-colors ${
                            simulationStatus[stage.id] === "done"
                              ? "text-chart-2/60"
                              : "text-border/60"
                          }`}
                        />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Expanded Stage Detail */}
      {expandedStage && (() => {
        const stage = stages.find((s) => s.id === expandedStage)!
        const Icon = stage.icon
        return (
          <Card className={`bg-card border ${stage.borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${stage.bgColor}`}>
                  <Icon className={`h-5 w-5 ${stage.color}`} />
                </div>
                <div>
                  <CardTitle className="text-base">{stage.label}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {stage.strategy} — <code className="text-[10px] bg-muted px-1 py-0.5 rounded">{stage.phase}</code>
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="ml-auto h-7 w-7"
                  onClick={() => setExpandedStage(null)}
                >
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                {/* Stats */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Stats
                  </p>
                  <div className="space-y-1.5">
                    {stage.stats.map((stat) => (
                      <div
                        key={stat.label}
                        className="flex items-center justify-between text-xs rounded-md bg-muted/40 px-3 py-1.5"
                      >
                        <span className="text-muted-foreground">{stat.label}</span>
                        <span className={`font-medium ${stage.color}`}>{stat.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Implementation */}
                <div className="space-y-2">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">
                    Implementation
                  </p>
                  <div className="space-y-1.5">
                    {stage.details.map((detail, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs">
                        <Info className={`h-3 w-3 mt-0.5 shrink-0 ${stage.color} opacity-60`} />
                        <span className="text-foreground/80 leading-relaxed">{detail}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )
      })()}

      {/* Stage Cards Grid */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {stages.map((stage) => {
          const Icon = stage.icon
          const status = simulationStatus[stage.id]
          const isExpanded = expandedStage === stage.id
          return (
            <Card
              key={stage.id}
              className={`bg-card border cursor-pointer transition-all hover:shadow-md ${
                isExpanded ? stage.borderColor : "border-border"
              }`}
              onClick={() =>
                setExpandedStage(expandedStage === stage.id ? null : stage.id)
              }
            >
              <CardContent className="pt-4 pb-3">
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-md ${stage.bgColor}`}>
                    <Icon className={`h-4 w-4 ${stage.color}`} />
                  </div>
                  {status === "done" ? (
                    <CheckCircle2 className="h-4 w-4 text-chart-2" />
                  ) : status === "running" ? (
                    <span className="h-2 w-2 rounded-full bg-primary animate-agent-pulse mt-1" />
                  ) : (
                    <Badge
                      variant="outline"
                      className="text-[9px] h-4 border-border/50 text-muted-foreground/60"
                    >
                      {stage.sublabel}
                    </Badge>
                  )}
                </div>
                <p className="text-xs font-semibold">{stage.label}</p>
                <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">
                  {stage.strategy}
                </p>
                <div className="flex items-center gap-1 mt-2">
                  {isExpanded ? (
                    <ChevronDown className={`h-3 w-3 ${stage.color}`} />
                  ) : (
                    <ChevronRight className={`h-3 w-3 ${stage.color}`} />
                  )}
                  <span className={`text-[9px] ${stage.color}`}>
                    {isExpanded ? "Collapse" : "Details"}
                  </span>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Dependency Map */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Network className="h-4 w-4 text-chart-1" />
            Dependency Map
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg bg-muted/20 border border-border/50 p-4 font-mono text-[11px] text-muted-foreground leading-loose overflow-x-auto">
            <div className="space-y-0.5 min-w-max">
              <p>
                <span className="text-chart-1">Ingestion</span>
                {" → "}
                <span className="text-chart-2">Chunking</span>
                {" → "}
                <span className="text-chart-3">[RAPTOR, Embeddings]</span>
              </p>
              <p className="pl-40">
                ↓
              </p>
              <p>
                <span className="pl-12 text-chart-4">[Qdrant, pgvector, Neo4j]</span>
                {" ← indexed"}
              </p>
              <p className="pl-40">
                ↓
              </p>
              <p>
                <span className="text-chart-5">Query</span>
                {" → "}
                <span className="text-chart-2">Router</span>
                {" → "}
                <span className="text-chart-1">Translator</span>
                {" → "}
                <span className="text-chart-3">HybridRetriever</span>
              </p>
              <p className="pl-60">
                ↓
              </p>
              <p className="pl-16">
                <span className="text-chart-4">Reranker</span>
                {" (CrossEncoder → RankGPT)"}
              </p>
              <p className="pl-40">
                ↓
              </p>
              <p className="pl-12">
                <span className="text-chart-3">[CRAG evaluator / Self-RAG reflector]</span>
              </p>
              <p className="pl-40">
                ↓
              </p>
              <p className="pl-20">
                <span className="text-primary">LangGraph Orchestrator</span>
              </p>
              <p className="pl-40">
                ↓
              </p>
              <p className="pl-24">
                <span className="text-chart-2">FastAPI + React UI</span>
              </p>
              <p className="pl-40">
                ↓
              </p>
              <p className="pl-16">
                <span className="text-chart-3">RAGAS / TruLens / Prometheus</span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Infrastructure */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {[
          {
            icon: Box,
            title: "Docker Compose",
            color: "text-chart-1",
            bg: "bg-chart-1/10",
            items: [
              "postgres — pgvector/pgvector:pg16",
              "neo4j — neo4j:5",
              "qdrant — qdrant/qdrant",
              "api — FastAPI (./api)",
              "frontend — React/Vite (./frontend)",
            ],
          },
          {
            icon: Clock,
            title: "Observability",
            color: "text-chart-2",
            bg: "bg-chart-2/10",
            items: [
              "OpenTelemetry tracer per retrieval call",
              "Prometheus metrics: latency · recall · cost",
              "Grafana dashboards (pre-built)",
              "span.set_attribute('query', query)",
              "span.set_attribute('retrieved_k', len(docs))",
            ],
          },
          {
            icon: Sparkles,
            title: "Evaluation Stack",
            color: "text-chart-3",
            bg: "bg-chart-3/10",
            items: [
              "RAGAS — faithfulness · relevancy · precision · recall",
              "TruLens — groundedness with CoT reasons",
              "Benchmarks: HotpotQA · NQ · MS MARCO",
              "Metrics: EM · F1 · Recall@K · MRR · NDCG",
              "Automated CI eval on each model update",
            ],
          },
        ].map((section) => {
          const Icon = section.icon
          return (
            <Card key={section.title} className="bg-card border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <div className={`p-1.5 rounded-md ${section.bg}`}>
                    <Icon className={`h-3.5 w-3.5 ${section.color}`} />
                  </div>
                  {section.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-1.5">
                  {section.items.map((item, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs">
                      <span className={`mt-1.5 h-1 w-1 rounded-full shrink-0 ${section.color.replace("text-", "bg-")}`} />
                      <span className="text-foreground/75 leading-relaxed font-mono text-[10px]">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
