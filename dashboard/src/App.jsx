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
import TopPools from './components/TopPools'

const VIEWS = {
  overview:   Overview,
  tasks:      TaskQueue,
  agents:     OrchestrationView,
  automation: AutomationView,
  memory:     MemoryView,
  logs:       LogsView,
  defi:       DefiView,
  toppools:   TopPools,
}

export default function App() {
  const [activeView, setActiveView] = useState('overview')

  const View = VIEWS[activeView] ?? Overview

  return (
    <ErrorBoundary>
      <ToastProvider>
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
