import { useState, useEffect } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastContainer'
import Sidebar from './components/Sidebar'
import Overview from './components/Overview'
import AgentStatus from './components/AgentStatus'
import TaskQueue from './components/TaskQueue'
import LogsView from './components/LogsView'
import ToolsView from './components/ToolsView'
import MemoryView from './components/MemoryView'
import SettingsView from './components/SettingsView'
import FreeRideView from './components/FreeRideView'
import HomeAssistantView from './components/HomeAssistantView'
import LoginModal from './components/LoginModal'
import { getToken } from './services/apiFetch'

const VIEWS = {
  overview: Overview,
  agents: AgentStatus,
  tasks: TaskQueue,
  tools: ToolsView,
  memory: MemoryView,
  logs: LogsView,
  freeride: FreeRideView,
  ha: HomeAssistantView,
  settings: SettingsView,
}

export default function App() {
  const [activeView, setActiveView] = useState('overview')
  const [authenticated, setAuthenticated] = useState(() => !!getToken())

  useEffect(() => {
    const handler = () => setAuthenticated(false)
    window.addEventListener('auth:unauthorized', handler)
    return () => window.removeEventListener('auth:unauthorized', handler)
  }, [])

  const View = VIEWS[activeView] ?? Overview

  return (
    <ErrorBoundary>
      <ToastProvider>
        {!authenticated && <LoginModal onLogin={() => setAuthenticated(true)} />}
        <div className="flex h-screen bg-ax-bg overflow-hidden">
          <Sidebar activeView={activeView} onNavigate={setActiveView} />
          <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
            <View />
          </main>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}
// Test: Fri 10 Apr 02:43:43 +03 2026
