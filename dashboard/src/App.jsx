import { useState } from 'react'
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

  const View = VIEWS[activeView] ?? Overview

  return (
    <div className="flex h-screen bg-ax-bg overflow-hidden">
      <Sidebar activeView={activeView} onNavigate={setActiveView} />
      <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
        <View />
      </main>
    </div>
  )
}
