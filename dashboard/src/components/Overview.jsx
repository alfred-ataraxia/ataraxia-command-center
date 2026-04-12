import { useState, useEffect } from 'react'
import { Cpu, MemoryStick, Clock, AlertCircle, Bot, Zap, Activity, Terminal } from 'lucide-react'
import { getSystemStats } from '../services/haService'
import apiFetch from '../services/apiFetch'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'şimdi'
  if (m < 60) return `${m}dk`
  return `${Math.floor(m / 60)}sa`
}

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [activeAI, setActiveAI] = useState('Yükleniyor...')
  const [events, setEvents] = useState([])
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(tick)
  }, [])

  const fetchData = async () => {
    try {
      // 1. Sistem İstatistikleri
      const s = await getSystemStats()
      setStats(s)

      // 2. Aktif AI Durumu (Basitleştirilmiş)
      const resAI = await apiFetch('/api/ai-status')
      if (resAI.ok) {
        const d = await resAI.json()
        setActiveAI(d.active || 'Yok')
      }

      // 3. Son Olaylar (Aktivite + Uyarı Birleşimi)
      const resAct = await apiFetch('/api/activity')
      if (resAct.ok) {
        const d = await resAct.json()
        setEvents(d.activities?.slice(0, 5) || [])
      }
    } catch (err) {
      console.error('Veri çekme hatası:', err)
    }
  }

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 20_000) // 20 saniyede bir güncelleme
    return () => clearInterval(t)
  }, [])

  const ramUsage = stats?.memPercent != null ? Math.round(stats.memPercent) : 0
  const cpuUsage = stats?.cpuPercent != null ? Math.round(stats.cpuPercent) : 0

  return (
    <div className="p-4 space-y-4 max-w-2xl mx-auto">
      
      {/* 1. KISIM: AI KONTROL PANELİ */}
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
          <div className="flex gap-2">
            <button className="p-2 rounded-lg bg-ax-surface border border-ax-border text-ax-dim hover:text-ax-text transition-colors" title="AI Değiştir">
              <Zap size={16} />
            </button>
          </div>
        </div>
        
        {/* Hızlı Kaynak Durumu (Bar) */}
        <div className="grid grid-cols-2 gap-4 pt-2 border-t border-ax-border/50">
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-ax-dim font-bold">
              <span>RAM</span>
              <span className={ramUsage > 80 ? 'text-ax-red' : 'text-ax-cyan'}>%{ramUsage}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ax-muted overflow-hidden">
              <div 
                className={`h-full transition-all duration-1000 ${ramUsage > 80 ? 'bg-ax-red' : 'bg-ax-cyan'}`} 
                style={{ width: `${ramUsage}%` }} 
              />
            </div>
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-ax-dim font-bold">
              <span>CPU</span>
              <span className="text-ax-accent">%{cpuUsage}</span>
            </div>
            <div className="h-1.5 rounded-full bg-ax-muted overflow-hidden">
              <div className="h-full bg-ax-accent transition-all duration-1000" style={{ width: `${cpuUsage}%` }} />
            </div>
          </div>
        </div>
      </div>

      {/* 2. KISIM: SON AKTİVİTELER (KOKPİT AKIŞI) */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-bold uppercase tracking-tight">Sistem Akışı</h2>
        </div>
        
        <div className="space-y-3">
          {events.length > 0 ? events.map((ev, i) => (
            <div key={i} className="flex items-center gap-3 text-xs border-b border-ax-border/30 pb-2 last:border-0 last:pb-0">
              <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${ev.type === 'error' ? 'bg-ax-red' : 'bg-ax-green'}`} />
              <div className="flex-1 truncate">
                <span className="text-ax-dim">[{ev.agent}]</span>
                <span className="text-ax-text ml-1">{ev.action}</span>
              </div>
              <span className="text-[10px] text-ax-subtle whitespace-nowrap">{timeAgo(ev.when)}</span>
            </div>
          )) : (
            <div className="text-center py-4 text-ax-dim text-xs italic">Aktivite bekleniyor...</div>
          )}
        </div>
      </div>

      {/* 3. KISIM: HIZLI KOMUTLAR */}
      <div className="grid grid-cols-2 gap-3">
        <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-ax-surface border border-ax-border text-ax-dim hover:bg-ax-muted transition-all">
          <Terminal size={14} />
          <span className="text-xs font-bold">Logları Gör</span>
        </button>
        <button className="flex items-center justify-center gap-2 p-3 rounded-xl bg-ax-surface border border-ax-border text-ax-dim hover:bg-ax-muted transition-all">
          <Clock size={14} />
          <span className="text-xs font-bold">Yedekle</span>
        </button>
      </div>

      {/* FOOTER: SAAT VE DURUM */}
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
