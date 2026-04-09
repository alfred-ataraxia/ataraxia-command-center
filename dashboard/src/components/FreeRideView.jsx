import { useState, useEffect } from 'react'
import { Bot, RefreshCw, Brain, Clock, CheckCircle2, Loader2, FileText, Zap } from 'lucide-react'

function formatUptime(sec) {
  if (sec < 60) return `${sec}sn`
  if (sec < 3600) return `${Math.floor(sec / 60)}dk`
  const h = Math.floor(sec / 3600)
  const m = Math.floor((sec % 3600) / 60)
  return `${h}sa ${m}dk`
}

function formatTimeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'az önce'
  if (mins < 60) return `${mins}dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}sa önce`
  return `${Math.floor(hours / 24)}g önce`
}

const PRIORITY_COLOR = {
  high:   'text-ax-red bg-ax-red/10 border-ax-red/25',
  medium: 'text-ax-amber bg-ax-amber/10 border-ax-amber/25',
  low:    'text-ax-dim bg-ax-muted border-ax-border',
}

export default function FreeRideView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  async function fetchStatus() {
    setLoading(true)
    try {
      const res = await fetch('/api/skills/freeride/status')
      if (res.ok) setData(await res.json())
    } catch {}
    setLoading(false)
  }

  useEffect(() => {
    fetchStatus()
    const iv = setInterval(fetchStatus, 60000)
    return () => clearInterval(iv)
  }, [])

  const alfred = data?.alfred
  const memory = data?.memory
  const activeTasks = data?.activeTasks || []
  const serverUptime = data?.serverUptime

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Bot size={18} className="text-ax-accent" />
          <h1 className="text-ax-heading text-xl font-bold">Alfred Oturumu</h1>
        </div>
        <button
          onClick={fetchStatus}
          className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors"
        >
          <RefreshCw size={13} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && !data && (
        <div className="flex items-center gap-2 text-ax-dim text-sm">
          <Loader2 size={14} className="animate-spin" />
          Yükleniyor...
        </div>
      )}

      {alfred && (
        <>
          {/* Model kartı */}
          <div className="p-5 rounded-xl bg-ax-panel border border-ax-accent/30 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-ax-accent/10 border border-ax-accent/25 flex items-center justify-center shrink-0">
                <Bot size={20} className="text-ax-accent" />
              </div>
              <div>
                <p className="text-ax-heading font-bold">{alfred.owner ? `Alfred — ${alfred.owner}` : 'Alfred'}</p>
                <p className="text-ax-dim text-xs">{alfred.role}</p>
              </div>
              <span className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium text-ax-green bg-ax-green/10 border-ax-green/25">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ax-green opacity-60" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-ax-green" />
                </span>
                Aktif
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Model',    value: alfred.model,    icon: Zap },
                { label: 'Platform', value: alfred.platform, icon: Bot },
                { label: 'Sistem',   value: alfred.location, icon: Clock },
                { label: 'Uptime',   value: serverUptime != null ? formatUptime(serverUptime) : '—', icon: Clock },
              ].map(({ label, value, icon: Icon }) => (
                <div key={label} className="rounded-lg bg-ax-bg border border-ax-border p-3 space-y-1">
                  <div className="flex items-center gap-1.5 text-ax-dim text-[10px] font-medium uppercase tracking-wider">
                    <Icon size={10} />
                    {label}
                  </div>
                  <p className="text-ax-heading text-xs font-mono truncate">{value || '—'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Aktif görevler */}
          <div className="space-y-2">
            <p className="text-ax-dim text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 size={11} />
              Aktif Görevler ({activeTasks.length})
            </p>
            {activeTasks.length === 0 ? (
              <p className="text-ax-subtle text-sm italic px-1">Şu an aktif görev yok.</p>
            ) : (
              activeTasks.map(t => (
                <div key={t.id} className="flex items-start gap-3 p-3.5 rounded-xl bg-ax-panel border border-ax-border">
                  <Loader2 size={14} className="text-ax-accent animate-spin mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-ax-heading text-sm font-medium truncate">{t.title}</p>
                    {t.description && <p className="text-ax-dim text-xs mt-0.5 line-clamp-2">{t.description}</p>}
                  </div>
                  <span className={`shrink-0 px-2 py-0.5 rounded-full border text-[10px] font-medium ${PRIORITY_COLOR[t.priority] || PRIORITY_COLOR.low}`}>
                    {t.priority}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* Hafıza */}
          <div className="space-y-2">
            <p className="text-ax-dim text-xs font-medium uppercase tracking-wider flex items-center gap-1.5">
              <Brain size={11} />
              Hafıza ({memory?.count ?? 0} dosya)
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(memory?.files || []).map(f => (
                <span key={f} className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-ax-panel border border-ax-border text-ax-dim text-xs">
                  <FileText size={10} className="text-ax-purple" />
                  {f.replace('.md', '')}
                </span>
              ))}
              {(memory?.count === 0) && (
                <p className="text-ax-subtle text-xs italic">Hafıza dosyası bulunamadı.</p>
              )}
            </div>
          </div>

          {/* Son aktivite */}
          <p className="text-ax-subtle text-xs">
            Son aktivite: {formatTimeAgo(data.lastActivity)}
          </p>
        </>
      )}
    </div>
  )
}
