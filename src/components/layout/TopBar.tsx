import type { Page } from "@/App"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { ModeToggle } from "@/components/mode-toggle"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import { Bell, Command, Search, Sparkles } from "lucide-react"

const pageLabels: Record<Page, string> = {
  dashboard: "Dashboard",
  chat: "Chat",
  documents: "Documents",
  graph: "Knowledge Graph",
  eval: "Evaluation",
  analytics: "Analytics",
  pipeline: "Pipeline",
  workflows: "Workflows",
  settings: "Settings",
}

interface TopBarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function TopBar({ currentPage }: TopBarProps) {
  return (
    <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-background/80 backdrop-blur-sm px-4">
      <SidebarTrigger className="-ml-1 h-7 w-7" />
      <Separator orientation="vertical" className="h-4" />

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <span className="text-muted-foreground text-sm">OmniRAG</span>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage className="text-sm font-medium">
              {pageLabels[currentPage]}
            </BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs text-muted-foreground border-border/60 hover:border-primary/40 hover:text-foreground hidden sm:flex"
        >
          <Search className="h-3 w-3" />
          <span>Search</span>
          <kbd className="hidden sm:inline-flex h-4 items-center gap-0.5 rounded border border-border/60 bg-muted px-1 text-[10px] font-mono">
            <Command className="h-2.5 w-2.5" />K
          </kbd>
        </Button>

        <Badge
          variant="outline"
          className="hidden md:flex h-5 gap-1 border-chart-2/40 text-chart-2 text-[10px]"
        >
          <Sparkles className="h-2.5 w-2.5" />
          v2.1 Live
        </Badge>

        <Button variant="ghost" size="icon" className="h-7 w-7 relative">
          <Bell className="h-3.5 w-3.5" />
          <span className="absolute top-1 right-1 h-1.5 w-1.5 rounded-full bg-primary" />
        </Button>

        <ModeToggle />
      </div>
    </header>
  )
}
