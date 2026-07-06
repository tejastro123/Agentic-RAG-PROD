import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Settings,
  Cpu,
  Database,
  Shield,
  Bell,
  Key,
  Save,
  CheckCircle2,
  AlertCircle,
  Users,
  Zap,
} from "lucide-react"
import { useSettings } from "@/hooks/useSettings"

const apiKeys = [
  { name: "OpenAI API", key: "sk-...4f2a", status: "active", model: "GPT-4o" },
  { name: "Anthropic API", key: "sk-ant-...8c1b", status: "active", model: "Claude 3.5" },
  { name: "Cohere API", key: "...7d3e", status: "active", model: "Rerank v3" },
  { name: "LangSmith API", key: "ls__...2a4c", status: "active", model: "Tracing" },
]

const teamMembers = [
  { name: "AI Engineer", email: "ai@example.com", role: "Admin", lastActive: "Now" },
  { name: "Data Scientist", email: "ds@example.com", role: "Analyst", lastActive: "2h ago" },
  { name: "ML Engineer", email: "ml@example.com", role: "Ingester", lastActive: "1d ago" },
  { name: "Product Manager", email: "pm@example.com", role: "Viewer", lastActive: "3d ago" },
]

export default function SettingsPage() {
  const { settings, loading, saving, saved, update, save } = useSettings()

  return (
    <div className="flex flex-col gap-6 p-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Configure models, retrieval, and platform preferences
          </p>
        </div>
        <Button size="sm" className="gap-1.5" onClick={save} disabled={saving}>
          {saved ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Save className="h-3.5 w-3.5" />}
          {saved ? "Saved!" : saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="models">
        <TabsList className="h-8">
          <TabsTrigger value="models" className="text-xs h-6 gap-1.5">
            <Cpu className="h-3 w-3" />
            Models
          </TabsTrigger>
          <TabsTrigger value="retrieval" className="text-xs h-6 gap-1.5">
            <Database className="h-3 w-3" />
            Retrieval
          </TabsTrigger>
          <TabsTrigger value="keys" className="text-xs h-6 gap-1.5">
            <Key className="h-3 w-3" />
            API Keys
          </TabsTrigger>
          <TabsTrigger value="team" className="text-xs h-6 gap-1.5">
            <Users className="h-3 w-3" />
            Team
          </TabsTrigger>
          <TabsTrigger value="notifications" className="text-xs h-6 gap-1.5">
            <Bell className="h-3 w-3" />
            Alerts
          </TabsTrigger>
        </TabsList>

        {/* Models Tab */}
        <TabsContent value="models" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="h-4 w-4 text-primary" />
                LLM Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-20" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-xs">Primary LLM</Label>
                      <Select value={settings.primary_llm} onValueChange={(v) => update("primary_llm", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="GPT-4o">GPT-4o</SelectItem>
                          <SelectItem value="GPT-4o mini">GPT-4o mini</SelectItem>
                          <SelectItem value="Claude 3.5 Sonnet">Claude 3.5 Sonnet</SelectItem>
                          <SelectItem value="Claude 3 Opus">Claude 3 Opus</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Embedding Model</Label>
                      <Select value={settings.embedding_model} onValueChange={(v) => update("embedding_model", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="BGE-M3 (Hybrid)">BGE-M3 (Hybrid)</SelectItem>
                          <SelectItem value="text-embedding-3-large">text-embedding-3-large</SelectItem>
                          <SelectItem value="text-embedding-3-small">text-embedding-3-small</SelectItem>
                          <SelectItem value="Cohere embed-v3">Cohere embed-v3</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Reranker</Label>
                      <Select value={settings.reranker} onValueChange={(v) => update("reranker", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Cohere Rerank v3">Cohere Rerank v3</SelectItem>
                          <SelectItem value="BGE Cross-Encoder">BGE Cross-Encoder</SelectItem>
                          <SelectItem value="Jina Reranker v2">Jina Reranker v2</SelectItem>
                          <SelectItem value="None">None</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Retrieval Strategy</Label>
                      <Select value={settings.retrieval_strategy} onValueChange={(v) => update("retrieval_strategy", v)}>
                        <SelectTrigger className="h-8 text-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Adaptive RAG">Adaptive RAG</SelectItem>
                          <SelectItem value="Hybrid (fixed)">Hybrid (fixed)</SelectItem>
                          <SelectItem value="Graph RAG">Graph RAG</SelectItem>
                          <SelectItem value="Dense only">Dense only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <Label className="text-xs">Agent Features</Label>
                    <div className="space-y-2">
                      <div className="flex items-start justify-between gap-4 py-1.5">
                        <div>
                          <p className="text-xs font-medium">Self-RAG (iterative verification)</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">LLM evaluates and re-retrieves if needed</p>
                        </div>
                        <Switch checked={settings.self_rag} onCheckedChange={(v) => update("self_rag", v)} className="shrink-0" />
                      </div>
                      <div className="flex items-start justify-between gap-4 py-1.5">
                        <div>
                          <p className="text-xs font-medium">Corrective RAG (CRAG)</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Low-quality context triggers alternative retrieval</p>
                        </div>
                        <Switch checked={settings.corrective_rag} onCheckedChange={(v) => update("corrective_rag", v)} className="shrink-0" />
                      </div>
                      <div className="flex items-start justify-between gap-4 py-1.5">
                        <div>
                          <p className="text-xs font-medium">HyDE Query Expansion</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Generate hypothetical documents for better retrieval</p>
                        </div>
                        <Switch checked={settings.hyde} onCheckedChange={(v) => update("hyde", v)} className="shrink-0" />
                      </div>
                      <div className="flex items-start justify-between gap-4 py-1.5">
                        <div>
                          <p className="text-xs font-medium">Multi-agent workflow</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">Use LangGraph DAG for complex queries</p>
                        </div>
                        <Switch checked={settings.multi_agent} onCheckedChange={(v) => update("multi_agent", v)} className="shrink-0" />
                      </div>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Retrieval Tab */}
        <TabsContent value="retrieval" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Chunking Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {loading ? (
                <div className="space-y-4">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-6 w-full" />
                    </div>
                  ))}
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Chunk Size (tokens)</Label>
                      <Badge variant="outline" className="text-xs h-5">{settings.chunk_size}</Badge>
                    </div>
                    <Slider
                      value={[settings.chunk_size]}
                      onValueChange={(v) => update("chunk_size", v[0])}
                      min={256}
                      max={4096}
                      step={128}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>256</span>
                      <span>4096</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Chunk Overlap (tokens)</Label>
                      <Badge variant="outline" className="text-xs h-5">{settings.chunk_overlap}</Badge>
                    </div>
                    <Slider
                      value={[settings.chunk_overlap]}
                      onValueChange={(v) => update("chunk_overlap", v[0])}
                      min={0}
                      max={512}
                      step={32}
                      className="w-full"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs">Top-K Retrieval</Label>
                      <Badge variant="outline" className="text-xs h-5">{settings.top_k}</Badge>
                    </div>
                    <Slider
                      value={[settings.top_k]}
                      onValueChange={(v) => update("top_k", v[0])}
                      min={1}
                      max={20}
                      step={1}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-xs">Hybrid Retrieval Weights</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">Dense</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-chart-1 rounded-full" style={{ width: "60%" }} />
                      </div>
                      <span className="text-xs font-medium">0.6</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-16">Sparse</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-chart-2 rounded-full" style={{ width: "40%" }} />
                      </div>
                      <span className="text-xs font-medium">0.4</span>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* API Keys Tab */}
        <TabsContent value="keys" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                API Keys & Integrations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.name}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5 hover:border-border transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium">{key.name}</span>
                      <Badge variant="outline" className="text-[10px] h-4 border-chart-2/40 text-chart-2 gap-0.5">
                        <CheckCircle2 className="h-2.5 w-2.5" />
                        Active
                      </Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      <span className="font-mono">{key.key}</span> · {key.model}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs">
                    Rotate
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="w-full text-xs gap-1.5 mt-2">
                <Key className="h-3.5 w-3.5" />
                Add New API Key
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Team Tab */}
        <TabsContent value="team" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium">Team Members</CardTitle>
                <Button size="sm" variant="outline" className="h-7 text-xs gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Invite
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {teamMembers.map((member) => (
                <div
                  key={member.email}
                  className="flex items-center gap-3 rounded-lg border border-border/60 px-3 py-2.5"
                >
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-medium text-primary shrink-0">
                    {member.name.split(" ").map((n) => n[0]).join("")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{member.name}</p>
                    <p className="text-[10px] text-muted-foreground">{member.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{member.lastActive}</span>
                    <Select defaultValue={member.role.toLowerCase()}>
                      <SelectTrigger className="h-6 w-24 text-[10px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="analyst">Analyst</SelectItem>
                        <SelectItem value="ingester">Ingester</SelectItem>
                        <SelectItem value="viewer">Viewer</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                Document-Level Access Control
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[
                  { workspace: "Finance Documents", roles: ["Admin", "Analyst"], color: "text-chart-3" },
                  { workspace: "Engineering Wiki", roles: ["Admin", "Ingester", "Analyst"], color: "text-chart-2" },
                  { workspace: "HR Policies", roles: ["Admin"], color: "text-chart-5" },
                  { workspace: "Research Papers", roles: ["Admin", "Analyst", "Viewer"], color: "text-chart-1" },
                ].map((ws) => (
                  <div key={ws.workspace} className="flex items-center gap-2 py-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full bg-current ${ws.color} shrink-0`} />
                    <span className="text-xs flex-1">{ws.workspace}</span>
                    <div className="flex gap-1">
                      {ws.roles.map((role) => (
                        <Badge key={role} variant="outline" className="text-[9px] h-4 px-1">
                          {role}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="mt-4 space-y-4">
          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Alert Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { label: "Ingestion failures", desc: "Alert when document parsing fails", defaultChecked: true, icon: AlertCircle },
                { label: "Eval score drop", desc: "Alert when RAGAS metrics fall below threshold", defaultChecked: true, icon: Settings },
                { label: "High latency", desc: "Alert when query latency exceeds 3s", defaultChecked: false, icon: Zap },
                { label: "Cost spike", desc: "Alert when daily token cost exceeds $10", defaultChecked: true, icon: Bell },
                { label: "Graph extraction", desc: "Summary of new entities and relations added", defaultChecked: false, icon: CheckCircle2 },
              ].map((item) => {
                const Icon = item.icon
                return (
                  <div key={item.label} className="flex items-start justify-between gap-4 py-1.5 border-b border-border/40 last:border-0 pb-3">
                    <div className="flex items-start gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-medium">{item.label}</p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{item.desc}</p>
                      </div>
                    </div>
                    <Switch defaultChecked={item.defaultChecked} className="shrink-0" />
                  </div>
                )
              })}
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium">Webhook Endpoint</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                defaultValue="https://hooks.example.com/omnirag"
                className="h-8 text-xs font-mono"
              />
              <p className="text-[10px] text-muted-foreground">
                POSTed JSON payload includes event type, severity, and metadata
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
