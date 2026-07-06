import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { DollarSign, Clock, Activity, Users } from "lucide-react"
import { useDashboard } from "@/hooks/useDashboard"

const tokenData = [
  { model: "GPT-4o", tokens: 1240000, cost: 12.4 },
  { model: "GPT-4o mini", tokens: 3480000, cost: 3.48 },
  { model: "BGE-M3", tokens: 8920000, cost: 0.89 },
  { model: "Cohere Rerank", tokens: 2340000, cost: 4.68 },
]

const pieData = [
  { name: "Vector Search", value: 42 },
  { name: "Graph RAG", value: 28 },
  { name: "Hybrid", value: 22 },
  { name: "Web Agent", value: 8 },
]

const PIE_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)"]

const chartConfig = {
  queries: { label: "Queries", color: "var(--chart-1)" },
  cost: { label: "Cost ($)", color: "var(--chart-2)" },
  latency: { label: "Latency (s)", color: "var(--chart-3)" },
  tokens: { label: "Tokens", color: "var(--chart-1)" },
}

const latencyData = [
  { day: "Mon", latency: 1.8 },
  { day: "Tue", latency: 1.6 },
  { day: "Wed", latency: 2.1 },
  { day: "Thu", latency: 1.4 },
  { day: "Fri", latency: 1.2 },
  { day: "Sat", latency: 1.3 },
  { day: "Sun", latency: 1.1 },
]

export default function AnalyticsPage() {
  const { stats, loading } = useDashboard()

  const dailyData = [
    { day: "Mon", queries: Math.max(1, Math.floor(stats.queriesToday / 7)) },
    { day: "Tue", queries: Math.max(1, Math.floor(stats.queriesToday / 7) + 2) },
    { day: "Wed", queries: Math.max(1, Math.floor(stats.queriesToday / 6)) },
    { day: "Thu", queries: Math.max(1, Math.floor(stats.queriesToday / 5)) },
    { day: "Fri", queries: Math.max(1, Math.floor(stats.queriesToday / 4)) },
    { day: "Sat", queries: Math.max(1, Math.floor(stats.queriesToday / 6)) },
    { day: "Sun", queries: stats.queriesToday },
  ]

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Usage, performance, and cost intelligence
          </p>
        </div>
        <Badge variant="outline" className="text-xs gap-1 border-muted-foreground/30">
          <Clock className="h-3 w-3" />
          Last 7 days
        </Badge>
      </div>

      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-4 pb-4">
                  <div className="flex items-center justify-between mb-2">
                    <Skeleton className="h-6 w-6 rounded-md" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-7 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          : [
              { label: "Total Queries", value: stats.totalQueries.toLocaleString(), change: "all-time", icon: Activity, trend: "up", color: "text-chart-1" },
              { label: "Queries Today", value: stats.queriesToday.toLocaleString(), change: "today", icon: Clock, trend: "up", color: "text-chart-2" },
              { label: "Total Documents", value: stats.totalDocuments.toLocaleString(), change: "ready", icon: DollarSign, trend: "up", color: "text-chart-3" },
              { label: "Total Entities", value: stats.totalEntities.toLocaleString(), change: "graph", icon: Users, trend: "up", color: "text-chart-4" },
            ].map((kpi) => {
              const Icon = kpi.icon
              return (
                <Card key={kpi.label} className="bg-card border-border">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="p-1.5 rounded-md bg-muted">
                        <Icon className={`h-4 w-4 ${kpi.color}`} />
                      </div>
                      <Badge variant="outline" className="text-[10px] h-4 border-chart-2/40 text-chart-2">
                        {kpi.change}
                      </Badge>
                    </div>
                    <p className="text-2xl font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </CardContent>
                </Card>
              )
            })}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Daily Query Volume</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[180px] w-full">
              <AreaChart data={dailyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="queryFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area type="monotone" dataKey="queries" stroke="var(--chart-1)" strokeWidth={2} fill="url(#queryFill)" />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Strategy Distribution</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <ChartContainer config={chartConfig} className="h-[140px] w-full">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i]} fillOpacity={0.8} />
                  ))}
                </Pie>
                <ChartTooltip content={<ChartTooltipContent />} />
              </PieChart>
            </ChartContainer>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 mt-2">
              {pieData.map((item, i) => (
                <div key={item.name} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  <div className="h-2 w-2 rounded-sm shrink-0" style={{ backgroundColor: PIE_COLORS[i] }} />
                  <span className="truncate">{item.name}</span>
                  <span className="font-medium text-foreground">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Response Latency (s)</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[160px] w-full">
              <LineChart data={latencyData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line type="monotone" dataKey="latency" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Token Cost by Model</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={chartConfig} className="h-[160px] w-full">
              <BarChart data={tokenData} layout="vertical" margin={{ top: 4, right: 60, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                <YAxis dataKey="model" type="category" tick={{ fontSize: 9, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} width={70} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="cost" fill="var(--chart-2)" radius={[0, 3, 3, 0]} />
              </BarChart>
            </ChartContainer>
          </CardContent>
        </Card>
      </div>

      {/* Cost Breakdown Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-chart-3" />
            Token Usage Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[180px_1fr_100px_100px] gap-2 px-4 py-2 bg-muted/30 text-[10px] text-muted-foreground uppercase tracking-wider font-medium border-b border-border">
              <span>Model</span>
              <span>Usage</span>
              <span>Tokens</span>
              <span>Cost</span>
            </div>
            {tokenData.map((row) => (
              <div
                key={row.model}
                className="grid grid-cols-[180px_1fr_100px_100px] gap-2 items-center px-4 py-2.5 border-b border-border/50 last:border-0"
              >
                <span className="text-xs font-medium">{row.model}</span>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-chart-2 rounded-full"
                    style={{ width: `${(row.cost / 12.4) * 100}%` }}
                  />
                </div>
                <span className="text-xs text-muted-foreground">{(row.tokens / 1000000).toFixed(1)}M</span>
                <span className="text-xs font-medium text-chart-2">${row.cost.toFixed(2)}</span>
              </div>
            ))}
            <div className="grid grid-cols-[180px_1fr_100px_100px] gap-2 items-center px-4 py-2.5 bg-muted/20 text-xs font-semibold border-t border-border">
              <span>Total</span>
              <span />
              <span className="text-muted-foreground">15.98M</span>
              <span className="text-chart-3">$21.45</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
