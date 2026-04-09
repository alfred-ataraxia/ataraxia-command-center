import { useState, useEffect } from 'react'
import { Bot, Cpu, Clock, MessageSquare, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react'

// Default agents when data cannot be fetched
const DEFAULT_AGENTS = [
  {
    id: 1,
    name: 'Alfred',
    role: 'Orkestratör',
    model: 'claude-sonnet-4-6',
    status: 'idle',
    uptime: '—',
    tasksTotal: '—',
    tasksToday: '—',
    lastAction: 'Veri yükleniyor...',
    lastActionTime: 'az önce',
    description: 'Birincil koordinasyon ajanı.',
    tags: [],
  },
]

const STATUS_STYLE = {
  active: {
    badge: 'text-ax-green bg-ax-green/10 border-ax-green/25',
    dot: 'bg-ax-green',
    ping: true,
    label: 'Aktif',
  },
  idle: {
    badge: 'text-ax-dim bg-ax-muted border-ax-border',
    dot: 'bg-ax-subtle',
    ping: false,
    label: 'Boşta',
  },
}

function StatusDot({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.idle
  return (
    <span className="relative flex h-2 w-2">
      {s.ping && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${s.dot} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
    </span>
  )
}

function AgentCard({ agent }) {
  const s = STATUS_STYLE[agent.status] ?? STATUS_STYLE.idle
  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border p-5 flex flex-col gap-4 hover:border-ax-muted transition-colors">
      {/* Başlık satırı */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ax-accent/10 border border-ax-accent/25 flex items-center justify-center shrink-0">
            <Bot size={18} className="text-ax-accent" />
          </div>
          <div>
            <p className="text-ax-heading font-semibold text-sm">{agent.name}</p>
            <p className="text-ax-dim text-xs">{agent.role}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${s.badge}`}>
          <StatusDot status={agent.status} />
          {s.label}
        </span>
      </div>

      {/* Açıklama */}
      <p className="text-ax-dim text-xs leading-relaxed">{agent.description}</p>

      {/* Etiketler */}
      <div className="flex flex-wrap gap-1.5">
        {agent.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-md bg-ax-muted border border-ax-border text-ax-subtle text-[10px] font-medium">
            {tag}
          </span>
        ))}
      </div>

      {/* İstatistik satırı */}
      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-ax-border">
        <div>
          <p className="text-ax-heading text-sm font-bold tabular-nums">{agent.tasksTotal}</p>
          <p className="text-ax-dim text-[10px] uppercase tracking-wide">Toplam görev</p>
        </div>
        <div>
          <p className="text-ax-heading text-sm font-bold tabular-nums">{agent.tasksToday}</p>
          <p className="text-ax-dim text-[10px] uppercase tracking-wide">Bugün</p>
        </div>
        <div>
          <p className="text-ax-heading text-sm font-bold">{agent.uptime}</p>
          <p className="text-ax-dim text-[10px] uppercase tracking-wide">Çalışma süresi</p>
        </div>
      </div>

      {/* Son işlem */}
      <div className="flex items-center gap-2 text-xs text-ax-dim">
        <MessageSquare size={11} className="shrink-0" />
        <span className="truncate">{agent.lastAction}</span>
        <span className="shrink-0 text-ax-subtle">{agent.lastActionTime}</span>
      </div>

      {/* Alt satır */}
      <div className="flex items-center justify-between pt-1 border-t border-ax-border">
        <div className="flex items-center gap-1.5 text-[10px] text-ax-subtle">
          <Cpu size={10} />
          <span className="font-mono">{agent.model}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded hover:bg-ax-muted transition-colors text-ax-subtle hover:text-ax-text">
            <RefreshCw size={12} />
          </button>
          <button className="p-1 rounded hover:bg-ax-muted transition-colors text-ax-subtle hover:text-ax-text">
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgentStatus() {
  const [agents, setAgents] = useState(DEFAULT_AGENTS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  async function fetchAgents() {
    setLoading(true)
    try {
      const res = await fetch('/api/agents')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (data.agents && data.agents.length > 0) {
        setAgents(data.agents)
        setError(null)
      }
    } catch (err) {
      setError('Ajan verisi alınamadı: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
    const interval = setInterval(fetchAgents, 30000)
    return () => clearInterval(interval)
  }, [])

  const activeCount = agents.filter(a => a.status === 'active').length

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-ax-heading text-xl sm:text-2xl font-bold tracking-tight">Ajan Durumları</h1>
          <p className="text-ax-dim text-sm mt-0.5">
            {agents.length} ajandan {activeCount} tanesi aktif
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-ax-dim" />
          <span className="text-ax-dim text-xs">Her 30 saniyede otomatik yenilenir</span>
        </div>
      </div>

      {/* Uyarı */}
      {error && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-ax-amber/10 border border-ax-amber/30">
          <AlertCircle size={16} className="text-ax-amber shrink-0" />
          <p className="text-ax-amber text-sm">{error}</p>
        </div>
      )}

      {/* Izgara */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {agents.map(agent => <AgentCard key={agent.id} agent={agent} />)}
      </div>
    </div>
  )
}
