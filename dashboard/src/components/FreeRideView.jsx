import { useState, useEffect, useRef } from 'react'
import { Zap, RefreshCw, Play, Loader2, CheckCircle2, XCircle, Database, Cpu } from 'lucide-react'

const COMMANDS = [
  { id: 'status', label: 'Durum', desc: 'Mevcut model yapılandırmasını göster' },
  { id: 'list', label: 'Model Listesi', desc: 'Ücretsiz modelleri listele' },
  { id: 'auto', label: 'Otomatik Seç', desc: 'En iyi ücretsiz modeli otomatik seç' },
  { id: 'refresh', label: 'Önbelleği Yenile', desc: 'Model önbelleğini zorla yenile' },
  { id: 'fallbacks', label: 'Yedekler', desc: 'Yedek modelleri yapılandır' },
]

export default function FreeRideView() {
  const [status, setStatus] = useState(null)
  const [output, setOutput] = useState(null)
  const [running, setRunning] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)
  const outputRef = useRef(null)

  async function fetchStatus() {
    try {
      const r = await fetch('/api/skills/freeride/status')
      const d = await r.json()
      setStatus(d)
      if (d.run?.running !== running) setRunning(d.run?.running || false)
    } catch {}
  }

  async function fetchOutput() {
    try {
      const r = await fetch('/api/skills/freeride/output')
      const d = await r.json()
      setOutput(d)
      setRunning(d.running)
      if (!d.running) {
        clearInterval(pollRef.current)
        pollRef.current = null
        fetchStatus()
      }
    } catch {}
  }

  useEffect(() => {
    fetchStatus()
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [output?.output])

  async function runCommand(cmd) {
    setError(null)
    try {
      const r = await fetch('/api/skills/freeride/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: cmd }),
      })
      if (!r.ok) {
        const d = await r.json()
        setError(d.error || 'Hata')
        return
      }
      setRunning(true)
      // Poll output every 500ms
      pollRef.current = setInterval(fetchOutput, 500)
    } catch (e) {
      setError(e.message)
    }
  }

  const currentModel = status?.currentModel
  const fallbacks = status?.fallbacks || []
  const cacheInfo = status?.cacheInfo
  const out = output || status?.run

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-4xl">
      <div className="flex items-center gap-2">
        <Zap size={18} className="text-ax-accent" />
        <h1 className="text-ax-heading text-xl font-bold">FreeRide</h1>
        <span className="text-xs text-ax-dim bg-ax-muted px-2 py-0.5 rounded-full">OpenRouter Free AI</span>
      </div>
      <p className="text-ax-dim text-sm">OpenRouter üzerinden ücretsiz AI modellerini yönet ve OpenClaw yapılandırmasını güncelle.</p>

      {/* Config status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-2">
          <div className="flex items-center gap-2 text-ax-dim text-xs font-medium uppercase tracking-wider">
            <Cpu size={12} />
            Aktif Model
          </div>
          <p className="text-ax-heading text-sm font-mono break-all">
            {currentModel || <span className="text-ax-subtle italic">Yapılandırılmamış</span>}
          </p>
        </div>
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border space-y-2">
          <div className="flex items-center gap-2 text-ax-dim text-xs font-medium uppercase tracking-wider">
            <Database size={12} />
            Önbellek
          </div>
          {cacheInfo ? (
            <p className="text-ax-heading text-sm">
              {cacheInfo.count} model &bull; {cacheInfo.ageMin < 60
                ? `${cacheInfo.ageMin}dk önce`
                : `${Math.round(cacheInfo.ageMin / 60)}sa önce`}
            </p>
          ) : (
            <p className="text-ax-subtle text-sm italic">Önbellek yok</p>
          )}
        </div>
      </div>

      {/* Fallbacks */}
      {fallbacks.length > 0 && (
        <div className="p-4 rounded-xl bg-ax-panel border border-ax-border">
          <p className="text-ax-dim text-xs font-medium uppercase tracking-wider mb-2">Yedek Modeller ({fallbacks.length})</p>
          <div className="flex flex-wrap gap-1.5">
            {fallbacks.slice(0, 8).map(fb => (
              <span key={fb} className="text-xs bg-ax-muted border border-ax-border text-ax-dim px-2 py-0.5 rounded font-mono">{fb}</span>
            ))}
            {fallbacks.length > 8 && (
              <span className="text-xs text-ax-subtle">+{fallbacks.length - 8} daha</span>
            )}
          </div>
        </div>
      )}

      {/* Commands */}
      <div className="grid gap-2">
        <p className="text-ax-dim text-xs font-medium uppercase tracking-wider">Komutlar</p>
        {COMMANDS.map(c => (
          <div key={c.id} className="flex items-center gap-4 p-3.5 rounded-xl bg-ax-panel border border-ax-border">
            <div className="flex-1">
              <p className="text-ax-heading text-sm font-medium">{c.label}</p>
              <p className="text-ax-dim text-xs">{c.desc}</p>
            </div>
            <button
              onClick={() => runCommand(c.id)}
              disabled={running}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ax-accent/15 border border-ax-accent/30 text-ax-accent text-xs font-medium hover:bg-ax-accent/25 transition-colors disabled:opacity-40"
            >
              {running && out?.command === c.id
                ? <Loader2 size={12} className="animate-spin" />
                : <Play size={12} />}
              Çalıştır
            </button>
          </div>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-ax-red/10 border border-ax-red/30 text-ax-red text-sm">
          <XCircle size={14} />
          {error}
        </div>
      )}

      {/* Output console */}
      {out && (out.output || out.running) && (
        <div className="rounded-xl bg-ax-surface border border-ax-border overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-ax-border">
            <div className="flex items-center gap-2">
              <span className="text-ax-dim text-xs font-medium">Çıktı</span>
              {out.command && <span className="text-xs bg-ax-muted px-2 py-0.5 rounded text-ax-subtle font-mono">freeride {out.command}</span>}
            </div>
            <div className="flex items-center gap-2">
              {out.running && <Loader2 size={12} className="animate-spin text-ax-accent" />}
              {!out.running && out.exitCode === 0 && <CheckCircle2 size={13} className="text-ax-green" />}
              {!out.running && out.exitCode !== null && out.exitCode !== 0 && <XCircle size={13} className="text-ax-red" />}
              {out.lastRun && (
                <span className="text-xs text-ax-subtle">
                  {new Date(out.lastRun).toLocaleTimeString('tr-TR')}
                </span>
              )}
            </div>
          </div>
          <pre
            ref={outputRef}
            className="p-4 text-xs text-ax-text font-mono whitespace-pre-wrap max-h-72 overflow-y-auto leading-relaxed"
          >
            {out.output || (out.running ? 'Çalışıyor...' : '')}
          </pre>
        </div>
      )}

      <button
        onClick={fetchStatus}
        className="flex items-center gap-1.5 text-xs text-ax-dim hover:text-ax-text transition-colors"
      >
        <RefreshCw size={11} />
        Durumu Yenile
      </button>
    </div>
  )
}
