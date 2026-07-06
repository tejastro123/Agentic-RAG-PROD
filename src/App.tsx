import { useState } from "react"
import AppLayout from "@/components/layout/AppLayout"
import DashboardPage from "@/pages/DashboardPage"
import ChatPage from "@/pages/ChatPage"
import DocumentsPage from "@/pages/DocumentsPage"
import GraphPage from "@/pages/GraphPage"
import EvalPage from "@/pages/EvalPage"
import AnalyticsPage from "@/pages/AnalyticsPage"
import SettingsPage from "@/pages/SettingsPage"
import PipelinePage from "@/pages/PipelinePage"
import WorkflowsPage from "@/pages/WorkflowsPage"

export type Page =
  | "dashboard"
  | "chat"
  | "documents"
  | "graph"
  | "eval"
  | "analytics"
  | "pipeline"
  | "workflows"
  | "settings"

function App() {
  const [currentPage, setCurrentPage] = useState<Page>("dashboard")

  const renderPage = () => {
    switch (currentPage) {
      case "dashboard":
        return <DashboardPage onNavigate={setCurrentPage} />
      case "chat":
        return <ChatPage />
      case "documents":
        return <DocumentsPage />
      case "graph":
        return <GraphPage />
      case "eval":
        return <EvalPage />
      case "analytics":
        return <AnalyticsPage />
      case "pipeline":
        return <PipelinePage />
      case "workflows":
        return <WorkflowsPage />
      case "settings":
        return <SettingsPage />
      default:
        return <DashboardPage onNavigate={setCurrentPage} />
    }
  }

  return (
    <AppLayout currentPage={currentPage} onNavigate={setCurrentPage}>
      {renderPage()}
    </AppLayout>
  )
}

export default App
