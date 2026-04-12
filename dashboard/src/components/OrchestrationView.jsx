import { useState, useEffect } from 'react'
import { Bot, Zap, Clock, DollarSign, Activity, ArrowRight, RefreshCw, AlertCircle, CheckCircle2, Play } from 'lucide-react'

const AGENTS = [
  { id: 'Alfred', name: 'Alfred', role: 'Orkestratör', model: 'claude-3-5-sonnet', color: '#f59e0b', emoji: '🦊' },
  { id: 'Claude', name: 'Claude', role: 'Kodlama & Analiz', model: 'claude-3-5-sonnet', color: '#ef4444', emoji: '🤖' },
  { id: 'Gemini', name: 'Gemini', role: 'Araştırma & Modal', model: 'gemini-1.5-pro', color: '#22c55e', emoji: '✨' },
  { id: 'Robin', name: 'Robin', role: 'Strateji & Raporlama', model: 'gemini-1.5-flash', color: '#3b82f6', emoji: '🐦' },
]

const STATUS_CONFIG = {
  active: { label: 'Aktif', bg: 'bg-green-500/10', border: 'border-green-500/30', text: 'text-green-400', dot: 'bg-green-400' },
  idle: { label: 'Boşta', bg: 'bg-zinc-500/10', border: 'border-zinc-500/30', text: 'text-zinc-400', dot: 'bg-zinc-500' },
  offline: { label: 'Çevrimdışı', bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
}

function AgentCard({ agent, agentStatus, tasks, onDistribute }) {
  const status = agentStatus?.status || 'idle'
  const s = STATUS_CONFIG[status] || STATUS_CONFIG.idle
  const agentTasks = tasks.filter(t => t.assignee === agent.id)
  const inProgress = agentTasks.filter(t => t.status === 'in_progress')
  const done = agentTasks.filter(t => t.status === 'done')
  const pending = agentTasks.filter(t => t.status === 'pending')

  return (
    <div className={`rounded-xl ${s.bg} border ${s.border} p-4 flex flex-col gap-3 transition-all hover:scale-[1.01]`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent.emoji}</span>
          <div>
            <p className="text-ax-heading font-semibold text-sm">{agent.name}</p>
            <p className="text-ax-dim text-xs">{agent.role}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${s.text} ${s.bg} ${s.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Model */}
      <div className="text-xs text-ax-dim font-mono bg-ax-panel/50 px-2 py-1 rounded">
        {agent.model}
      </div>

      {/* Task stats */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-ax-panel/50 rounded-lg p-2">
          <p className="text-ax-heading font-bold text-lg">{pending.length}</p>
          <p className="text-ax-dim text-[10px]">Bekliyor</p>
        </div>
        <div className="bg-ax-panel/50 rounded-lg p-2">
          <p className="text-yellow-400 font-bold text-lg">{inProgress.length}</p>
          <p className="text-ax-dim text-[10px]">Çalışıyor</p>
        </div>
        <div className="bg-ax-panel/50 rounded-lg p-2">
          <p className="text-green-400 font-bold text-lg">{done.length}</p>
          <p className="text-ax-dim text-[10px]">Tamamlandı</p>
        </div>
      </div>

      {/* In-progress task */}
      {inProgress.length > 0 && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg p-2">
          <p className="text-[10px] text-yellow-400 font-medium mb-1">🔄 ÇALIŞIYOR</p>
          <p className="text-xs text-ax-text truncate">{inProgress[0].title}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => onDistribute(agent.id)}
          className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-ax-accent/10 border border-ax-accent/30 text-ax-accent text-xs font-medium hover:bg-ax-accent/20 transition-colors"
        >
          <ArrowRight size={12} />
          Görev Ver
        </button>
        <button className="px-3 py-1.5 rounded-lg bg-ax-muted/30 text-ax-dim text-xs hover:bg-ax-muted/50 transition-colors">
          <RefreshCw size={12} />
        </button>
      </div>
    </div>
  )
}

function CostPanel({ cost }) {
  const daily = cost?.daily || { used: 0, limit: 5, percent: 0, warning: false }
  const monthly = cost?.monthly || { used: 0, limit: 100, percent: 0, warning: false }

  const barColor = (p, soft) => {
    if (p >= 100) return 'bg-red-500'
    if (p >= soft * 100 / (soft < 10 ? 5 : 100)) return 'bg-yellow-500'
    return 'bg-green-500'
  }

  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-ax-heading font-semibold text-sm flex items-center gap-2">
          <DollarSign size={14} className="text-ax-accent" />
          Maliyet Takibi
        </h3>
        <span className="text-[10px] text-ax-dim">Her 30sn</span>
      </div>

      {/* Daily */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-ax-dim">Günlük</span>
          <span className="text-ax-heading font-mono">${daily.used.toFixed(2)} / ${daily.limit.toFixed(2)}</span>
        </div>
        <div className="h-2 bg-ax-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor(daily.percent, 75)} transition-all rounded-full`}
            style={{ width: `${Math.min(daily.percent, 100)}%` }}
          />
        </div>
        {daily.warning && (
          <p className="text-[10px] text-yellow-400 flex items-center gap-1">
            <AlertCircle size={10} /> Yumuşak limit yaklaşıyor
          </p>
        )}
      </div>

      {/* Monthly */}
      <div className="space-y-2">
        <div className="flex justify-between text-xs">
          <span className="text-ax-dim">Aylık</span>
          <span className="text-ax-heading font-mono">${monthly.used.toFixed(2)} / ${monthly.limit.toFixed(2)}</span>
        </div>
        <div className="h-2 bg-ax-muted rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor(monthly.percent, 75)} transition-all rounded-full`}
            style={{ width: `${Math.min(monthly.percent, 100)}%`}}
          />
        </div>
        {monthly.warning && (
          <p className="text-[10px] text-yellow-400 flex items-center gap-1">
            <AlertCircle size={10} /> Yumuşak limit yaklaşıyor
          </p>
        )}
      </div>
    </div>
  )
}

function ActivityFeed({ activities }) {
  if (!activities || activities.length === 0) {
    return (
      <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
        <h3 className="text-ax-heading font-semibold text-sm flex items-center gap-2 mb-3">
          <Activity size={14} className="text-ax-accent" />
          Son Aktiviteler
        </h3>
        <p className="text-ax-dim text-xs text-center py-4">Henüz aktivite yok</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border p-4 space-y-3">
      <h3 className="text-ax-heading font-semibold text-sm flex items-center gap-2">
        <Activity size={14} className="text-ax-accent" />
        Son Aktiviteler
      </h3>
      <div className="space-y-2 max-h-64 overflow-y-auto">
        {activities.map((a, i) => (
          <div key={i} className="flex gap-3 text-xs p-2 rounded-lg bg-ax-muted/20 hover:bg-ax-muted/30 transition-colors">
            <span className="text-ax-accent font-mono text-[10px] shrink-0 w-12">
              {a.agent}
            </span>
            <span className="text-ax-dim truncate flex-1">{a.note}</span>
            <span className="text-ax-subtle text-[10px] shrink-0">
              {new Date(a.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskDistributeModal({ tasks, agents, onClose, onDistribute }) {
  const [selectedTask, setSelectedTask] = useState(null)
  const [selectedAgent, setSelectedAgent] = useState(null)
  const pendingTasks = tasks.filter(t => t.status === 'pending')

  const handleDistribute = () => {
    if (selectedTask && selectedAgent) {
      onDistribute(selectedTask.id, selectedAgent)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-ax-surface border border-ax-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="p-4 border-b border-ax-border flex items-center justify-between">
          <h2 className="text-ax-heading font-semibold">Görev Dağıt</h2>
          <button onClick={onClose} className="text-ax-dim hover:text-ax-text text-xl">×</button>
        </div>
        <div className="p-4 space-y-4">
          {/* Task selection */}
          <div>
            <label className="text-xs text-ax-dim block mb-2">Görev Seç</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {pendingTasks.length === 0 ? (
                <p className="text-ax-dim text-xs py-2">Bekleyen görev yok</p>
              ) : (
                pendingTasks.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTask(t)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                      selectedTask?.id === t.id
                        ? 'bg-ax-accent/20 border border-ax-accent/40 text-ax-accent'
                        : 'bg-ax-panel hover:bg-ax-muted/30 text-ax-dim'
                    }`}
                  >
                    <span className="font-mono text-[10px] text-ax-subtle">{t.id}</span>
                    <span className="ml-2">{t.title}</span>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Agent selection */}
          <div>
            <label className="text-xs text-ax-dim block mb-2">Ajan Seç</label>
            <div className="grid grid-cols-2 gap-2">
              {AGENTS.map(a => (
                <button
                  key={a.id}
                  onClick={() => setSelectedAgent(a.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${
                    selectedAgent === a.id
                      ? 'bg-ax-accent/20 border border-ax-accent/40'
                      : 'bg-ax-panel hover:bg-ax-muted/30'
                  }`}
                >
                  <span>{a.emoji}</span>
                  <span className={selectedAgent === a.id ? 'text-ax-accent' : 'text-ax-dim'}>{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Confirm */}
          <button
            onClick={handleDistribute}
            disabled={!selectedTask || !selectedAgent}
            className="w-full py-2.5 rounded-xl bg-ax-accent text-ax-bg font-semibold text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ax-accent/90 transition-colors flex items-center justify-center gap-2"
          >
            <Play size={14} />
            Dağıt
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrchestrationView() {
  const [tasks, setTasks] = useState([])
  const [agentStatuses, setAgentStatuses] = useState({})
  const [cost, setCost] = useState(null)
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(true)
  const [showDistributeModal, setShowDistributeModal] = useState(false)

  async function fetchData() {
    try {
      const [tasksRes, agentsRes, costRes, activityRes] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/agents'),
        fetch('/api/orchestration/cost'),
        fetch('/api/orchestration/activity'),
      ])

      if (tasksRes.ok) {
        const data = await tasksRes.json()
        setTasks(data.tasks || [])
      }

      if (agentsRes.ok) {
        const data = await agentsRes.json()
        const statusMap = {}
        for (const a of data.agents || []) {
          statusMap[a.id] = { status: a.status, uptime: a.uptime, lastAction: a.lastAction }
        }
        setAgentStatuses(statusMap)
      }

      if (costRes.ok) setCost(await costRes.json())
      if (activityRes.ok) {
        const data = await activityRes.json()
        setActivities(data.activities || [])
      }
    } catch (err) {
      console.error('Data fetch error:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleDistribute = async (taskId, agentId) => {
    try {
      const res = await fetch('/api/orchestration/distribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, agentId }),
      })
      if (res.ok) {
        setShowDistributeModal(false)
        fetchData() // refresh
      }
    } catch (err) {
      console.error('Distribute error:', err)
    }
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-ax-heading text-xl sm:text-2xl font-bold tracking-tight flex items-center gap-2">
            🎯 Orkestrasyon Merkezi
          </h1>
          <p className="text-ax-dim text-sm mt-0.5">
            Ajanları yönet, görevleri dağıt, maliyeti takip et
          </p>
        </div>
        <button
          onClick={() => setShowDistributeModal(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ax-accent text-ax-bg font-semibold text-sm hover:bg-ax-accent/90 transition-colors"
        >
          <ArrowRight size={14} />
          Görev Dağıt
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Agent cards */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {AGENTS.map(agent => (
            <AgentCard
              key={agent.id}
              agent={agent}
              agentStatus={agentStatuses[agent.id]}
              tasks={tasks}
              onDistribute={(agentId) => {
                setShowDistributeModal(true)
              }}
            />
          ))}
        </div>

        {/* Right: Cost + Activity */}
        <div className="space-y-4">
          <CostPanel cost={cost} />
          <ActivityFeed activities={activities} />
        </div>
      </div>

      {/* Task Queue Summary */}
      <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
        <h3 className="text-ax-heading font-semibold text-sm mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-ax-accent" />
          Görev Kuyruğu Özeti
        </h3>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-2xl font-bold text-ax-heading">{tasks.filter(t => t.status === 'pending').length}</span>
            <span className="text-ax-dim ml-1">Bekliyor</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-yellow-400">{tasks.filter(t => t.status === 'in_progress').length}</span>
            <span className="text-ax-dim ml-1">Çalışıyor</span>
          </div>
          <div>
            <span className="text-2xl font-bold text-green-400">{tasks.filter(t => t.status === 'done').length}</span>
            <span className="text-ax-dim ml-1">Tamamlandı</span>
          </div>
        </div>
      </div>

      {/* Distribute Modal */}
      {showDistributeModal && (
        <TaskDistributeModal
          tasks={tasks}
          agents={AGENTS}
          onClose={() => setShowDistributeModal(false)}
          onDistribute={handleDistribute}
        />
      )}
    </div>
  )
}
