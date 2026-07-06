import type { Page } from "@/App"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  FileText,
  MessageSquare,
  Share2,
  Zap,
  TrendingUp,
  ArrowRight,
  Database,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Workflow,
  GitMerge,
} from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"
import { timeAgo } from "@/lib/types"

const queryVolumeData = [
  { day: "Mon", queries: 12 },
  { day: "Tue", queries: 19 },
  { day: "Wed", queries: 24 },
  { day: "Thu", queries: 20 },
  { day: "Fri", queries: 32 },
  { day: "Sat", queries: 27 },
  { day: "Sun", queries: 36 },
]

const retrievalData = [
  { model: "Dense", score: 0.87, hits: 2340 },
  { model: "Sparse", score: 0.74, hits: 1890 },
  { model: "Hybrid", score: 0.93, hits: 3120 },
  { model: "Graph", score: 0.81, hits: 1456 },
  { model: "Rerank", score: 0.96, hits: 2890 },
]

const chartConfig = {
  queries: { label: "Queries", color: "var(--chart-1)" },
  tokens: { label: "Tokens", color: "var(--chart-2)" },
  score: { label: "Score", color: "var(--chart-1)" },
  hits: { label: "Hits", color: "var(--chart-2)" },
}

interface DashboardPageProps {
  onNavigate: (page: Page) => void
}

export default function DashboardPage({ onNavigate }: DashboardPageProps) {
  const { stats, activity, loading } = useDashboard()

  const statCards = [
    {
      label: "Total Documents",
      value: stats.totalDocuments.toLocaleString(),
      change: "ready",
      trend: "up" as const,
      icon: FileText,
      iconColor: "text-chart-1",
      iconBg: "bg-chart-1/10",
      sub: `${stats.totalChunks.toLocaleString()} chunks indexed`,
    },
    {
      label: "Queries Today",
      value: stats.queriesToday.toLocaleString(),
      change: `${stats.totalQueries} total`,
      trend: "up" as const,
      icon: MessageSquare,
      iconColor: "text-chart-2",
      iconBg: "bg-chart-2/10",
      sub: "All-time queries",
    },
    {
      label: "Graph Entities",
      value: stats.totalEntities.toLocaleString(),
      change: "+0",
      trend: "up" as const,
      icon: Share2,
      iconColor: "text-chart-3",
      iconBg: "bg-chart-3/10",
      sub: "Extracted entities",
    },
    {
      label: "Latest Eval",
      value: stats.latestEval ? `${(stats.latestEval.faithfulness / 100).toFixed(2)}` : "—",
      change: stats.latestEval?.name ?? "No runs",
      trend: "up" as const,
      icon: Zap,
      iconColor: "text-chart-4",
      iconBg: "bg-chart-4/10",
      sub: "Faithfulness score",
    },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Platform Overview
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Real-time metrics across your Agentic Graph RAG system
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className={`gap-1 text-xs ${stats.systemStatus === "healthy" ? "border-chart-2/40 text-chart-2" : "border-chart-3/40 text-chart-3"}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${stats.systemStatus === "healthy" ? "bg-chart-2" : "bg-chart-3"} animate-pulse`} />
            {stats.systemStatus === "healthy" ? "Live" : "Degraded"}
          </Badge>
          <Button size="sm" onClick={() => onNavigate("chat")} className="gap-1.5">
            <MessageSquare className="h-3.5 w-3.5" />
            New Chat
          </Button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-start justify-between">
                    <Skeleton className="h-8 w-8 rounded-lg" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <div className="mt-3 space-y-1">
                    <Skeleton className="h-7 w-20" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                </CardContent>
              </Card>
            ))
          : statCards.map((stat) => {
              const Icon = stat.icon
              return (
                <Card key={stat.label} className="bg-card border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start justify-between">
                      <div className={`p-2 rounded-lg ${stat.iconBg}`}>
                        <Icon className={`h-4 w-4 ${stat.iconColor}`} />
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 border-chart-2/40 text-chart-2">
                        <TrendingUp className="h-2.5 w-2.5 mr-0.5" />
                        {stat.change}
                      </Badge>
                    </div>
                    <div className="mt-3">
                      <div className="text-2xl font-bold tracking-tight">{stat.value}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                  <div className="text-[10px] text-muted-foreground/60 mt-1">{stat.sub}</div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {/* Query Volume */}
        <Card className="lg:col-span-3 bg-card border-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Query Volume</CardTitle>
              <Badge variant="outline" className="text-[10px] h-5">7d</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[160px] w-full">
              <AreaChart data={queryVolumeData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="queryGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="queries"
                  stroke="var(--chart-1)"
                  strokeWidth={2}
                  fill="url(#queryGrad)"
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        {/* Retrieval Performance */}
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Retrieval Scores</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[160px] w-full">
              <BarChart data={retrievalData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="model" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.6, 1.0]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="score" fill="var(--chart-1)" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* System Health */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-chart-2" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "Vector DB (Qdrant)", value: 98, color: "bg-chart-2" },
              { label: "Graph DB (Neo4j)", value: 94, color: "bg-chart-1" },
              { label: "LLM Gateway", value: 99, color: "bg-chart-2" },
              { label: "Redis Cache", value: 87, color: "bg-chart-3" },
              { label: "Celery Workers", value: 91, color: "bg-chart-4" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-medium text-chart-2">{item.value}%</span>
                </div>
                <Progress value={item.value} className="h-1" />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-chart-3" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { label: "Start new conversation", icon: MessageSquare, page: "chat" as Page, color: "text-chart-1" },
              { label: "Upload documents", icon: FileText, page: "documents" as Page, color: "text-chart-2" },
              { label: "Explore knowledge graph", icon: Share2, page: "graph" as Page, color: "text-chart-3" },
              { label: "View data pipeline", icon: Workflow, page: "pipeline" as Page, color: "text-chart-4" },
              { label: "CRAG & LangGraph workflows", icon: GitMerge, page: "workflows" as Page, color: "text-chart-5" },
              { label: "Run RAGAS evaluation", icon: Database, page: "eval" as Page, color: "text-primary" },
              { label: "View analytics", icon: Activity, page: "analytics" as Page, color: "text-chart-2" },
            ].map((action) => {
              const Icon = action.icon
              return (
                <Button
                  key={action.label}
                  variant="ghost"
                  className="w-full justify-start h-8 text-xs gap-2 hover:bg-accent"
                  onClick={() => onNavigate(action.page)}
                >
                  <Icon className={`h-3.5 w-3.5 ${action.color}`} />
                  {action.label}
                  <ArrowRight className="ml-auto h-3 w-3 text-muted-foreground" />
                </Button>
              )
            })}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex items-start gap-2 py-1">
                    <Skeleton className="h-3.5 w-3.5 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-2.5 w-16" />
                    </div>
                  </div>
                ))
              : activity.length === 0
                ? (
                  <div className="flex flex-col items-center gap-1 py-4 text-center">
                    <Activity className="h-6 w-6 text-muted-foreground/40" />
                    <p className="text-xs text-muted-foreground">No recent activity</p>
                  </div>
                )
                : activity.slice(0, 5).map((act, i) => (
                  <div key={act.id ?? i} className="flex items-start gap-2 py-1">
                    {act.status === "success" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-chart-2 shrink-0 mt-0.5" />
                    ) : act.status === "warning" ? (
                      <AlertCircle className="h-3.5 w-3.5 text-chart-3 shrink-0 mt-0.5" />
                    ) : (
                      <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground/80 leading-tight truncate">
                        {act.message}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{timeAgo(act.created_at)}</p>
                    </div>
                  </div>
                ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
