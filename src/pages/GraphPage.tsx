import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Filter,
  Info,
  X,
  FileText,
  Building2,
  User,
  Lightbulb,
  Cpu,
} from "lucide-react"

type NodeType = "org" | "tech" | "person" | "concept"

type GraphNode = {
  id: string
  label: string
  type: NodeType
  x: number
  y: number
  description: string
  relations: number
  chunks: number
}

type GraphEdge = {
  from: string
  to: string
  label: string
}

const nodes: GraphNode[] = [
  { id: "openai", label: "OpenAI", type: "org", x: 360, y: 260, description: "AI research company founded in 2015", relations: 8, chunks: 24 },
  { id: "gpt4", label: "GPT-4", type: "tech", x: 520, y: 160, description: "Large multimodal language model by OpenAI", relations: 7, chunks: 18 },
  { id: "claude", label: "Claude 3", type: "tech", x: 540, y: 360, description: "Constitutional AI model by Anthropic", relations: 5, chunks: 12 },
  { id: "anthropic", label: "Anthropic", type: "org", x: 670, y: 280, description: "AI safety company founded by ex-OpenAI researchers", relations: 4, chunks: 16 },
  { id: "sam", label: "Sam Altman", type: "person", x: 200, y: 160, description: "CEO of OpenAI, former YC president", relations: 3, chunks: 8 },
  { id: "transformer", label: "Transformer", type: "concept", x: 420, y: 420, description: "Attention-based neural architecture", relations: 6, chunks: 31 },
  { id: "rlhf", label: "RLHF", type: "concept", x: 240, y: 360, description: "Reinforcement Learning from Human Feedback", relations: 4, chunks: 14 },
  { id: "microsoft", label: "Microsoft", type: "org", x: 140, y: 280, description: "Major investor and partner of OpenAI", relations: 3, chunks: 9 },
  { id: "langchain", label: "LangChain", type: "tech", x: 620, y: 440, description: "LLM application framework", relations: 4, chunks: 21 },
  { id: "rag", label: "RAG", type: "concept", x: 700, y: 180, description: "Retrieval-Augmented Generation paradigm", relations: 5, chunks: 28 },
  { id: "embeddings", label: "Embeddings", type: "tech", x: 180, y: 440, description: "Vector representations of text/data", relations: 4, chunks: 17 },
  { id: "llama", label: "Llama 3", type: "tech", x: 90, y: 400, description: "Open-source LLM by Meta AI", relations: 3, chunks: 11 },
]

const edges: GraphEdge[] = [
  { from: "openai", to: "gpt4", label: "created" },
  { from: "anthropic", to: "claude", label: "created" },
  { from: "sam", to: "openai", label: "leads" },
  { from: "gpt4", to: "transformer", label: "uses" },
  { from: "claude", to: "rlhf", label: "trained_with" },
  { from: "microsoft", to: "openai", label: "invested" },
  { from: "openai", to: "rlhf", label: "developed" },
  { from: "langchain", to: "rag", label: "implements" },
  { from: "rag", to: "embeddings", label: "requires" },
  { from: "gpt4", to: "langchain", label: "powers" },
  { from: "llama", to: "transformer", label: "uses" },
  { from: "rag", to: "transformer", label: "uses" },
  { from: "embeddings", to: "transformer", label: "derived_from" },
  { from: "openai", to: "rag", label: "pioneered" },
]

const nodeTypeConfig: Record<NodeType, { color: string; bg: string; border: string; icon: typeof Share2; shape: string }> = {
  org: { color: "text-chart-1", bg: "fill-chart-1", border: "stroke-chart-1", icon: Building2, shape: "hexagon" },
  tech: { color: "text-chart-2", bg: "fill-chart-2", border: "stroke-chart-2", icon: Cpu, shape: "square" },
  person: { color: "text-chart-4", bg: "fill-chart-4", border: "stroke-chart-4", icon: User, shape: "circle" },
  concept: { color: "text-chart-3", bg: "fill-chart-3", border: "stroke-chart-3", icon: Lightbulb, shape: "diamond" },
}

function hexagonPath(cx: number, cy: number, r: number): string {
  const angles = [0, 60, 120, 180, 240, 300]
  return angles
    .map((a, i) => {
      const rad = (a - 90) * (Math.PI / 180)
      return `${i === 0 ? "M" : "L"} ${cx + r * Math.cos(rad)} ${cy + r * Math.sin(rad)}`
    })
    .join(" ") + " Z"
}

function diamondPath(cx: number, cy: number, r: number): string {
  return `M ${cx} ${cy - r} L ${cx + r} ${cy} L ${cx} ${cy + r} L ${cx - r} ${cy} Z`
}

export default function GraphPage() {
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null)
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [visibleTypes, setVisibleTypes] = useState<Set<NodeType>>(
    new Set(["org", "tech", "person", "concept"])
  )
  const [zoom, setZoom] = useState(1)

  const toggleType = (type: NodeType) => {
    setVisibleTypes((prev) => {
      const next = new Set(prev)
      if (next.has(type)) {
        next.delete(type)
      } else {
        next.add(type)
      }
      return next
    })
  }

  const visibleNodes = nodes.filter((n) => visibleTypes.has(n.type))
  const visibleNodeIds = new Set(visibleNodes.map((n) => n.id))
  const visibleEdges = edges.filter(
    (e) => visibleNodeIds.has(e.from) && visibleNodeIds.has(e.to)
  )

  const getNodeCenter = (id: string) => nodes.find((n) => n.id === id)

  const isHighlighted = (nodeId: string) => {
    if (!hoveredNode) return true
    if (nodeId === hoveredNode) return true
    return edges.some(
      (e) =>
        (e.from === hoveredNode && e.to === nodeId) ||
        (e.to === hoveredNode && e.from === nodeId)
    )
  }

  const isEdgeHighlighted = (edge: GraphEdge) => {
    if (!hoveredNode) return true
    return edge.from === hoveredNode || edge.to === hoveredNode
  }

  return (
    <div className="flex h-[calc(100svh-3rem)] overflow-hidden">
      {/* Main Graph Canvas */}
      <div className="flex-1 relative overflow-hidden bg-background">
        {/* Controls */}
        <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-2 space-y-1">
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.min(z + 0.2, 2))}>
                <ZoomIn className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom((z) => Math.max(z - 0.2, 0.5))}>
                <ZoomOut className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setZoom(1)}>
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Filter Panel */}
        <div className="absolute top-4 right-4 z-10">
          <Card className="bg-card/90 border-border backdrop-blur-sm w-44">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-medium flex items-center gap-1.5">
                <Filter className="h-3.5 w-3.5" />
                Node Types
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-1.5">
              {(Object.entries(nodeTypeConfig) as [NodeType, typeof nodeTypeConfig.org][]).map(([type, cfg]) => {
                const Icon = cfg.icon
                const count = nodes.filter((n) => n.type === type).length
                return (
                  <button
                    key={type}
                    onClick={() => toggleType(type)}
                    className={`w-full flex items-center gap-2 text-xs rounded-md px-2 py-1.5 transition-colors ${
                      visibleTypes.has(type) ? "bg-accent text-foreground" : "text-muted-foreground opacity-50"
                    }`}
                  >
                    <Icon className={`h-3.5 w-3.5 ${cfg.color}`} />
                    <span className="capitalize flex-1 text-left">{type}</span>
                    <Badge variant="outline" className="text-[10px] h-4 px-1">
                      {count}
                    </Badge>
                  </button>
                )
              })}
            </CardContent>
          </Card>
        </div>

        {/* Graph Stats */}
        <div className="absolute bottom-4 left-4 z-10">
          <Card className="bg-card/90 border-border backdrop-blur-sm">
            <CardContent className="p-3 flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <Share2 className="h-3.5 w-3.5 text-primary" />
                <span>{visibleNodes.length} nodes</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span>{visibleEdges.length} edges</span>
              <Separator orientation="vertical" className="h-4" />
              <span>{(zoom * 100).toFixed(0)}% zoom</span>
            </CardContent>
          </Card>
        </div>

        {/* SVG Graph */}
        <svg
          width="100%"
          height="100%"
          viewBox="0 0 800 560"
          className="cursor-grab active:cursor-grabbing"
          style={{ transform: `scale(${zoom})`, transformOrigin: "center center", transition: "transform 0.2s" }}
        >
          {/* Subtle grid */}
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.3" className="text-border/30" />
            </pattern>
            <marker id="arrowhead" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" className="fill-muted-foreground/30" />
            </marker>
          </defs>
          <rect width="800" height="560" fill="url(#grid)" />

          {/* Edges */}
          {visibleEdges.map((edge, i) => {
            const fromNode = getNodeCenter(edge.from)
            const toNode = getNodeCenter(edge.to)
            if (!fromNode || !toNode) return null
            const highlighted = isEdgeHighlighted(edge)
            const mx = (fromNode.x + toNode.x) / 2
            const my = (fromNode.y + toNode.y) / 2
            return (
              <g key={i}>
                <line
                  x1={fromNode.x}
                  y1={fromNode.y}
                  x2={toNode.x}
                  y2={toNode.y}
                  stroke={highlighted ? "var(--primary)" : "var(--border)"}
                  strokeWidth={highlighted ? 1.5 : 1}
                  strokeOpacity={highlighted ? 0.6 : 0.3}
                  markerEnd="url(#arrowhead)"
                  strokeDasharray={highlighted ? "none" : "4,4"}
                  style={{ transition: "all 0.2s" }}
                />
                {highlighted && (
                  <text
                    x={mx}
                    y={my - 4}
                    textAnchor="middle"
                    fontSize="8"
                    fill="var(--muted-foreground)"
                    opacity="0.8"
                    className="pointer-events-none select-none"
                  >
                    {edge.label}
                  </text>
                )}
              </g>
            )
          })}

          {/* Nodes */}
          {visibleNodes.map((node) => {
            const isHovered = hoveredNode === node.id
            const isSelected = selectedNode?.id === node.id
            const highlighted = isHighlighted(node.id)
            const r = isHovered || isSelected ? 22 : 18
            const opacity = highlighted ? 1 : 0.3

            return (
              <g
                key={node.id}
                style={{ transition: "all 0.2s", opacity, cursor: "pointer" }}
                onMouseEnter={() => setHoveredNode(node.id)}
                onMouseLeave={() => setHoveredNode(null)}
                onClick={() => setSelectedNode(selectedNode?.id === node.id ? null : node)}
              >
                {/* Glow ring for selected */}
                {isSelected && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r + 8}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="2"
                    strokeOpacity="0.4"
                  />
                )}

                {/* Node shape */}
                {node.type === "org" && (
                  <path
                    d={hexagonPath(node.x, node.y, r)}
                    fill={`var(--chart-1)`}
                    fillOpacity="0.2"
                    stroke={`var(--chart-1)`}
                    strokeWidth={isHovered || isSelected ? 2 : 1.5}
                  />
                )}
                {node.type === "tech" && (
                  <rect
                    x={node.x - r}
                    y={node.y - r}
                    width={r * 2}
                    height={r * 2}
                    rx="4"
                    fill={`var(--chart-2)`}
                    fillOpacity="0.2"
                    stroke={`var(--chart-2)`}
                    strokeWidth={isHovered || isSelected ? 2 : 1.5}
                  />
                )}
                {node.type === "person" && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r={r}
                    fill={`var(--chart-4)`}
                    fillOpacity="0.2"
                    stroke={`var(--chart-4)`}
                    strokeWidth={isHovered || isSelected ? 2 : 1.5}
                  />
                )}
                {node.type === "concept" && (
                  <path
                    d={diamondPath(node.x, node.y, r)}
                    fill={`var(--chart-3)`}
                    fillOpacity="0.2"
                    stroke={`var(--chart-3)`}
                    strokeWidth={isHovered || isSelected ? 2 : 1.5}
                  />
                )}

                {/* Label */}
                <text
                  x={node.x}
                  y={node.y + r + 13}
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight={isHovered || isSelected ? "600" : "400"}
                  fill="var(--foreground)"
                  opacity={highlighted ? 0.9 : 0.4}
                  className="pointer-events-none select-none"
                >
                  {node.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* Right Panel - Entity Detail */}
      <div
        className={`border-l border-border bg-card transition-all duration-300 overflow-hidden ${
          selectedNode ? "w-72" : "w-0"
        }`}
      >
        {selectedNode && (
          <div className="w-72 flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                {(() => {
                  const Icon = nodeTypeConfig[selectedNode.type].icon
                  return <Icon className={`h-4 w-4 ${nodeTypeConfig[selectedNode.type].color}`} />
                })()}
                <span className="text-sm font-semibold">{selectedNode.label}</span>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setSelectedNode(null)}>
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1 scrollbar-thin">
              <div className="p-4 space-y-4">
                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Type</p>
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${nodeTypeConfig[selectedNode.type].color}`}
                  >
                    {selectedNode.type}
                  </Badge>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">Description</p>
                  <p className="text-xs text-foreground/80 leading-relaxed">
                    {selectedNode.description}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Card className="bg-muted/30 border-border/60">
                    <CardContent className="p-2.5 text-center">
                      <p className="text-lg font-bold text-primary">{selectedNode.relations}</p>
                      <p className="text-[10px] text-muted-foreground">Relations</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-muted/30 border-border/60">
                    <CardContent className="p-2.5 text-center">
                      <p className="text-lg font-bold text-chart-2">{selectedNode.chunks}</p>
                      <p className="text-[10px] text-muted-foreground">Chunks</p>
                    </CardContent>
                  </Card>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Connected Entities
                  </p>
                  <div className="space-y-1.5">
                    {edges
                      .filter((e) => e.from === selectedNode.id || e.to === selectedNode.id)
                      .slice(0, 5)
                      .map((edge, i) => {
                        const otherId = edge.from === selectedNode.id ? edge.to : edge.from
                        const other = nodes.find((n) => n.id === otherId)
                        if (!other) return null
                        const OtherIcon = nodeTypeConfig[other.type].icon
                        return (
                          <button
                            key={i}
                            className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent text-left transition-colors"
                            onClick={() => setSelectedNode(other)}
                          >
                            <OtherIcon className={`h-3.5 w-3.5 shrink-0 ${nodeTypeConfig[other.type].color}`} />
                            <span className="text-xs flex-1">{other.label}</span>
                            <Badge variant="outline" className="text-[9px] h-4 px-1">
                              {edge.label}
                            </Badge>
                          </button>
                        )
                      })}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">
                    Source Documents
                  </p>
                  <div className="space-y-1.5">
                    {["GPT-4 Technical Report", "Scaling Laws Survey", "AI Research 2024"].slice(0, 2).map((doc, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3 shrink-0" />
                        <span className="truncate">{doc}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border">
              <Button size="sm" variant="outline" className="w-full text-xs gap-1.5">
                <Info className="h-3.5 w-3.5" />
                Query this entity
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
