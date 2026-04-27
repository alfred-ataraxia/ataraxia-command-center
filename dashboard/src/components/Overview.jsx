import { useState, useEffect } from 'react'
import { Cpu, MemoryStick, Clock, GitBranch, RefreshCw, Server, CheckCircle2, XCircle, Zap, TrendingUp, AlertTriangle, ShieldCheck, Activity, ListChecks } from 'lucide-react'
import { getSystemStats } from '../services/haService'
import apiFetch from '../services/apiFetch'
import SprintStatus from './SprintStatus'
import DailySummary from './DailySummary'
import QuickCapture from './QuickCapture'
import AlfredChat from './AlfredChat'
import CalendarPeek from './CalendarPeek'
import { timeAgo } from '../utils'

function StatBar({ label, value, warnThreshold = 80, icon: Icon }) {
  const isWarn = value >= warnThreshold
  return (
    <div className="flex items-center gap-2.5 py-1">
      <Icon size={12} className={`shrink-0 ${isWarn ? 'text-ax-red' : 'text-ax-subtle'}`} />
      <span className="text-xs text-ax-dim w-8 shrink-0">{label}</span>
      <div className="flex-1 h-1 rounded-full bg-ax-subtle/30 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${isWarn ? 'bg-ax-red' : 'bg-ax-accent'}`}
          style={{ width: `${Math.min(value, 100)}%` }}
        />
      </div>
      <span className={`text-xs font-mono w-8 text-right shrink-0 ${isWarn ? 'text-ax-red' : 'text-ax-dim'}`}>{value}%</span>
    </div>
  )
}

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [activeAI, setActiveAI] = useState({ name: 'Alfred', model: '—', status: 'idle', openclawUp: null })
  const [events, setEvents] = useState([])
  const [cronCount, setCronCount] = useState(null)
  const [now, setNow] = useState(new Date())
  const [gitRepos, setGitRepos] = useState([])
  const [services, setServices] = useState([])
  const [restarting, setRestarting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [defiSummary, setDefiSummary] = useState(null)
  const [sprint, setSprint] = useState(null)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(tick)
  }, [])

  const fetchData = async () => {
    try {
      const s = await getSystemStats()
      setStats(s)

      // Alfred model (tek kaynak: /api/agents)
      let alfredModel = '—'
      try {
        const resAgents = await fetch('/api/agents')
        if (resAgents.ok) {
          const d = await resAgents.json()
          const a = (d.agents || []).find(x => x.id === 'Alfred')
          if (a?.model) alfredModel = a.model
        }
      } catch {
        /* ignore */
      }

      try {
        const resAI = await fetch('/api/ai-status')
        if (resAI.ok) {
          const d = await resAI.json()
          setActiveAI({
            name: d.openclawStatus === 'up' ? 'Alfred (OpenClaw)' : (d.active !== 'Yok' ? d.active : 'Alfred'),
            model: d.openclawStatus === 'up' ? alfredModel : '—',
            status: d.openclawStatus === 'up' ? 'active' : 'idle',
            openclawUp: d.openclawStatus === 'up',
          })
        }
      } catch {
        /* ignore */
      }

      // Cron sayacı — OpenClaw jobs.json'dan al
      try {
        const resAuto = await fetch('/api/automation')
        if (resAuto.ok) {
          const d = await resAuto.json()
          const ocJobs = (d.openclawJobs || []).filter(j => j.enabled).length
          const sysCrons = (d.cronSchedules || []).length
          setCronCount(ocJobs + sysCrons)
        }
      } catch {
        /* ignore */
      }

      // Son 5 aktivite
      try {
        const resAct = await fetch('/api/activity')
        if (resAct.ok) {
          const d = await resAct.json()
          const rawActivities = d.activities || []
          setEvents(rawActivities.slice(0, 6))
        }
      } catch {
        /* ignore */
      }

      // Git repos
      try {
        const resGit = await fetch('/api/git/repos')
        if (resGit.ok) {
          const d = await resGit.json()
          setGitRepos(d.repos || [])
        }
      } catch {
        /* ignore */
      }

      // Sprint durumu
      try {
        const resSprint = await fetch('/api/sprint')
        if (resSprint.ok) {
          const d = await resSprint.json()
          setSprint(d)
        }
      } catch {
        /* ignore */
      }

      // Servisler
      try {
        const resSvc = await fetch('/api/services')
        if (resSvc.ok) {
          const d = await resSvc.json()
          setServices(d.services || [])
        }
      } catch {
        /* ignore */
      }

      // DeFi APM özet
      try {
        const [resHealth, resAlerts, resPools, resPortfolio, resHighApy] = await Promise.all([
          fetch('/api/defi/health'),
          fetch('/api/defi/alerts?limit=10'),
          fetch('/api/defi/pools/potential?limit=1'),
          fetch('/api/defi/portfolio?usd=1'),
          fetch('/api/defi/pools/high-apy?minApy=500&limit=1'),
        ])
        const health = resHealth.ok ? await resHealth.json() : null
        const alertsData = resAlerts.ok ? await resAlerts.json() : null
        const poolsData = resPools.ok ? await resPools.json() : null
        const portfolio = resPortfolio.ok ? await resPortfolio.json() : null
        const highApy = resHighApy.ok ? await resHighApy.json() : null
        if (health) {
          const alerts = alertsData?.alerts || []
          const criticals = alerts.filter(a => a.level === 'CRITICAL').length
          const warns = alerts.filter(a => a.level === 'WARN').length
          const criticalAlerts = alerts
            .filter(a => a.level === 'CRITICAL')
            .slice(0, 3)
          const topPool = poolsData?.pools?.[0] || null
          const hotPool = highApy?.pools?.[0] || null
          setDefiSummary({
            up: health.status === 'ok',
            lastScanMs: health.lastScanAt ? Date.now() - new Date(health.lastScanAt).getTime() : null,
            poolCount: health.poolCount ?? null,
            criticals,
            warns,
            criticalAlerts,
            topPool,
            hotPool,
            portfolioUsd: typeof portfolio?.totalBalanceUsd === 'number' ? portfolio.totalBalanceUsd : null,
            portfolioCanRead: portfolio?.canRead === true,
          })
        }
      } catch {
        /* ignore */
      }

      setLoading(false)
    } catch (err) {
      console.error('Veri çekme hatası:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 60_000)
    return () => clearInterval(t)
  }, [])

  const handleRestart = async (serviceId) => {
    setRestarting(serviceId)
    try {
      const res = await apiFetch('/api/services/restart', {
        method: 'POST',
        body: JSON.stringify({ serviceId })
      })
      if (res.ok) {
        setTimeout(fetchData, 2000)
      }
    } catch (err) {
      console.error('Restart error:', err)
    } finally {
      setTimeout(() => setRestarting(null), 3000)
    }
  }

  const ramUsage = stats?.memPercent != null ? Math.round(stats.memPercent) : 0
  const cpuUsage = stats?.cpuPercent != null ? Math.round(stats.cpuPercent) : 0
  const diskUsage = stats?.diskPercent != null ? Math.round(stats.diskPercent) : 0
  const uptime = stats?.uptimeHuman || '—'

  const healthyServices = services.filter(s => s.type === 'docker' && s.status === 'active')
  const dockerServices = services.filter(s => s.type === 'docker').slice(0, 6)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-4 text-ax-dim">
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 border-2 border-ax-accent/20 rounded-full" />
            <div className="absolute inset-0 border-2 border-ax-accent border-t-transparent rounded-full animate-spin" />
          </div>
          <span className="text-sm tracking-widest uppercase font-bold text-ax-accent">Sistem Başlatılıyor</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">

      {/* HERO HEADER */}
      <div className="mb-5 pt-1 relative z-10">
        <p className="text-xs font-mono text-ax-dim mb-1">Kokpit · {now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h2 className="text-2xl font-bold text-ax-heading tracking-tight">
          Her şey kontrol altında.
        </h2>
      </div>

      {/* 2-KOLON GRID — masaüstünde yan yana, mobilde alt alta */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 relative z-10">

        {/* SOL KOLON: Alfred + Sprint */}
        <div className="space-y-4">

          {/* 1. ALFRED DURUMU */}
          <div className="rounded-xl ax-glass p-4 relative overflow-hidden group">
            
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-2xl bg-ax-accent/10 border border-ax-accent/30 flex items-center justify-center group-hover:scale-105 transition-transform duration-300">
                  <img src="/logo-mark.svg" width="40" height="40" alt="Ataraxia" className="drop-shadow-lg" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-ax-heading tracking-wide">ALFRED</h2>
                  <p className="text-xs text-ax-accent font-semibold tracking-wider uppercase mt-1">{activeAI.model}</p>
                </div>
              </div>
              <div className="flex items-center gap-2.5 px-4 py-2 rounded-xl bg-ax-green/10 border border-ax-green/30">
                <div className="w-2.5 h-2.5 rounded-full bg-ax-green animate-pulse" />
                <span className="text-ax-green text-[11px] font-black uppercase tracking-widest">Çevrimiçi</span>
              </div>
            </div>

            <div className="mt-4 space-y-1 relative z-10">
              <StatBar label="RAM"  value={ramUsage}  warnThreshold={80} icon={MemoryStick} />
              <StatBar label="CPU"  value={cpuUsage}  warnThreshold={90} icon={Cpu} />
              <StatBar label="Disk" value={diskUsage} warnThreshold={85} icon={Server} />
            </div>

            <div className="flex items-center justify-between mt-5 pt-5 border-t border-ax-border relative z-10">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ax-surface">
                <Clock size={13} className="text-ax-subtle" />
                <span className="text-[11px] font-mono text-ax-dim">Uptime: {uptime}</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ax-accent/10 border border-ax-accent/20">
                <Zap size={12} className="text-ax-accent" />
                <span className="text-[11px] font-mono font-bold text-ax-accent">{cronCount ?? '…'}</span>
                <span className="text-[10px] font-bold text-ax-accent/70">aktif cron</span>
              </div>
            </div>
          </div>

          {/* 2. SPRINT DURUMU */}
          {sprint && <SprintStatus sprint={sprint} />}

          {/* 3. DOCKER SERVİSLER */}
          <div className="rounded-xl ax-glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-ax-accent/10"><Server size={14} className="text-ax-accent" /></div>
              <h2 className="text-xs font-bold uppercase text-ax-heading">Docker Servisleri</h2>
              <span className="ml-auto text-[10px] font-mono text-ax-green font-bold px-2 py-1 bg-ax-green/10 rounded-lg border border-ax-green/20">{healthyServices.length} aktif</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {dockerServices.map(svc => (
                <div key={svc.id} className={`flex items-center justify-between px-3.5 py-3 rounded-xl border transition-all duration-300 hover:-translate-y-0.5 ${
                  svc.status === 'active' ? 'bg-ax-green/5 border-ax-green/20 hover:border-ax-green/40 hover:shadow-[0_4px_15px_rgba(16,185,129,0.05)]' : 'bg-ax-red/5 border-ax-red/20'
                }`}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    {svc.status === 'active'
                      ? <CheckCircle2 size={13} className="text-ax-green shrink-0" />
                      : <XCircle size={13} className="text-ax-red shrink-0" />}
                    <span className="text-[11px] font-semibold text-ax-text truncate">{svc.name}</span>
                  </div>
                  <button
                    onClick={() => handleRestart(svc.id)}
                    disabled={restarting === svc.id}
                    className="p-1.5 rounded-md hover:bg-ax-surface transition-colors text-ax-dim hover:text-ax-accent disabled:opacity-50"
                  >
                    <RefreshCw size={11} className={restarting === svc.id ? 'animate-spin' : ''} />
                  </button>
                </div>
              ))}
              {dockerServices.length === 0 && (
                <div className="col-span-2 text-center py-6 text-ax-dim text-xs font-mono">Servis bulunamadı</div>
              )}
            </div>
          </div>

        </div>{/* /SOL KOLON */}

        {/* SAĞ KOLON: Son Görevler + Git + DeFi özet */}
        <div className="space-y-4">

          {/* 4. QUICK CAPTURE */}
          <QuickCapture />

          {/* 4b. ALFRED CHAT */}
          <AlfredChat />

          {/* 4. G?NL?K ?ZET */}
          <DailySummary />

          {/* 4c. CALENDAR */}
          <CalendarPeek />

          {/* 5. GÖREV AKTİVİTESİ */}
          <div className="rounded-xl ax-glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-ax-amber/10"><Activity size={14} className="text-ax-amber" /></div>
              <h2 className="text-xs font-bold uppercase text-ax-heading">Son Aktiviteler</h2>
            </div>
            <div className="space-y-1">
              {events.length > 0 ? events.slice(0, 5).map((ev, i) => (
                <div key={i} className="group flex items-center gap-4 py-3 px-3 -mx-3 rounded-xl hover:bg-ax-muted transition-colors">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                    ev.type === 'task_done' ? 'bg-ax-green' :
                    ev.type === 'task_start' ? 'bg-ax-amber animate-pulse' : 'bg-ax-cyan'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ax-text truncate group-hover:text-ax-heading transition-colors">{ev.action}</p>
                    {ev.task_id && <span className="text-[10px] font-mono text-ax-subtle tracking-wider uppercase mt-0.5 inline-block">{ev.task_id}</span>}
                  </div>
                  <span className="text-[10px] font-mono text-ax-dim whitespace-nowrap bg-ax-surface px-2 py-1 rounded-md">{timeAgo(ev.when)}</span>
                </div>
              )) : (
                <div className="text-center py-8 text-ax-dim text-xs font-mono">
                  Henüz aktivite yok — görev eklendiğinde burada görünecek
                </div>
              )}
            </div>
          </div>

          {/* 5. GİT */}
          <div className="rounded-xl ax-glass p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 rounded-md bg-ax-purple/10"><GitBranch size={14} className="text-ax-purple" /></div>
              <h2 className="text-xs font-bold uppercase text-ax-heading">Git Repos</h2>
              <button onClick={fetchData} className="ml-auto p-2 rounded-xl hover:bg-ax-muted transition-colors text-ax-dim hover:text-ax-accent">
                <RefreshCw size={13} />
              </button>
            </div>
            <div className="space-y-2">
              {gitRepos.map(repo => (
                <div key={repo.name} className="flex items-center gap-3 py-2.5 px-3 -mx-3 rounded-xl hover:bg-ax-muted transition-colors group">
                  <span className="text-sm font-semibold text-ax-heading group-hover:text-ax-accent2 transition-colors">{repo.name}</span>
                  {repo.error ? (
                    <span className="px-2 py-0.5 rounded text-[10px] bg-ax-red/10 border border-ax-red/20 text-ax-red">Hata</span>
                  ) : (
                    <>
                      <span className="px-2 py-0.5 rounded-md text-[10px] bg-ax-purple/10 border border-ax-purple/20 text-ax-purple font-mono">{repo.branch}</span>
                      <span className="text-[10px] font-mono text-ax-dim ml-auto">{repo.commits?.[0]?.relative || '—'}</span>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 6. DeFi APM ÖZET */}
          {defiSummary && (
          <div className="rounded-xl ax-glass p-4 relative overflow-hidden group">
          
          <div className="flex items-center gap-2 mb-3 relative z-10">
            <div className="p-1.5 rounded-md bg-ax-green/10"><TrendingUp size={14} className="text-ax-green" /></div>
            <h2 className="text-xs font-bold uppercase text-ax-heading">DeFi APM</h2>
            <div className={`ml-3 flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase ${
              defiSummary.up ? 'bg-ax-green/10 text-ax-green border border-ax-green/30' : 'bg-ax-red/10 text-ax-red border border-ax-red/30'
            }`}>
              <div className={`w-1.5 h-1.5 rounded-full ${defiSummary.up ? 'bg-ax-green animate-pulse' : 'bg-ax-red'}`} />
              {defiSummary.up ? 'Aktif' : 'Down'}
            </div>
            {defiSummary.lastScanMs != null && (
              <span className={`ml-auto text-[10px] font-mono ${
                defiSummary.lastScanMs > 20 * 60 * 1000 ? 'text-ax-amber' : 'text-ax-dim'
              }`}>
                {defiSummary.lastScanMs < 60000
                  ? `${Math.round(defiSummary.lastScanMs / 1000)}s önce`
                  : `${Math.round(defiSummary.lastScanMs / 60000)}dk önce`}
              </span>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
            <div className="flex flex-col items-center justify-center p-3 rounded-xl bg-ax-surface border border-ax-border">
              <span className="text-lg font-black text-ax-heading font-mono">{defiSummary.poolCount ?? '—'}</span>
              <span className="text-[11px] text-ax-dim mt-0.5">Havuz</span>
            </div>
            <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
              defiSummary.criticals > 0
                ? 'bg-ax-red/10 border-ax-red/25'
                : 'bg-ax-surface border-ax-border'
            }`}>
              <span className={`text-lg font-black font-mono ${defiSummary.criticals > 0 ? 'text-ax-red' : 'text-ax-heading'}`}>
                {defiSummary.criticals}
              </span>
              <span className="text-[11px] text-ax-dim mt-0.5">Kritik</span>
            </div>
            <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
              defiSummary.warns > 0
                ? 'bg-ax-amber/10 border-ax-amber/25'
                : 'bg-ax-surface border-ax-border'
            }`}>
              <span className={`text-lg font-black font-mono ${defiSummary.warns > 0 ? 'text-ax-amber' : 'text-ax-heading'}`}>
                {defiSummary.warns}
              </span>
              <span className="text-[11px] text-ax-dim mt-0.5">Uyarı</span>
            </div>
            <div className={`flex flex-col items-center justify-center p-3 rounded-xl border ${
              defiSummary.portfolioCanRead ? 'bg-ax-green/5 border-ax-green/15' : 'bg-ax-surface border-ax-border'
            }`}>
              <span className={`text-lg font-black font-mono ${defiSummary.portfolioCanRead ? 'text-ax-green' : 'text-ax-dim'}`}>
                {defiSummary.portfolioCanRead && typeof defiSummary.portfolioUsd === 'number'
                  ? `$${Math.round(defiSummary.portfolioUsd).toLocaleString('en-US')}`
                  : '—'}
              </span>
              <span className="text-[11px] text-ax-dim mt-0.5">Portföy</span>
            </div>
          </div>

          {defiSummary.topPool && (
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ax-green/5 border border-ax-green/15">
              <ShieldCheck size={13} className="text-ax-green shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ax-heading truncate">
                  {defiSummary.topPool.symbol}
                </p>
                <p className="text-[10px] text-ax-dim truncate">
                  {defiSummary.topPool.project} · {defiSummary.topPool.chain}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-ax-green font-mono">
                  %{defiSummary.topPool.apy?.toFixed(1) ?? '—'}
                </p>
                <p className="text-[11px] text-ax-dim">APY</p>
              </div>
            </div>
          )}

          {defiSummary.hotPool && (
            <div className="mt-2 flex items-center gap-3 px-3 py-2.5 rounded-xl bg-ax-amber/5 border border-ax-amber/20">
              <AlertTriangle size={13} className="text-ax-amber shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-ax-heading truncate">
                  {defiSummary.hotPool.symbol}
                </p>
                <p className="text-[10px] text-ax-dim truncate">
                  {defiSummary.hotPool.project} · {defiSummary.hotPool.chain}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-black text-ax-amber font-mono">
                  %{defiSummary.hotPool.apy?.toFixed(0) ?? '—'}
                </p>
                <p className="text-[11px] text-ax-dim">Hot APY</p>
              </div>
            </div>
          )}

          {defiSummary.criticalAlerts?.length > 0 && (
            <div className="mt-3 rounded-xl bg-ax-red/5 border border-ax-red/20 p-3">
              <p className="text-[10px] text-ax-red font-bold tracking-wide mb-2">KRİTİK UYARILAR</p>
              <div className="space-y-2">
                {defiSummary.criticalAlerts.map((a, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-3">
                    <p className="text-xs text-ax-text line-clamp-2">{a.message}</p>
                    <span className="text-[10px] text-ax-dim whitespace-nowrap">{timeAgo(a.timestamp)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          </div>
          )}

        </div>{/* /SAĞ KOLON */}
      </div>{/* /GRID */}

      {/* FOOTER */}
      <div className="flex justify-between items-center px-2 py-3 text-[10px] text-ax-subtle font-medium uppercase tracking-widest">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-ax-green animate-pulse" />
          Alfred Aktif
        </div>
        <div>{now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</div>
      </div>

    </div>
  )
}
