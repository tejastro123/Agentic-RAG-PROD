import type { Page } from "@/App"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import {
  LayoutDashboard,
  MessageSquare,
  FileText,
  Share2,
  BarChart3,
  FlaskConical,
  Settings,
  Zap,
  ChevronRight,
  GitMerge,
  Workflow,
} from "lucide-react"

const navItems = [
  { id: "dashboard" as Page, label: "Dashboard", icon: LayoutDashboard },
  { id: "chat" as Page, label: "Chat", icon: MessageSquare },
  { id: "documents" as Page, label: "Documents", icon: FileText },
  { id: "graph" as Page, label: "Knowledge Graph", icon: Share2 },
  { id: "pipeline" as Page, label: "Pipeline", icon: Workflow },
  { id: "workflows" as Page, label: "Workflows", icon: GitMerge },
  { id: "eval" as Page, label: "Evaluation", icon: FlaskConical },
  { id: "analytics" as Page, label: "Analytics", icon: BarChart3 },
]

interface AppSidebarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function AppSidebar({ currentPage, onNavigate }: AppSidebarProps) {
  const { state } = useSidebar()
  const isCollapsed = state === "collapsed"

  return (
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2.5 px-1">
          <div className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary glow-violet">
            <Zap className="h-4 w-4 text-primary-foreground" />
            <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-chart-2 ring-2 ring-sidebar" />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-sidebar-foreground leading-none">
                OmniRAG
              </span>
              <span className="text-[10px] text-muted-foreground leading-none mt-0.5">
                Agentic Graph Platform
              </span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent className="px-2 py-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive = currentPage === item.id
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.label}
                      onClick={() => onNavigate(item.id)}
                      className="h-9 cursor-pointer"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                      {isActive && !isCollapsed && (
                        <ChevronRight className="ml-auto h-3 w-3 text-primary opacity-70" />
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                )
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-2" />

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive={currentPage === "settings"}
                  tooltip="Settings"
                  onClick={() => onNavigate("settings")}
                  className="h-9 cursor-pointer"
                >
                  <Settings className="h-4 w-4" />
                  <span>Settings</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 py-3">
        <SidebarSeparator className="mb-3" />
        <div className="flex items-center gap-2.5 px-1">
          <Avatar size="sm" className="shrink-0">
            <AvatarImage src="" />
            <AvatarFallback className="bg-primary/20 text-primary text-xs">
              AE
            </AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col min-w-0">
              <span className="text-xs font-medium text-sidebar-foreground truncate">
                AI Engineer
              </span>
              <div className="flex items-center gap-1 mt-0.5">
                <Badge
                  variant="outline"
                  className="h-3.5 px-1 text-[9px] border-primary/30 text-primary"
                >
                  Admin
                </Badge>
              </div>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
