import type { ReactNode } from "react"
import type { Page } from "@/App"
import AppSidebar from "./AppSidebar"
import TopBar from "./TopBar"
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar"

interface AppLayoutProps {
  children: ReactNode
  currentPage: Page
  onNavigate: (page: Page) => void
}

export default function AppLayout({ children, currentPage, onNavigate }: AppLayoutProps) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-svh w-full bg-background">
        <AppSidebar currentPage={currentPage} onNavigate={onNavigate} />
        <SidebarInset className="flex flex-col min-h-svh">
          <TopBar currentPage={currentPage} onNavigate={onNavigate} />
          <main className="flex-1 overflow-auto scrollbar-thin">
            {children}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  )
}
