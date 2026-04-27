import { useState, useEffect } from 'react'
import { Bot, ArrowRight, RefreshCw, CheckCircle2, Play, X, Clock, Zap, Tag } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const STATUS_STYLE = {
  active:  { border: 'border-ax-green/30',  dot: 'bg-ax-green animate-pulse', badge: 'bg-ax-green/10 text-ax-green border-ax-green/30',  label: 'Aktif'  },
  idle:    { border: 'border-ax-border',    dot: 'bg-ax-subtle',              badge: 'bg-ax-muted text-ax-dim border-ax-border',           label: 'Boşta'  },
  offline: { border: 'border-ax-red/30',   dot: 'bg-ax-red',                 badge: 'bg-ax-red/10 text-ax-red border-ax-red/30',          label: 'Kapalı' },
}

function AgentCard({ agent, onAssign }) {
  const s = STATUS_STYLE[agent.status || 'idle']
  const doneRatio = agent.tasksTotal > 0
    ? Math.round((agent.tasksDone / agent.tasksTotal) * 100)
    : null

  return (
    <div className={`rounded-xl bg-ax-panel border ${s.border} p-4 flex flex-col gap-3`}>

      {/* Üst: isim + durum */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-ax-accent/10 border border-ax-accent/20 flex items-center justify-center shrink-0">
            <Bot size={13} className="text-ax-accent" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-ax-heading leading-tight">{agent.name}</p>
            <p className="text-xs text-ax-dim leading-tight truncate">{agent.role}</p>
          </div>
        </div>
        <span className={`shrink-0 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold ${s.badge}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
          {s.label}
        </span>
      </div>

      {/* Model */}
      <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg bg-ax-surface border border-ax-border">
        <Zap size={10} className="text-ax-subtle shrink-0" />
        <span className="text-[11px] font-mono text-ax-dim truncate">{agent.model || '—'}</span>
      </div>

      {/* Son eylem */}
      <div className="space-y-1">
        <p className="text-[10px] font-medium text-ax-subtle uppercase tracking-wide">Son Eylem</p>
        <p className="text-xs text-ax-text leading-snug line-clamp-2">{agent.lastAction || 'Beklemede'}</p>
        {agent.lastActionTime && agent.lastActionTime !== '—' && (
          <div className="flex items-center gap-1 mt-0.5">
            <Clock size={9} className="text-ax-subtle" />
            <span className="text-[10px] font-mono text-ax-dim">{agent.lastActionTime}</span>
          </div>
        )}
      </div>

      {/* İstatistikler */}
      <div className="flex items-center gap-2 pt-2 border-t border-ax-border/60">
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-ax-surface text-[10px]">
          <span className="text-ax-dim">Bugün</span>
          <span className="font-mono font-bold text-ax-heading">{agent.tasksToday ?? 0}</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-ax-surface text-[10px]">
          <CheckCircle2 size={9} className="text-ax-green" />
          <span className="font-mono font-bold text-ax-heading">{agent.tasksDone ?? 0}</span>
          {doneRatio !== null && <span className="text-ax-dim">({doneRatio}%)</span>}
        </div>
        {agent.uptime && agent.uptime !== '—' && (
          <div className="flex items-center gap-1 ml-auto text-[10px]">
            <span className="text-ax-subtle">up</span>
            <span className="font-mono text-ax-dim">{agent.uptime}</span>
          </div>
        )}
      </div>

      {/* Tags */}
      {agent.tags?.length > 0 && (
        <div className="flex items-center gap-1.5 flex-wrap">
          {agent.tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-ax-muted border border-ax-border text-[10px] text-ax-dim">
              <Tag size={8} /> {tag}
            </span>
          ))}
        </div>
      )}

      {/* Görev ver */}
      <button
        onClick={() => onAssign(agent.id)}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg border border-ax-border text-ax-dim text-xs hover:border-ax-accent/40 hover:text-ax-accent hover:bg-ax-accent/5 transition-all"
      >
        <ArrowRight size={11} /> Görev Ver
      </button>
    </div>
  )
}

function AssignModal({ tasks, agents, preselectedAgent, onClose, onAssign }) {
  const [taskId, setTaskId] = useState(null)
  const [agentId, setAgentId] = useState(preselectedAgent || null)
  const pending = tasks.filter(t => t.status === 'pending')

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-ax-surface border border-ax-border rounded-2xl w-full max-w-lg mx-4 shadow-2xl">
        <div className="p-4 border-b border-ax-border flex items-center justify-between">
          <h2 className="text-ax-heading font-semibold text-sm">Görev Ata</h2>
          <button onClick={onClose} className="p-1 rounded text-ax-dim hover:text-ax-text transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-ax-dim block mb-2">Görev</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {pending.length === 0
                ? <p className="text-ax-dim text-xs py-2">Bekleyen görev yok</p>
                : pending.map(t => (
                  <button key={t.id} onClick={() => setTaskId(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${taskId === t.id ? 'bg-ax-accent/15 border border-ax-accent/30 text-ax-accent' : 'bg-ax-panel border border-ax-border hover:bg-ax-muted text-ax-dim'}`}>
                    <span className="font-mono text-[10px] text-ax-subtle">{t.id}</span>
                    <span className="ml-2">{t.title}</span>
                  </button>
                ))
              }
            </div>
          </div>

          <div>
            <label className="text-xs text-ax-dim block mb-2">Ajan</label>
            <div className="grid grid-cols-2 gap-2">
              {agents.map(a => (
                <button key={a.id} onClick={() => setAgentId(a.id)}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors border ${agentId === a.id ? 'bg-ax-accent/15 border-ax-accent/30 text-ax-accent' : 'bg-ax-panel border-ax-border hover:bg-ax-muted text-ax-dim'}`}>
                  <Bot size={11} />
                  <span>{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => taskId && agentId && onAssign(taskId, agentId)}
            disabled={!taskId || !agentId}
            className="w-full py-2 rounded-xl bg-ax-accent text-ax-bg font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-ax-accent2 transition-colors">
            <Play size={13} /> Ata
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrchestrationView() {
  const [tasks, setTasks]        = useState([])
  const [agents, setAgents]      = useState([])
  const [showModal, setShowModal] = useState(false)
  const [preAgent, setPreAgent]   = useState(null)
  const [loading, setLoading]     = useState(true)

  async function fetchData() {
    try {
      const [tRes, aRes] = await Promise.all([apiFetch('/api/tasks'), apiFetch('/api/agents')])
      if (tRes.ok) { const d = await tRes.json(); setTasks(d.tasks || []) }
      if (aRes.ok) {
        const d = await aRes.json()
        const base = d.agents || []
        const hasMaster = base.some(a => a.id === 'Master Sefa')
        setAgents(hasMaster ? base : [...base, {
          id: 'Master Sefa', name: 'Master Sefa', role: 'Patron', model: '—',
          status: 'idle', tags: ['human'], tasksTotal: 0, tasksDone: 0, tasksToday: 0,
          lastAction: '—', lastActionTime: '—',
        }])
      }
    } catch { /* ignore */ }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30_000)
    return () => clearInterval(t)
  }, [])

  async function handleAssign(taskId, agentId) {
    try {
      await apiFetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignee: agentId }),
      })
    } catch { /* ignore */ }
    setShowModal(false)
    fetchData()
  }

  const activeTasks = tasks.filter(t => t.status !== 'deleted')
  const pending = activeTasks.filter(t => t.status === 'pending').length
  const inProg  = activeTasks.filter(t => t.status === 'in_progress').length
  const done    = activeTasks.filter(t => t.status === 'done').length
  const activeAgents = agents.filter(a => a.status === 'active').length

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-5xl">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-ax-heading flex items-center gap-2">
            <Bot size={18} className="text-ax-accent" /> Ajanlar
          </h1>
          <p className="text-xs text-ax-dim mt-0.5">
            {activeAgents} aktif · {agents.length} toplam ajan
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData}
            className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors">
            <RefreshCw size={12} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setPreAgent(null); setShowModal(true) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ax-accent text-ax-bg font-semibold text-xs hover:bg-ax-accent2 transition-colors"
          >
            <ArrowRight size={13} /> Görev Ata
          </button>
        </div>
      </div>

      {/* Ajan grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {agents.map(a => (
          <AgentCard key={a.id} agent={a}
            onAssign={id => { setPreAgent(id); setShowModal(true) }} />
        ))}
      </div>

      {/* Görev özeti */}
      <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
        <p className="text-xs font-medium text-ax-dim mb-3">Görev Özeti</p>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-ax-heading font-mono">{pending}</span>
            <span className="text-xs text-ax-dim">bekliyor</span>
          </div>
          <div className="w-px h-6 bg-ax-border" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-ax-amber font-mono">{inProg}</span>
            <span className="text-xs text-ax-dim">çalışıyor</span>
          </div>
          <div className="w-px h-6 bg-ax-border" />
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-ax-green font-mono">{done}</span>
            <span className="text-xs text-ax-dim">tamamlandı</span>
          </div>
        </div>
      </div>

      {showModal && (
        <AssignModal tasks={activeTasks} agents={agents} preselectedAgent={preAgent}
          onClose={() => setShowModal(false)} onAssign={handleAssign} />
      )}
    </div>
  )
}
