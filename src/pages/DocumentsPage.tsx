import { useState, useRef } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import {
  FileText,
  Upload,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  MoreHorizontal,
  Layers,
  Cpu,
  Share2,
  Trash2,
  RefreshCw,
  ChevronDown,
  XCircle,
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useDocuments } from "@/hooks/useDocuments"
import { formatFileSize, timeAgo } from "@/lib/types"
import type { DocumentStatus } from "@/lib/types"

const statusConfig: Record<DocumentStatus, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  ready:      { label: "Ready",      color: "text-chart-2 border-chart-2/40",   icon: CheckCircle2 },
  processing: { label: "Processing", color: "text-chart-3 border-chart-3/40",   icon: Clock       },
  error:      { label: "Error",      color: "text-destructive border-destructive/40", icon: AlertCircle },
  queued:     { label: "Queued",     color: "text-muted-foreground border-border", icon: Clock      },
}

const typeColors: Record<string, string> = {
  pdf:  "bg-chart-1/10 text-chart-1",
  html: "bg-chart-4/10 text-chart-4",
  zip:  "bg-chart-3/10 text-chart-3",
  docx: "bg-chart-2/10 text-chart-2",
  csv:  "bg-chart-5/10 text-chart-5",
  md:   "bg-chart-2/10 text-chart-2",
  json: "bg-chart-4/10 text-chart-4",
  txt:  "bg-muted text-muted-foreground",
}

export default function DocumentsPage() {
  const { documents, loading, error, stats, uploadDocument, deleteDocument } = useDocuments()
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const filtered = documents.filter((doc) => {
    const matchesSearch = doc.name.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === "all" || doc.status === filter
    return matchesSearch && matchesFilter
  })

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return
    setUploading(true)
    for (const file of Array.from(files)) {
      await uploadDocument(file)
    }
    setUploading(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    await handleFiles(e.dataTransfer.files)
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Documents</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Manage ingestion pipeline and knowledge sources
          </p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          multiple
          accept=".pdf,.docx,.txt,.csv,.md,.html,.json,.zip"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <Button size="sm" className="gap-1.5" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
          <Upload className="h-3.5 w-3.5" />
          {uploading ? "Uploading..." : "Upload Files"}
        </Button>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-xs text-destructive">
          <XCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-3 pb-3 flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-md" />
                  <div className="space-y-1">
                    <Skeleton className="h-5 w-12" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </CardContent>
              </Card>
            ))
          : [
              { label: "Total Documents",  value: stats.total,                    icon: FileText,     color: "text-chart-1" },
              { label: "Ready",            value: stats.ready,                    icon: CheckCircle2, color: "text-chart-2" },
              { label: "Total Chunks",     value: stats.chunks.toLocaleString(),  icon: Layers,       color: "text-chart-3" },
              { label: "Graph Entities",   value: stats.entities.toLocaleString(), icon: Share2,      color: "text-chart-4" },
            ].map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="bg-card border-border">
                  <CardContent className="pt-3 pb-3 flex items-center gap-3">
                    <div className="p-1.5 rounded-md bg-muted">
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-lg font-bold leading-tight">{stat.value}</p>
                      <p className="text-[10px] text-muted-foreground">{stat.label}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      {/* Upload Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`rounded-xl border-2 border-dashed p-8 text-center transition-all cursor-pointer ${
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : uploading
              ? "border-chart-2/40 bg-chart-2/5"
              : "border-border hover:border-primary/40 hover:bg-muted/30"
        }`}
      >
        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-full ${isDragging ? "bg-primary/20" : uploading ? "bg-chart-2/20" : "bg-muted"}`}>
            <Upload className={`h-6 w-6 ${isDragging ? "text-primary" : uploading ? "text-chart-2" : "text-muted-foreground"}`} />
          </div>
          <div>
            <p className="text-sm font-medium">
              {isDragging ? "Drop files to upload" : uploading ? "Uploading & processing..." : "Drop files or click to browse"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              PDF, DOCX, TXT, CSV, MD, HTML · Max 50MB per file
            </p>
          </div>
          <div className="flex flex-wrap justify-center gap-1.5 mt-1">
            {["pdf", "docx", "txt", "csv", "md", "html", "json"].map((ext) => (
              <Badge key={ext} variant="outline" className="text-[10px] h-4 px-1.5">.{ext}</Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Ingestion Pipeline Info */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Cpu className="h-4 w-4 text-primary" />
            Ingestion Pipeline
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between gap-2 flex-wrap">
            {[
              { label: "Parse",         color: "bg-chart-1" },
              { label: "Clean",         color: "bg-chart-1" },
              { label: "Chunk",         color: "bg-chart-2" },
              { label: "Embed",         color: "bg-chart-3" },
              { label: "Index",         color: "bg-chart-4" },
              { label: "Graph Extract", color: "bg-primary" },
            ].map((step, i) => (
              <div key={step.label} className="flex items-center gap-1.5">
                <div className={`h-2 w-2 rounded-full ${step.color}`} />
                <span className="text-xs text-muted-foreground">{step.label}</span>
                {i < 5 && <ChevronDown className="h-3 w-3 text-muted-foreground/40 rotate-[-90deg]" />}
              </div>
            ))}
          </div>
          <Separator className="my-3" />
          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            {[
              { label: "Chunker",    value: "Semantic"       },
              { label: "Embedder",   value: "BGE-M3"         },
              { label: "NER",        value: "spaCy + GPT-4o" },
              { label: "Chunk size", value: "1024 tokens"    },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-1.5">
                <span className="text-foreground font-medium">{item.label}:</span>
                <Badge variant="outline" className="h-4 text-[10px]">{item.value}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Document List */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search documents..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
          <Select value={filter} onValueChange={setFilter}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="queued">Queued</SelectItem>
              <SelectItem value="error">Error</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="grid grid-cols-[2fr_80px_80px_110px_80px_80px_40px] gap-2 px-4 py-2 bg-muted/30 text-[10px] text-muted-foreground uppercase tracking-wider font-medium border-b border-border">
            <span>Document</span>
            <span>Type</span>
            <span>Size</span>
            <span>Status</span>
            <span>Chunks</span>
            <span>Entities</span>
            <span />
          </div>

          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="grid grid-cols-[2fr_80px_80px_110px_80px_80px_40px] gap-2 items-center px-4 py-3 border-b border-border/50">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-4 w-4 rounded" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <Skeleton className="h-4 w-12" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-10" />
                <Skeleton className="h-4 w-10" />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-12 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search || filter !== "all" ? "No documents match your filters" : "No documents yet — upload your first file"}
              </p>
            </div>
          ) : (
            filtered.map((doc) => {
              const cfg = statusConfig[doc.status]
              const StatusIcon = cfg.icon
              const typeKey = doc.file_type.toLowerCase()
              return (
                <div
                  key={doc.id}
                  className="grid grid-cols-[2fr_80px_80px_110px_80px_80px_40px] gap-2 items-center px-4 py-3 border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-medium truncate">{doc.name}</p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(doc.created_at)}</p>
                    </div>
                  </div>
                  <div>
                    <Badge className={`text-[10px] h-4 px-1.5 uppercase ${typeColors[typeKey] ?? "bg-muted text-muted-foreground"}`}>
                      {doc.file_type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">{formatFileSize(doc.size)}</span>
                  <div>
                    <Badge variant="outline" className={`text-[10px] h-4 px-1.5 gap-0.5 ${cfg.color}`}>
                      <StatusIcon className="h-2.5 w-2.5" />
                      {cfg.label}
                    </Badge>
                    {doc.status === "error" && doc.error_message && (
                      <p className="text-[9px] text-destructive mt-0.5 truncate max-w-[90px]" title={doc.error_message}>
                        {doc.error_message}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">{doc.chunks != null ? doc.chunks.toLocaleString() : "—"}</span>
                  <span className="text-xs text-muted-foreground">{doc.entities != null ? doc.entities.toLocaleString() : "—"}</span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem className="text-xs gap-2">
                        <Share2 className="h-3.5 w-3.5" />
                        View in graph
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-xs gap-2">
                        <RefreshCw className="h-3.5 w-3.5" />
                        Re-ingest
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-xs gap-2 text-destructive"
                        onClick={() => deleteDocument(doc.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
