import { useState, useEffect } from 'react'
import { Cpu, MemoryStick, Clock, Bot, GitBranch, RefreshCw, Server, CheckCircle2, XCircle, Zap, Activity } from 'lucide-react'
import { getSystemStats } from '../services/haService'
import apiFetch from '../services/apiFetch'

function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'şimdi'
  if (m < 60) return `${m}dk`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}s`
  return `${Math.floor(h / 24)}g`
}

function StatBar({ label, value, warnThreshold = 80, icon: Icon }) {
  const isWarn = value >= warnThreshold
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-ax-surface border border-ax-border">
      <div className={`p-2 rounded-lg ${isWarn ? 'bg-ax-red/10 text-ax-red' : 'bg-ax-accent/10 text-ax-accent'}`}>
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[10px] font-bold text-ax-dim uppercase tracking-wider">{label}</span>
          <span className={`text-xs font-mono ${isWarn ? 'text-ax-red' : 'text-ax-text'}`}>{value}%</span>
        </div>
        <div className="h-1.5 rounded-full bg-ax-muted overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${isWarn ? 'bg-ax-red' : 'bg-ax-cyan'}`}
            style={{ width: `${Math.min(value, 100)}%` }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [activeAI, setActiveAI] = useState({ name: 'Alfred', model: 'MiniMax-M2.7', status: 'active' })
  const [events, setEvents] = useState([])
  const [now, setNow] = useState(new Date())
  const [gitRepos, setGitRepos] = useState([])
  const [services, setServices] = useState([])
  const [restarting, setRestarting] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(tick)
  }, [])

  const fetchData = async () => {
    try {
      const s = await getSystemStats()
      setStats(s)

      // Aktif AI — sadece Alfred çalışıyor
      try {
        const resAI = await fetch('/api/ai-status')
        if (resAI.ok) {
          const d = await resAI.json()
          // sadece "Gemini" değilse Alfred'tir (OpenClaw çalışıyor)
          if (d.active && d.active !== 'Yok') {
            setActiveAI({ name: d.active, model: 'MiniMax-M2.7', status: 'active' })
          }
        }
      } catch {}

      // Son 5 aktivite
      try {
        const resAct = await fetch('/api/activity')
        if (resAct.ok) {
          const d = await resAct.json()
          setEvents(d.activities?.slice(0, 6) || [])
        }
      } catch {}

      // Git repos
      try {
        const resGit = await fetch('/api/git/repos')
        if (resGit.ok) {
          const d = await resGit.json()
          setGitRepos(d.repos || [])
        }
      } catch {}

      // Servisler
      try {
        const resSvc = await fetch('/api/services')
        if (resSvc.ok) {
          const d = await resSvc.json()
          setServices(d.services || [])
        }
      } catch {}

      setLoading(false)
    } catch (err) {
      console.error('Veri çekme hatası:', err)
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 30_000)
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
        <div className="flex items-center gap-3 text-ax-dim">
          <div className="w-5 h-5 border-2 border-ax-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* 1. ALFRED DURUMU */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ax-accent/10 border border-ax-accent/25 flex items-center justify-center text-3xl">
              🦊
            </div>
            <div>
              <h2 className="text-xl font-black text-ax-heading italic">ALFRED</h2>
              <p className="text-xs text-ax-dim font-medium">{activeAI.model}</p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-ax-green/10 border border-ax-green/25">
            <div className="w-2 h-2 rounded-full bg-ax-green animate-pulse" />
            <span className="text-ax-green text-xs font-bold">Çevrimiçi</span>
          </div>
        </div>
        
        {/* Sistem Metrikleri */}
        <div className="grid grid-cols-2 gap-3 mt-5">
          <StatBar label="RAM" value={ramUsage} warnThreshold={80} icon={MemoryStick} />
          <StatBar label="CPU" value={cpuUsage} warnThreshold={90} icon={Cpu} />
        </div>
        <div className="mt-3">
          <StatBar label="Disk" value={diskUsage} warnThreshold={85} icon={Server} />
        </div>
        
        {/* Uptime */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-ax-border/50">
          <Clock size={12} className="text-ax-subtle" />
          <span className="text-[11px] text-ax-dim">Uptime: {uptime}</span>
        </div>
      </div>

      {/* 2. GÖREV AKTİVİTESİ */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={16} className="text-ax-amber" />
          <h2 className="text-ax-heading text-sm font-bold">Son Görevler</h2>
        </div>
        
        <div className="space-y-2">
          {events.length > 0 ? events.slice(0, 5).map((ev, i) => (
            <div key={i} className="flex items-center gap-3 py-2 border-b border-ax-border/30 last:border-0">
              <div className={`w-2 h-2 rounded-full shrink-0 ${
                ev.type === 'task_done' ? 'bg-ax-green' : 
                ev.type === 'task_start' ? 'bg-ax-amber animate-pulse' : 'bg-ax-cyan'
              }`} />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-ax-text truncate">{ev.action}</p>
                {ev.task_id && (
                  <span className="text-[10px] font-mono text-ax-subtle">{ev.task_id}</span>
                )}
              </div>
              <span className="text-[10px] text-ax-dim whitespace-nowrap">{timeAgo(ev.when)}</span>
            </div>
          )) : (
            <div className="text-center py-6 text-ax-dim text-xs">
              Henüz aktivite yok — görev eklendiğinde burada görünecek
            </div>
          )}
        </div>
      </div>

      {/* 3. GİT AKTİVİTESİ */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <GitBranch size={16} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-bold">Git</h2>
          <button onClick={fetchData} className="ml-auto p-1.5 rounded-lg hover:bg-ax-muted transition-colors text-ax-dim">
            <RefreshCw size={12} />
          </button>
        </div>
        
        <div className="space-y-3">
          {gitRepos.map(repo => (
            <div key={repo.name} className="flex items-center gap-3 py-2 border-b border-ax-border/30 last:border-0">
              <span className="text-sm font-semibold text-ax-heading">{repo.name}</span>
              {repo.error ? (
                <span className="px-2 py-0.5 rounded text-[10px] bg-ax-red/10 text-ax-red">Hata</span>
              ) : (
                <>
                  <span className="px-1.5 py-0.5 rounded text-[10px] bg-ax-accent/10 text-ax-accent font-mono">{repo.branch}</span>
                  <span className="text-[10px] text-ax-dim ml-auto">{repo.commits?.[0]?.relative || '—'}</span>
                </>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4. SERVİSLER */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server size={16} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-bold">Docker Servisler</h2>
          <span className="ml-auto text-[10px] text-ax-green font-medium">{healthyServices.length} aktif</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {dockerServices.map(svc => (
            <div key={svc.id} className={`flex items-center justify-between px-3 py-2.5 rounded-lg border ${
              svc.status === 'active' 
                ? 'bg-ax-green/5 border-ax-green/20' 
                : 'bg-ax-red/5 border-ax-red/20'
            }`}>
              <div className="flex items-center gap-2 min-w-0">
                {svc.status === 'active' ? (
                  <CheckCircle2 size={12} className="text-ax-green shrink-0" />
                ) : (
                  <XCircle size={12} className="text-ax-red shrink-0" />
                )}
                <span className="text-[11px] text-ax-dim truncate">{svc.name}</span>
              </div>
              <button
                onClick={() => handleRestart(svc.id)}
                disabled={restarting === svc.id}
                className="p-1 rounded hover:bg-ax-muted transition-colors text-ax-dim disabled:opacity-50"
              >
                <RefreshCw size={10} className={restarting === svc.id ? 'animate-spin' : ''} />
              </button>
            </div>
          ))}
          {dockerServices.length === 0 && (
            <div className="col-span-3 text-center py-4 text-ax-dim text-xs">Servis bulunamadı</div>
          )}
        </div>
      </div>

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