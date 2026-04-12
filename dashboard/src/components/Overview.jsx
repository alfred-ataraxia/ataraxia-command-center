import { useState, useEffect } from 'react'
import { Cpu, MemoryStick, Clock, AlertCircle, Bot, Zap, Activity, Terminal, GitBranch, RefreshCw, Server, CheckCircle2, XCircle } from 'lucide-react'
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

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [activeAI, setActiveAI] = useState('Yükleniyor...')
  const [events, setEvents] = useState([])
  const [now, setNow] = useState(new Date())
  const [gitRepos, setGitRepos] = useState([])
  const [services, setServices] = useState([])
  const [restarting, setRestarting] = useState(null)

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(tick)
  }, [])

  const fetchData = async () => {
    try {
      const s = await getSystemStats()
      setStats(s)

      const resAI = await apiFetch('/api/ai-status')
      if (resAI.ok) {
        const d = await resAI.json()
        setActiveAI(d.active || 'Yok')
      }

      const resAct = await apiFetch('/api/activity')
      if (resAct.ok) {
        const d = await resAct.json()
        setEvents(d.activities?.slice(0, 8) || [])
      }

      const resGit = await apiFetch('/api/git/repos')
      if (resGit.ok) {
        const d = await resGit.json()
        setGitRepos(d.repos || [])
      }

      const resSvc = await apiFetch('/api/services')
      if (resSvc.ok) {
        const d = await resSvc.json()
        setServices(d.services || [])
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 20_000)
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

  const criticalServices = services.filter(s => s.type === 'docker' && s.status !== 'active').slice(0, 4)
  const healthyServices = services.filter(s => s.type === 'docker' && s.status === 'active')

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      
      {/* 1. SİSTEM DURUMU */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${activeAI !== 'Yok' ? 'bg-ax-accent/20 text-ax-accent' : 'bg-ax-dim/10 text-ax-dim'}`}>
              <Bot size={20} />
            </div>
            <div>
              <h2 className="text-ax-heading font-bold">Aktif AI</h2>
              <p className="text-xs text-ax-dim uppercase tracking-wider">{activeAI}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 px-3 py-1 rounded-full bg-ax-green/10 text-ax-green text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-ax-green animate-pulse" />
            Çevrimiçi
          </div>
        </div>
        
        {/* Kaynak Durumu */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'RAM', value: ramUsage, color: ramUsage > 80 },
            { label: 'CPU', value: cpuUsage, color: false },
            { label: 'Disk', value: diskUsage, color: diskUsage > 85 },
          ].map(r => (
            <div key={r.label} className="space-y-1">
              <div className="flex justify-between text-[10px] text-ax-dim font-bold">
                <span>{r.label}</span>
                <span className={r.color ? 'text-ax-red' : 'text-ax-cyan'}>%{r.value}</span>
              </div>
              <div className="h-1.5 rounded-full bg-ax-muted overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ${r.color ? 'bg-ax-red' : 'bg-ax-cyan'}`} 
                  style={{ width: `${r.value}%` }} 
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 2. GİT AKTİVİTESİ */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <GitBranch size={16} className="text-ax-accent" />
            <h2 className="text-ax-heading text-sm font-bold">Git Aktivitesi</h2>
          </div>
          <button onClick={fetchData} className="p-1.5 rounded-lg hover:bg-ax-muted transition-colors text-ax-dim">
            <RefreshCw size={14} />
          </button>
        </div>
        
        <div className="space-y-4">
          {gitRepos.map(repo => (
            <div key={repo.name} className="border-b border-ax-border/30 pb-3 last:border-0 last:pb-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-semibold text-ax-heading">{repo.name}</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-ax-accent/10 text-ax-accent font-mono">{repo.branch}</span>
              </div>
              <div className="space-y-1">
                {repo.commits.slice(0, 2).map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px]">
                    <span className="w-1 h-1 rounded-full bg-ax-green shrink-0" />
                    <span className="text-ax-text truncate flex-1">{c.message}</span>
                    <span className="text-ax-subtle whitespace-nowrap">{timeAgo(c.date)}</span>
                  </div>
                ))}
                {(!repo.commits || repo.commits.length === 0) && (
                  <p className="text-[10px] text-ax-dim italic">Commit yok</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. SERVİS KONTROLÜ */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Server size={16} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-bold">Servis Kontrolü</h2>
          <span className="ml-auto text-[10px] text-ax-dim">{healthyServices.length} aktif</span>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {services.filter(s => s.type === 'docker').slice(0, 6).map(svc => (
            <div key={svc.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition-colors ${
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
                title="Yeniden başlat"
              >
                <RefreshCw size={10} className={restarting === svc.id ? 'animate-spin' : ''} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* 4. SON AKTİVİTELER */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-bold">Sistem Akışı</h2>
        </div>
        
        <div className="space-y-2">
          {events.length > 0 ? events.slice(0, 6).map((ev, i) => (
            <div key={i} className="flex items-center gap-3 text-xs border-b border-ax-border/30 pb-2 last:border-0 last:pb-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                ev.type === 'error' ? 'bg-ax-red' : ev.type === 'warning' ? 'bg-yellow-500' : 'bg-ax-green'
              }`} />
              <div className="flex-1 min-w-0">
                <span className="text-ax-dim">[{ev.agent}]</span>
                <span className="text-ax-text ml-1 truncate">{ev.action}</span>
              </div>
              <span className="text-[10px] text-ax-subtle whitespace-nowrap">{timeAgo(ev.when)}</span>
            </div>
          )) : (
            <div className="text-center py-4 text-ax-dim text-xs italic">Aktivite bekleniyor...</div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div className="flex justify-between items-center px-2 text-[10px] text-ax-subtle font-medium uppercase tracking-widest">
        <div className="flex items-center gap-1">
          <div className="w-1 h-1 rounded-full bg-ax-green animate-pulse" />
          Sistem Çevrimiçi
        </div>
        <div>
          {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

    </div>
  )
}
