import { useState, useEffect } from 'react'
import { Bot, ArrowRight, RefreshCw, CheckCircle2, Play, X } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const AGENTS = [
  { id: 'Alfred',      name: 'Alfred',      role: 'Orkestratör',       model: 'minimax-m2.7 (OpenClaw)', emoji: '🦊' },
  { id: 'Claude',      name: 'Claude',      role: 'Kodlama & Analiz',  model: 'claude-sonnet-4-6',       emoji: '🤖' },
  { id: 'Gemini',      name: 'Gemini',      role: 'Araştırma & Modal', model: 'gemini-2.5-pro',          emoji: '✨' },
  { id: 'Master Sefa', name: 'Master Sefa', role: 'Patron',            model: '—',                       emoji: '👤' },
]

const STATUS_STYLE = {
  active:  { bg: 'bg-green-500/10',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-400',  label: 'Aktif'  },
  idle:    { bg: 'bg-zinc-500/10',   border: 'border-zinc-500/30',   text: 'text-zinc-400',   dot: 'bg-zinc-500',   label: 'Boşta'  },
  offline: { bg: 'bg-red-500/10',    border: 'border-red-500/30',    text: 'text-red-400',    dot: 'bg-red-500',    label: 'Kapalı' },
}

function AgentCard({ agent, status, tasks, onAssign }) {
  const s = STATUS_STYLE[status?.status || 'idle']
  const myTasks = tasks.filter(t => t.assignee === agent.id)
  const active  = myTasks.filter(t => t.status === 'in_progress')
  const pending = myTasks.filter(t => t.status === 'pending')
  const done    = myTasks.filter(t => t.status === 'done')

  return (
    <div className={`rounded-xl ${s.bg} border ${s.border} p-4 flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{agent.emoji}</span>
          <div>
            <p className="text-ax-heading font-semibold text-sm">{agent.name}</p>
            <p className="text-ax-dim text-xs">{agent.role}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${s.text} ${s.bg} ${s.border}`}>
          <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${status?.status === 'active' ? 'animate-pulse' : ''}`} />
          {s.label}
        </span>
      </div>

      <div className="text-xs font-mono bg-ax-panel/50 px-2 py-1 rounded text-ax-dim">{agent.model}</div>

      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        <div className="bg-ax-panel/50 rounded-lg p-2">
          <p className="font-bold text-ax-heading">{pending.length}</p>
          <p className="text-[10px] text-ax-dim">Bekliyor</p>
        </div>
        <div className="bg-ax-panel/50 rounded-lg p-2">
          <p className="font-bold text-yellow-400">{active.length}</p>
          <p className="text-[10px] text-ax-dim">Çalışıyor</p>
        </div>
        <div className="bg-ax-panel/50 rounded-lg p-2">
          <p className="font-bold text-green-400">{done.length}</p>
          <p className="text-[10px] text-ax-dim">Bitti</p>
        </div>
      </div>

      {active[0] && (
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-lg px-3 py-2">
          <p className="text-[10px] text-yellow-400 font-medium mb-0.5">🔄 ÇALIŞIYOR</p>
          <p className="text-xs text-ax-text truncate">{active[0].title}</p>
        </div>
      )}

      <button
        onClick={() => onAssign(agent.id)}
        className="flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-ax-accent/10 border border-ax-accent/30 text-ax-accent text-xs font-medium hover:bg-ax-accent/20 transition-colors"
      >
        <ArrowRight size={12} /> Görev Ver
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
          <h2 className="text-ax-heading font-semibold">Görev Ata</h2>
          <button onClick={onClose} className="p-1 rounded text-ax-dim hover:text-ax-text"><X size={18} /></button>
        </div>
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs text-ax-dim block mb-2">Görev</label>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {pending.length === 0
                ? <p className="text-ax-dim text-xs py-2">Bekleyen görev yok</p>
                : pending.map(t => (
                  <button key={t.id} onClick={() => setTaskId(t.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${taskId === t.id ? 'bg-ax-accent/20 border border-ax-accent/40 text-ax-accent' : 'bg-ax-panel hover:bg-ax-muted/30 text-ax-dim'}`}>
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
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors ${agentId === a.id ? 'bg-ax-accent/20 border border-ax-accent/40 text-ax-accent' : 'bg-ax-panel hover:bg-ax-muted/30 text-ax-dim'}`}>
                  <span>{a.emoji}</span><span>{a.name}</span>
                </button>
              ))}
            </div>
          </div>

          <button onClick={() => taskId && agentId && onAssign(taskId, agentId)}
            disabled={!taskId || !agentId}
            className="w-full py-2.5 rounded-xl bg-ax-accent text-ax-bg font-semibold text-sm disabled:opacity-40 flex items-center justify-center gap-2 hover:bg-ax-accent/90 transition-colors">
            <Play size={14} /> Ata
          </button>
        </div>
      </div>
    </div>
  )
}

export default function OrchestrationView() {
  const [tasks, setTasks]           = useState([])
  const [agentStatuses, setStatuses] = useState({})
  const [showModal, setShowModal]    = useState(false)
  const [preAgent, setPreAgent]      = useState(null)
  const [loading, setLoading]        = useState(true)

  async function fetchData() {
    try {
      const [tRes, aRes] = await Promise.all([apiFetch('/api/tasks'), apiFetch('/api/agents')])
      if (tRes.ok) { const d = await tRes.json(); setTasks(d.tasks || []) }
      if (aRes.ok) {
        const d = await aRes.json()
        const map = {}
        for (const a of d.agents || []) map[a.id] = { status: a.status, uptime: a.uptime }
        setStatuses(map)
      }
    } catch {}
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
    } catch {}
    setShowModal(false)
    fetchData()
  }

  const activeTasks = tasks.filter(t => t.status !== 'deleted')
  const pending  = activeTasks.filter(t => t.status === 'pending').length
  const inProg   = activeTasks.filter(t => t.status === 'in_progress').length
  const done     = activeTasks.filter(t => t.status === 'done').length

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-ax-heading text-xl font-bold flex items-center gap-2">
            <Bot size={20} className="text-ax-accent" /> Ajanlar
          </h1>
          <p className="text-ax-dim text-sm mt-0.5">Görev dağılımı ve ajan durumları</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchData} className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors">
            <RefreshCw size={13} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => { setPreAgent(null); setShowModal(true) }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-ax-accent text-ax-bg font-semibold text-sm hover:bg-ax-accent/90 transition-colors"
          >
            <ArrowRight size={14} /> Görev Ata
          </button>
        </div>
      </div>

      {/* Agent grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {AGENTS.map(a => (
          <AgentCard key={a.id} agent={a} status={agentStatuses[a.id]}
            tasks={activeTasks}
            onAssign={id => { setPreAgent(id); setShowModal(true) }} />
        ))}
      </div>

      {/* Task summary */}
      <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
        <h3 className="text-ax-heading font-semibold text-sm mb-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-ax-accent" /> Görev Özeti
        </h3>
        <div className="flex gap-6 text-sm">
          <div><span className="text-2xl font-bold text-ax-heading">{pending}</span><span className="text-ax-dim ml-1">Bekliyor</span></div>
          <div><span className="text-2xl font-bold text-yellow-400">{inProg}</span><span className="text-ax-dim ml-1">Çalışıyor</span></div>
          <div><span className="text-2xl font-bold text-green-400">{done}</span><span className="text-ax-dim ml-1">Tamamlandı</span></div>
        </div>
      </div>

      {showModal && (
        <AssignModal tasks={activeTasks} agents={AGENTS} preselectedAgent={preAgent}
          onClose={() => setShowModal(false)} onAssign={handleAssign} />
      )}
    </div>
  )
}
