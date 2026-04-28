import { useState } from 'react'
import ErrorBoundary from './components/ErrorBoundary'
import { ToastProvider } from './components/ToastContainer'
import Sidebar from './components/Sidebar'
import Overview from './components/Overview'
import TaskQueue from './components/TaskQueue'
import OrchestrationView from './components/OrchestrationView'
import AutomationView from './components/AutomationView'
import MemoryView from './components/MemoryView'
import LogsView from './components/LogsView'
import DefiView from './components/DefiView'
import ApprovalsView from './components/ApprovalsView'

const VIEWS = {
  overview:   Overview,
  tasks:      TaskQueue,
  agents:     OrchestrationView,
  automation: AutomationView,
  memory:     MemoryView,
  logs:       LogsView,
  defi:       DefiView,
  approvals:  ApprovalsView,
}

export default function App() {
  const [activeView, setActiveView] = useState('overview')
  const [viewKey, setViewKey] = useState(0)

  const navigate = (id) => {
    setActiveView(id)
    setViewKey(k => k + 1)
  }

  const View = VIEWS[activeView] ?? Overview

  return (
    <ErrorBoundary>
      <ToastProvider>
        <div className="flex h-screen bg-ax-bg text-ax-text font-sans overflow-hidden">
          <Sidebar activeView={activeView} onNavigate={navigate} />
          <main className="flex-1 overflow-y-auto relative z-10 pt-14 md:pt-0">
            <div key={viewKey} className="view-enter">
              <View />
            </div>
          </main>
        </div>
      </ToastProvider>
    </ErrorBoundary>
  )
}
