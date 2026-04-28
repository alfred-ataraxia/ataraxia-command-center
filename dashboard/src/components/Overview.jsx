import { useState, useEffect, useCallback } from 'react'
import { Cpu, MemoryStick, Server, GitBranch, RefreshCw, CheckCircle2, XCircle,
         TrendingUp, AlertTriangle, ShieldCheck, Activity, Zap, Circle } from 'lucide-react'
import { getSystemStats } from '../services/haService'
import apiFetch from '../services/apiFetch'
import AlfredChat from './AlfredChat'
import QuickCapture from './QuickCapture'
import DailySummary from './DailySummary'
import CalendarPeek from './CalendarPeek'
import { timeAgo } from '../utils'

/* ── Fathom-style status strip — always readable at a glance ── */
function StatusStrip({ stats, activeAI, sprint, cronCount, now }) {
  const cpu  = stats?.cpuPercent  ? Math.round(stats.cpuPercent)  : 0
  const ram  = stats?.memPercent  ? Math.round(stats.memPercent)  : 0
  const disk = stats?.diskPercent ? Math.round(stats.diskPercent) : 0
  const pct  = sprint?.total > 0 ? Math.round((sprint.done / sprint.total) * 100) : 0

  const vital = (label, val, warn) => (
    <span className="flex items-center gap-1">
      <span className="text-ax-dim" style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }}>{label}</span>
      <span className={`font-mono font-bold text-xs ${val >= warn ? 'text-ax-amber' : 'text-ax-heading'}`}>{val}%</span>
    </span>
  )

  return (
    <div className="sticky top-0 z-30 flex items-center gap-0 border-b border-ax-border bg-ax-surface/98" style={{ backdropFilter: 'blur(4px)' }}>
      {/* Alfred badge */}
      <div className="flex items-center gap-2 px-4 py-2 border-r border-ax-border shrink-0">
        <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeAI.openclawUp ? 'bg-ax-green' : 'bg-ax-dim'}`}
          style={activeAI.openclawUp ? { boxShadow: '0 0 4px rgba(78,136,98,0.7)', animation: 'pulse 2s infinite' } : {}} />
        <span className="font-mono font-semibold text-xs text-ax-heading tracking-wide">ALFRED</span>
        {activeAI.model && activeAI.model !== '—' && (
          <span className="hidden sm:inline font-mono text-[10px] text-ax-dim">{activeAI.model}</span>
        )}
      </div>

      {/* Vitals */}
      <div className="flex items-center gap-3 px-4 py-2 border-r border-ax-border">
        {vital('CPU', cpu, 85)}
        {vital('RAM', ram, 80)}
        {vital('DSK', disk, 85)}
      </div>

      {/* Uptime */}
      {stats?.uptimeHuman && (
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-2 border-r border-ax-border">
          <span style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', fontFamily: 'var(--font-mono)' }} className="text-ax-dim">UP</span>
          <span className="font-mono text-[10px] text-ax-dim">{stats.uptimeHuman}</span>
        </div>
      )}

      {/* Cron count */}
      {cronCount != null && (
        <div className="hidden md:flex items-center gap-1.5 px-3 py-2 border-r border-ax-border">
          <Zap size={9} className="text-ax-accent" />
          <span className="font-mono text-[10px] text-ax-dim">{cronCount} cron</span>
        </div>
      )}

      {/* Sprint mini */}
      {sprint && (
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 border-r border-ax-border">
          <div className="w-16 h-0.5 bg-ax-border overflow-hidden rounded-full">
            <div className="h-full bg-ax-cyan rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <span className="font-mono text-[10px] text-ax-dim">{sprint.name} <span className="text-ax-cyan">{pct}%</span></span>
        </div>
      )}

      {/* Clock */}
      <div className="ml-auto px-4 py-2 font-mono text-[11px] text-ax-dim shrink-0">
        {now.toLocaleString('tr-TR', { weekday: 'short', day: '2-digit', month: 'short' })}
        <span className="ml-2 text-ax-heading font-semibold">{now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
      </div>
    </div>
  )
}

/* ── Work panel: in-progress tasks + sprint ── */
function WorkPanel({ tasks, sprint }) {
  const inProg = tasks.filter(t => t.status === 'in_progress')
  const pending = tasks.filter(t => t.status === 'pending')
  const pct = sprint?.total > 0 ? Math.round((sprint.done / sprint.total) * 100) : 0

  return (
    <div className="ax-glass rounded-lg flex flex-col h-full min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ax-border shrink-0">
        <div className="w-1 h-4 bg-ax-accent rounded-full opacity-80" />
        <span className="font-mono text-[10px] uppercase tracking-widest text-ax-dim">Aktif İş</span>
        <span className="ml-auto font-mono text-[10px] text-ax-accent">{inProg.length} devam · {pending.length} bekliyor</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1.5 min-h-0">
        {inProg.length === 0 && pending.length === 0 && (
          <p className="text-ax-subtle text-[10px] font-mono text-center py-4">— Kuyruk boş —</p>
        )}

        {inProg.map(task => (
          <div key={task.id} className="flex items-start gap-2.5 px-3 py-2 rounded border border-ax-amber/20 bg-ax-amber/5">
            <div className="w-1 h-1 rounded-full bg-ax-amber mt-1.5 shrink-0" style={{ boxShadow: '0 0 4px rgba(176,126,56,0.6)' }} />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ax-text leading-snug truncate">{task.title}</p>
              <span className="text-[9px] font-mono text-ax-subtle">{task.id} · {task.assignee || 'Alfred'}</span>
            </div>
          </div>
        ))}

        {pending.slice(0, 4).map(task => (
          <div key={task.id} className="flex items-start gap-2.5 px-3 py-1.5 rounded border border-ax-border/60 hover:border-ax-border transition-colors">
            <Circle size={6} className="text-ax-subtle mt-1.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-ax-dim leading-snug truncate">{task.title}</p>
              <span className="text-[9px] font-mono text-ax-subtle/60">{task.id}</span>
            </div>
          </div>
        ))}

        {pending.length > 4 && (
          <p className="text-[9px] font-mono text-ax-subtle text-center py-1">+{pending.length - 4} daha</p>
        )}
      </div>

      {/* Sprint footer */}
      {sprint && (
        <div className="px-4 py-3 border-t border-ax-border shrink-0 space-y-1.5">
          <div className="flex justify-between items-center">
            <span className="font-mono text-[9px] uppercase tracking-widest text-ax-dim">{sprint.name}</span>
            <span className="font-mono text-[10px] text-ax-cyan font-bold">{pct}%</span>
          </div>
          <div className="h-px w-full bg-ax-border overflow-hidden">
            <div className="h-full bg-ax-cyan transition-all duration-700" style={{ width: `${pct}%` }} />
          </div>
          <div className="flex justify-between">
            <span className="font-mono text-[9px] text-ax-subtle">{sprint.done ?? 0}/{sprint.total ?? 0} puan</span>
            <span className="font-mono text-[9px] text-ax-subtle">{sprint.end || '—'}</span>
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Signals panel: DeFi + Docker (compact) ── */
function SignalsPanel({ defiSummary, services, market }) {
  const docker = services.filter(s => s.type === 'docker').slice(0, 8)
  const okCount = docker.filter(s => s.status === 'active').length

  return (
    <div className="space-y-3">
      {/* DeFi */}
      {defiSummary && (
        <div className="ax-glass rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-ax-border">
            <div className="w-1 h-4 bg-ax-green rounded-full opacity-80" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-ax-dim">DeFi APM</span>
            <div className={`ml-auto flex items-center gap-1 ${defiSummary.up ? 'text-ax-green' : 'text-ax-red'}`}>
              <div className={`w-1 h-1 rounded-full ${defiSummary.up ? 'bg-ax-green' : 'bg-ax-red'}`} />
              <span className="font-mono text-[9px]">{defiSummary.up ? 'LIVE' : 'DOWN'}</span>
            </div>
          </div>
          <div className="p-3 grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="font-mono font-bold text-sm text-ax-heading">{defiSummary.poolCount ?? '—'}</p>
              <p className="font-mono text-[9px] text-ax-dim uppercase tracking-wide">havuz</p>
            </div>
            <div className="text-center">
              <p className={`font-mono font-bold text-sm ${defiSummary.criticals > 0 ? 'text-ax-red' : 'text-ax-heading'}`}>{defiSummary.criticals}</p>
              <p className="font-mono text-[9px] text-ax-dim uppercase tracking-wide">kritik</p>
            </div>
            <div className="text-center">
              <p className={`font-mono font-bold text-sm ${defiSummary.warns > 0 ? 'text-ax-amber' : 'text-ax-heading'}`}>{defiSummary.warns}</p>
              <p className="font-mono text-[9px] text-ax-dim uppercase tracking-wide">uyarı</p>
            </div>
          </div>
          {defiSummary.topPool && (
            <div className="mx-3 mb-3 flex items-center justify-between px-2.5 py-1.5 rounded border border-ax-green/20 bg-ax-green/5">
              <span className="text-[11px] text-ax-dim truncate">{defiSummary.topPool.symbol}</span>
              <span className="font-mono text-xs font-bold text-ax-green">%{defiSummary.topPool.apy?.toFixed(1)}</span>
            </div>
          )}
        </div>
      )}

      {/* Docker services */}
      <div className="ax-glass rounded-lg overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-2 border-b border-ax-border">
          <div className="w-1 h-4 bg-ax-cyan rounded-full opacity-80" />
          <span className="font-mono text-[9px] uppercase tracking-widest text-ax-dim">Servisler</span>
          <span className="ml-auto font-mono text-[9px] text-ax-green">{okCount}/{docker.length}</span>
        </div>
        <div className="p-2.5 flex flex-wrap gap-1.5">
          {docker.map(svc => (
            <div key={svc.id} className={`flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${
              svc.status === 'active'
                ? 'border-ax-green/25 bg-ax-green/8 text-ax-green'
                : 'border-ax-red/25 bg-ax-red/8 text-ax-red'
            }`}>
              <div className={`w-1 h-1 rounded-full ${svc.status === 'active' ? 'bg-ax-green' : 'bg-ax-red'}`} />
              {svc.name}
            </div>
          ))}
        </div>
      </div>

      {/* Market prices */}
      {market && (
        <div className="ax-glass rounded-lg overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-2 border-b border-ax-border">
            <div className="w-1 h-4 bg-ax-amber rounded-full opacity-80" />
            <span className="font-mono text-[9px] uppercase tracking-widest text-ax-dim">Piyasa</span>
          </div>
          <div className="p-2.5 space-y-1.5">
            {Object.entries(market).slice(0, 3).map(([sym, price]) => (
              <div key={sym} className="flex items-center justify-between">
                <span className="font-mono text-[10px] text-ax-subtle">{sym}</span>
                <span className="font-mono text-xs font-bold text-ax-heading">
                  ${Number(price).toLocaleString('en-US', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/* ── Git bar ── */
function GitBar({ repos, events }) {
  if (!repos.length && !events.length) return null
  return (
    <div className="mt-4 ax-glass rounded-lg overflow-hidden">
      <div className="flex items-center gap-0 overflow-x-auto">
        {repos.slice(0, 3).map((repo, i) => (
          <div key={repo.name} className={`flex items-center gap-2 px-4 py-2.5 border-r border-ax-border shrink-0 ${i === 0 ? '' : ''}`}>
            <GitBranch size={10} className="text-ax-purple shrink-0" />
            <span className="font-mono text-xs font-semibold text-ax-heading">{repo.name}</span>
            {!repo.error && (
              <>
                <span className="font-mono text-[9px] text-ax-purple bg-ax-purple/10 border border-ax-purple/20 px-1.5 py-px rounded">{repo.branch}</span>
                {repo.commits?.[0]?.message && (
                  <span className="text-[10px] text-ax-dim truncate max-w-[140px] hidden md:block">{repo.commits[0].message.slice(0, 50)}</span>
                )}
                <span className="text-[9px] font-mono text-ax-subtle shrink-0">{repo.commits?.[0]?.relative || '—'}</span>
              </>
            )}
          </div>
        ))}
        {events.slice(0, 2).map((ev, i) => (
          <div key={i} className="flex items-center gap-2 px-4 py-2.5 border-r border-ax-border shrink-0">
            <div className={`w-1 h-1 rounded-full shrink-0 ${
              ev.type === 'task_done' ? 'bg-ax-green' : ev.type === 'task_start' ? 'bg-ax-amber' : 'bg-ax-cyan'
            }`} />
            <span className="text-[10px] text-ax-dim truncate max-w-[200px]">{ev.action}</span>
            <span className="text-[9px] font-mono text-ax-subtle shrink-0">{timeAgo(ev.when)}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Loading skeleton ── */
function Skeleton({ className = '' }) {
  return <div className={`rounded bg-ax-muted animate-pulse ${className}`} />
}

/* ════════════════════════════════════════════════════════════
   MAIN OVERVIEW
   ════════════════════════════════════════════════════════════ */
export default function Overview() {
  const [stats, setStats]           = useState(null)
  const [activeAI, setActiveAI]     = useState({ model: '—', status: 'idle', openclawUp: null })
  const [sprint, setSprint]         = useState(null)
  const [tasks, setTasks]           = useState([])
  const [services, setServices]     = useState([])
  const [gitRepos, setGitRepos]     = useState([])
  const [events, setEvents]         = useState([])
  const [defiSummary, setDefiSummary] = useState(null)
  const [market, setMarket]         = useState(null)
  const [cronCount, setCronCount]   = useState(null)
  const [loading, setLoading]       = useState(true)
  const [now, setNow]               = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60_000)
    return () => clearInterval(t)
  }, [])

  const fetchData = useCallback(async () => {
    try {
      const s = await getSystemStats()
      setStats(s)

      await Promise.allSettled([
        // Alfred model
        fetch('/api/agents').then(r => r.ok ? r.json() : null).then(d => {
          const a = (d?.agents || []).find(x => x.id === 'Alfred')
          return fetch('/api/ai-status').then(r => r.ok ? r.json() : null).then(ai => {
            setActiveAI({
              model: a?.model || '—',
              status: ai?.openclawStatus === 'up' ? 'active' : 'idle',
              openclawUp: ai?.openclawStatus === 'up',
            })
          })
        }),
        // Sprint
        fetch('/api/sprint').then(r => r.ok ? r.json() : null).then(d => d && setSprint(d)),
        // Tasks
        fetch('/api/tasks').then(r => r.ok ? r.json() : null).then(d => {
          const active = (d?.tasks || []).filter(t => t.status !== 'deleted')
          setTasks(active)
        }),
        // Services
        fetch('/api/services').then(r => r.ok ? r.json() : null).then(d => d && setServices(d.services || [])),
        // Git
        fetch('/api/git/repos').then(r => r.ok ? r.json() : null).then(d => d && setGitRepos(d.repos || [])),
        // Activity
        fetch('/api/activity').then(r => r.ok ? r.json() : null).then(d => d && setEvents((d.activities || []).slice(0, 6))),
        // Cron
        fetch('/api/automation').then(r => r.ok ? r.json() : null).then(d => {
          if (d) setCronCount((d.openclawJobs || []).filter(j => j.enabled).length + (d.cronSchedules || []).length)
        }),
        // Market
        fetch('/api/daily-summary').then(r => r.ok ? r.json() : null).then(d => d?.market && setMarket(d.market)),
        // DeFi
        Promise.all([
          fetch('/api/defi/health'), fetch('/api/defi/alerts?limit=10'), fetch('/api/defi/pools/potential?limit=1'),
        ]).then(([h, a, p]) => Promise.all([
          h.ok ? h.json() : null, a.ok ? a.json() : null, p.ok ? p.json() : null,
        ])).then(([health, alertsD, poolsD]) => {
          if (!health) return
          const alerts = alertsD?.alerts || []
          setDefiSummary({
            up: health.status === 'ok',
            poolCount: health.poolCount ?? null,
            criticals: alerts.filter(a => a.level === 'CRITICAL').length,
            warns: alerts.filter(a => a.level === 'WARN').length,
            topPool: poolsD?.pools?.[0] || null,
          })
        }),
      ])
    } catch (e) {
      console.error('Overview fetch error:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 60_000)
    return () => clearInterval(t)
  }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="flex items-center gap-3 text-ax-dim">
          <div className="w-1.5 h-1.5 rounded-full bg-ax-accent animate-ping" />
          <span className="font-mono text-xs uppercase tracking-widest">Sistem Başlatılıyor</span>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-full">
      {/* ── Status Strip ── */}
      <StatusStrip stats={stats} activeAI={activeAI} sprint={sprint} cronCount={cronCount} now={now} />

      {/* ── Main Content ── */}
      <div className="flex-1 p-4 md:p-5">
        {/* 3-column command grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 xl:grid-cols-9 gap-4">

          {/* ── LEFT: Alfred Chat (dominant) ── */}
          <div className="lg:col-span-2 xl:col-span-3 flex flex-col gap-3">
            <AlfredChat compact={false} />
            <QuickCapture />
          </div>

          {/* ── CENTER: Work ── */}
          <div className="lg:col-span-2 xl:col-span-3 flex flex-col">
            <WorkPanel tasks={tasks} sprint={sprint} />
          </div>

          {/* ── RIGHT: Signals ── */}
          <div className="lg:col-span-1 xl:col-span-3">
            <SignalsPanel defiSummary={defiSummary} services={services} market={market} />
          </div>
        </div>

        {/* ── Bottom: Git + Activity strip ── */}
        <GitBar repos={gitRepos} events={events} />
      </div>
    </div>
  )
}
