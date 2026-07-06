import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts"
import {
  Play,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  Clock,
  BarChart3,
  Zap,
} from "lucide-react"
import { useEval, useEvalDocResults } from "@/hooks/useEval"
import { timeAgo } from "@/lib/types"

const chartConfig = {
  faithfulness: { label: "Faithfulness", color: "var(--chart-1)" },
  relevancy: { label: "Relevancy", color: "var(--chart-2)" },
  precision: { label: "Precision", color: "var(--chart-3)" },
  value: { label: "Score", color: "var(--chart-1)" },
}

export default function EvalPage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null)
  const { runs, loading, running, latestComplete, startRun } = useEval()
  const { results: docResults, loading: docLoading } = useEvalDocResults(selectedRunId)

  const latestRun = runs[0]
  const radarData = latestRun && latestRun.status === "complete"
    ? [
        { metric: "Faithfulness", value: latestRun.faithfulness ?? 0 },
        { metric: "Relevancy", value: latestRun.answer_relevancy ?? 0 },
        { metric: "Precision", value: latestRun.context_precision ?? 0 },
        { metric: "Recall", value: latestRun.context_recall ?? 0 },
        { metric: "Coherence", value: latestRun.coherence ?? 0 },
        { metric: "Groundedness", value: latestRun.groundedness ?? 0 },
      ]
    : []

  return (
    <div className="flex flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Evaluation</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            RAGAS + DeepEval framework — measure RAG pipeline quality
          </p>
        </div>
        <div className="flex items-center gap-2">
          {latestComplete && (
            <Badge variant="outline" className="gap-1 text-xs border-chart-2/40 text-chart-2">
              <CheckCircle2 className="h-3 w-3" />
              {latestComplete.name} complete
            </Badge>
          )}
          <Button size="sm" className="gap-1.5" disabled={running} onClick={() => startRun(5)}>
            {running ? (
              <>
                <Clock className="h-3.5 w-3.5 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5" />
                Run Evaluation
              </>
            )}
          </Button>
        </div>
      </div>

      {/* RAGAS Score Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Card key={i} className="bg-card border-border">
                <CardContent className="pt-4 pb-4">
                  <Skeleton className="h-4 w-4 rounded mb-2" />
                  <Skeleton className="h-6 w-16 mb-1" />
                  <Skeleton className="h-3 w-24" />
                </CardContent>
              </Card>
            ))
          : latestComplete
            ? [
                { label: "Faithfulness", value: (latestComplete.faithfulness ?? 0) / 100, icon: CheckCircle2 },
                { label: "Answer Relevancy", value: (latestComplete.answer_relevancy ?? 0) / 100, icon: BarChart3 },
                { label: "Context Precision", value: (latestComplete.context_precision ?? 0) / 100, icon: Zap },
                { label: "Context Recall", value: (latestComplete.context_recall ?? 0) / 100, icon: TrendingUp },
              ].map((metric) => {
                const Icon = metric.icon
                const pct = Math.round(metric.value * 100)
                return (
                  <Card key={metric.label} className="bg-card border-border">
                    <CardContent className="pt-4 pb-4">
                      <div className="flex items-center justify-between mb-2">
                        <Icon className="h-4 w-4 text-primary" />
                        <Badge variant="outline" className="text-[10px] h-4 border-chart-2/40 text-chart-2">
                          {pct}
                        </Badge>
                      </div>
                      <div className="text-2xl font-bold text-foreground mb-1">
                        {pct}
                        <span className="text-sm font-normal text-muted-foreground">/100</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{metric.label}</p>
                      <Progress value={pct} className="h-1 mt-2" />
                    </CardContent>
                  </Card>
                )
              })
            : (
              <div className="col-span-4 flex items-center justify-center py-8">
                <p className="text-sm text-muted-foreground">No evaluation runs yet. Click "Run Evaluation" to start.</p>
              </div>
            )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="h-8">
          <TabsTrigger value="overview" className="text-xs h-6">Overview</TabsTrigger>
          <TabsTrigger value="trends" className="text-xs h-6">Trends</TabsTrigger>
          <TabsTrigger value="runs" className="text-xs h-6">Run History</TabsTrigger>
          <TabsTrigger value="breakdown" className="text-xs h-6">Per Document</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {/* Radar Chart */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">RAGAS Metrics Radar</CardTitle>
              </CardHeader>
              <CardContent>
                {radarData.length > 0 ? (
                  <ChartContainer config={chartConfig} className="h-[260px] w-full">
                    <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="var(--border)" />
                      <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} />
                      <Radar
                        name="Score"
                        dataKey="value"
                        stroke="var(--chart-1)"
                        fill="var(--chart-1)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RadarChart>
                  </ChartContainer>
                ) : (
                  <div className="h-[260px] flex items-center justify-center">
                    <p className="text-sm text-muted-foreground">No data available</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Metric Bars */}
            <Card className="bg-card border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Metric Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {latestComplete
                  ? [
                      { label: "Faithfulness", value: latestComplete.faithfulness ?? 0, color: "bg-chart-1", desc: "Answer grounded in context" },
                      { label: "Answer Relevancy", value: latestComplete.answer_relevancy ?? 0, color: "bg-chart-2", desc: "Response addresses the query" },
                      { label: "Context Precision", value: latestComplete.context_precision ?? 0, color: "bg-chart-3", desc: "Retrieved context quality" },
                      { label: "Context Recall", value: latestComplete.context_recall ?? 0, color: "bg-chart-4", desc: "Coverage of ground truth" },
                      { label: "Coherence", value: latestComplete.coherence ?? 0, color: "bg-chart-5", desc: "Response fluency & structure" },
                      { label: "Groundedness", value: latestComplete.groundedness ?? 0, color: "bg-primary", desc: "Supported by source docs" },
                    ].map((m) => (
                      <div key={m.label} className="space-y-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="text-xs font-medium">{m.label}</span>
                            <span className="text-[10px] text-muted-foreground ml-2">{m.desc}</span>
                          </div>
                          <span className="text-xs font-bold">{m.value}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full ${m.color} rounded-full transition-all duration-500`}
                            style={{ width: `${m.value}%` }}
                          />
                        </div>
                      </div>
                    ))
                  : (
                    <div className="flex items-center justify-center py-8">
                      <p className="text-sm text-muted-foreground">No evaluation data available</p>
                    </div>
                  )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="mt-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Metric Trends — Eval History</CardTitle>
            </CardHeader>
            <CardContent>
              {runs.filter(r => r.status === "complete").length > 1 ? (
                <ChartContainer config={chartConfig} className="h-[280px] w-full">
                  <LineChart
                    data={runs.filter(r => r.status === "complete").slice(0, 10).reverse().map(r => ({
                      date: r.name,
                      faithfulness: (r.faithfulness ?? 0) / 100,
                      relevancy: (r.answer_relevancy ?? 0) / 100,
                      precision: (r.context_precision ?? 0) / 100,
                    }))}
                    margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0.5, 1.0]} tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line type="monotone" dataKey="faithfulness" stroke="var(--chart-1)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="relevancy" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="precision" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartContainer>
              ) : (
                <div className="h-[280px] flex items-center justify-center">
                  <p className="text-sm text-muted-foreground">Need at least 2 completed runs to show trends</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Run History Tab */}
        <TabsContent value="runs" className="mt-4">
          <div className="rounded-lg border border-border overflow-hidden">
            <div className="grid grid-cols-[100px_140px_80px_80px_80px_80px_80px] gap-2 px-4 py-2 bg-muted/30 text-[10px] text-muted-foreground uppercase tracking-wider font-medium border-b border-border">
              <span>Run ID</span>
              <span>Date</span>
              <span>Faith.</span>
              <span>Relev.</span>
              <span>Prec.</span>
              <span>Recall</span>
              <span>Status</span>
            </div>
            {loading
              ? Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[100px_140px_80px_80px_80px_80px_80px] gap-2 items-center px-4 py-3 border-b border-border/50">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Skeleton key={j} className="h-3 w-full" />
                    ))}
                  </div>
                ))
              : runs.length === 0
                ? (
                  <div className="flex items-center justify-center py-8">
                    <p className="text-sm text-muted-foreground">No evaluation runs yet</p>
                  </div>
                )
                : runs.map((run) => (
                  <div
                    key={run.id}
                    onClick={() => run.status === "complete" && setSelectedRunId(run.id)}
                    className={`grid grid-cols-[100px_140px_80px_80px_80px_80px_80px] gap-2 items-center px-4 py-3 border-b border-border/50 last:border-0 text-xs ${run.status === "complete" ? "hover:bg-muted/20 cursor-pointer" : ""}`}
                  >
                    <span className="font-mono text-primary">{run.name}</span>
                    <span className="text-muted-foreground">{timeAgo(run.created_at)}</span>
                    <span className={run.faithfulness ? "text-chart-1 font-medium" : "text-muted-foreground"}>
                      {run.faithfulness ? (run.faithfulness / 100).toFixed(2) : "—"}
                    </span>
                    <span className={run.answer_relevancy ? "text-chart-2 font-medium" : "text-muted-foreground"}>
                      {run.answer_relevancy ? (run.answer_relevancy / 100).toFixed(2) : "—"}
                    </span>
                    <span className={run.context_precision ? "text-chart-3 font-medium" : "text-muted-foreground"}>
                      {run.context_precision ? (run.context_precision / 100).toFixed(2) : "—"}
                    </span>
                    <span className={run.context_recall ? "text-chart-4 font-medium" : "text-muted-foreground"}>
                      {run.context_recall ? (run.context_recall / 100).toFixed(2) : "—"}
                    </span>
                    <div>
                      {run.status === "complete" ? (
                        <Badge variant="outline" className="text-[10px] h-4 border-chart-2/40 text-chart-2 gap-0.5">
                          <CheckCircle2 className="h-2.5 w-2.5" />
                          Done
                        </Badge>
                      ) : run.status === "running" ? (
                        <Badge variant="outline" className="text-[10px] h-4 border-chart-3/40 text-chart-3 gap-0.5">
                          <Clock className="h-2.5 w-2.5 animate-spin" />
                          Running
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] h-4 border-muted-foreground/40 text-muted-foreground">
                          {run.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
          </div>
        </TabsContent>

        {/* Per Document Tab */}
        <TabsContent value="breakdown" className="mt-4">
          {!selectedRunId
            ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-sm text-muted-foreground">Select a completed run from Run History to see per-document breakdown</p>
              </div>
            )
            : docLoading
              ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Card key={i} className="bg-card border-border">
                      <CardContent className="pt-3 pb-3">
                        <Skeleton className="h-4 w-48 mb-2" />
                        <Skeleton className="h-1.5 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )
              : docResults.length === 0
                ? (
                  <div className="flex items-center justify-center py-12">
                    <p className="text-sm text-muted-foreground">No document results for this run</p>
                  </div>
                )
                : (
                  <div className="space-y-2">
                    {docResults.map((doc) => (
                      <Card key={doc.id} className="bg-card border-border">
                        <CardContent className="pt-3 pb-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium truncate flex-1 mr-4">{doc.doc_name}</span>
                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-center">
                                <p className="text-xs font-bold text-chart-1">{doc.faithfulness}</p>
                                <p className="text-[9px] text-muted-foreground">Faith.</p>
                              </div>
                              <div className="text-center">
                                <p className="text-xs font-bold text-chart-2">{doc.relevancy}</p>
                                <p className="text-[9px] text-muted-foreground">Relev.</p>
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Faithfulness</span>
                                <span>{doc.faithfulness}%</span>
                              </div>
                              <Progress value={doc.faithfulness} className="h-1" />
                            </div>
                            <div className="flex-1 space-y-1">
                              <div className="flex justify-between text-[10px] text-muted-foreground">
                                <span>Relevancy</span>
                                <span>{doc.relevancy}%</span>
                              </div>
                              <Progress value={doc.relevancy} className="h-1" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}

          {docResults.length > 0 && (
            <div className="mt-3 flex items-center gap-2">
              <AlertCircle className="h-3.5 w-3.5 text-chart-3" />
              <p className="text-xs text-muted-foreground">
                Low-scoring documents may need re-chunking or additional context
              </p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
