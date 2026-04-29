import { useState, useEffect, useCallback } from 'react'
import { BrainCircuit, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const TYPE_STYLE = {
  feedback:  { label: 'Feedback',  cls: 'text-ax-amber  bg-ax-amber/10  border-ax-amber/30'  },
  project:   { label: 'Proje',     cls: 'text-ax-cyan   bg-ax-cyan/10   border-ax-cyan/30'   },
  user:      { label: 'Kullanıcı', cls: 'text-ax-purple bg-ax-purple/10 border-ax-purple/30' },
  reference: { label: 'Referans',  cls: 'text-ax-green  bg-ax-green/10  border-ax-green/30'  },
}

function MemoryCard({ mem }) {
  const [open, setOpen] = useState(false)
  const style = TYPE_STYLE[mem.type] || { label: mem.type || '—', cls: 'text-ax-dim bg-ax-muted border-ax-border' }

  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ax-muted/40 transition-colors text-left"
      >
        {open ? <ChevronDown size={13} className="text-ax-dim shrink-0" /> : <ChevronRight size={13} className="text-ax-dim shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-ax-text text-sm font-medium truncate">{mem.name}</p>
          {mem.description && <p className="text-ax-dim text-xs mt-0.5 truncate">{mem.description}</p>}
        </div>
        {mem.type && (
          <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-medium ${style.cls}`}>
            {style.label}
          </span>
        )}
      </button>

      {open && mem.content && (
        <div className="border-t border-ax-border bg-ax-surface px-4 py-3">
          <pre className="text-ax-dim text-[11px] leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
            {mem.content}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function MemoryView() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)
  const [ovHealth, setOvHealth] = useState(null)
  const [ovKpi, setOvKpi] = useState(null)
  const [ovQuery, setOvQuery] = useState('')
  const [ovResult, setOvResult] = useState(null)
  const [ovLoading, setOvLoading] = useState(false)

  const fetchMemories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/memory')
      if (res.ok) {
        const data = await res.json()
        // MEMORY.md'yi sona at, diğerlerini type'a göre sırala
        const files = data.files || []
        const isIndex = f => f.name === 'MEMORY.md' || f.name?.toLowerCase() === 'memory.md'
        const rest = files.filter(f => !isIndex(f))
        const index = files.filter(isIndex)
        setMemories([...rest, ...index])
      }
    } catch {
      setMemories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMemories()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchMemories])

  const fetchOvHealth = useCallback(async () => {
    try {
      const res = await apiFetch('/api/openviking/health')
      const data = await res.json()
      setOvHealth(res.ok ? data : null)
    } catch {
      setOvHealth(null)
    }
  }, [])

  const fetchOvKpi = useCallback(async () => {
    try {
      const res = await apiFetch('/api/openviking/kpi?days=7')
      const data = await res.json()
      setOvKpi(res.ok ? data : null)
    } catch {
      setOvKpi(null)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchOvHealth()
      void fetchOvKpi()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchOvHealth, fetchOvKpi])

  const runOvQuery = async (event) => {
    event.preventDefault()
    const q = ovQuery.trim()
    if (!q) return
    setOvLoading(true)
    setOvResult(null)
    try {
      const res = await apiFetch('/api/openviking/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q }),
      })
      const data = await res.json()
      setOvResult(data)
    } catch (err) {
      setOvResult({ ok: false, error: err?.message || 'Sorgu hatası' })
    } finally {
      setOvLoading(false)
    }
  }

  const byType = {}
  for (const m of memories) {
    const t = m.type || 'other'
    if (!byType[t]) byType[t] = []
    byType[t].push(m)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-ax-accent" />
          <h1 className="text-ax-heading text-xl font-bold">Hafıza</h1>
          <span className="text-ax-dim text-sm">({memories.length} dosya)</span>
        </div>
        <button onClick={fetchMemories} className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors">
          <RefreshCw size={14} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && memories.length === 0 && (
        <p className="text-ax-dim text-sm">Yükleniyor...</p>
      )}

      <div className="rounded-xl bg-ax-panel border border-ax-border p-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-ax-text text-sm font-semibold">OpenViking Pilot (Dry-run)</p>
            <p className="text-ax-dim text-xs">Production contextEngine değişmez; sadece hafıza doğrulama paneli.</p>
          </div>
          <button
            onClick={() => {
              void fetchOvHealth()
              void fetchOvKpi()
            }}
            className="p-2 rounded-lg bg-ax-surface border border-ax-border hover:bg-ax-muted transition-colors"
          >
            <RefreshCw size={14} className="text-ax-dim" />
          </button>
        </div>

        {ovHealth?.ok ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">CLI</p>
              <p className="text-ax-text font-medium">{ovHealth.openvikingCli ? 'Var' : 'Yok'}</p>
            </div>
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">Queue Pending</p>
              <p className="text-ax-text font-medium">{ovHealth.queue?.pending ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">Queue Error</p>
              <p className="text-ax-text font-medium">{ovHealth.queue?.errors ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">Son Skor</p>
              <p className="text-ax-text font-medium">
                {ovHealth.lastScore?.passed != null && ovHealth.lastScore?.total != null
                  ? `${ovHealth.lastScore.passed}/${ovHealth.lastScore.total}`
                  : '—'}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-ax-dim text-xs">OpenViking health verisi alınamadı.</p>
        )}

        {ovKpi?.ok ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">7g Intent</p>
              <p className="text-ax-text font-medium">{ovKpi.metrics?.memoryIntentEvents ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">Fallback %</p>
              <p className="text-ax-text font-medium">{ovKpi.metrics?.fallbackRatePct ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">P95 (ms)</p>
              <p className="text-ax-text font-medium">{ovKpi.metrics?.p95LatencyMs ?? '—'}</p>
            </div>
            <div className="rounded-lg bg-ax-surface border border-ax-border p-2">
              <p className="text-ax-dim">Blocked %</p>
              <p className="text-ax-text font-medium">{ovKpi.metrics?.replyBlockedRatePct ?? '—'}</p>
            </div>
          </div>
        ) : (
          <p className="text-ax-dim text-xs">OpenViking KPI verisi henüz yok.</p>
        )}

        <form onSubmit={runOvQuery} className="space-y-2">
          <label className="block text-xs text-ax-dim">Dry-run hafıza sorgusu</label>
          <div className="flex gap-2">
            <input
              value={ovQuery}
              onChange={(e) => setOvQuery(e.target.value)}
              placeholder="Örn: Dashboard hangi portta?"
              className="flex-1 rounded-lg bg-ax-surface border border-ax-border px-3 py-2 text-sm text-ax-text placeholder:text-ax-dim focus:outline-none focus:ring-1 focus:ring-ax-accent"
            />
            <button
              type="submit"
              disabled={ovLoading}
              className="px-3 py-2 rounded-lg bg-ax-accent text-white text-sm font-medium disabled:opacity-60"
            >
              {ovLoading ? 'Sorgulanıyor' : 'Sorgula'}
            </button>
          </div>
        </form>

        {ovResult && (
          <div className="rounded-lg bg-ax-surface border border-ax-border p-3 space-y-2">
            {ovResult.ok ? (
              <>
                <p className="text-xs text-ax-dim">
                  Confidence: <span className="text-ax-text">{ovResult.result?.confidence || '—'}</span> ·
                  Strategy: <span className="text-ax-text">{ovResult.result?.strategy || '—'}</span> ·
                  Süre: <span className="text-ax-text">{ovResult.result?.elapsed_ms ?? '—'}ms</span>
                </p>
                <pre className="text-[11px] text-ax-dim whitespace-pre-wrap font-mono max-h-56 overflow-y-auto">
                  {ovResult.result?.summary || 'Özet yok'}
                </pre>
              </>
            ) : (
              <p className="text-xs text-ax-amber">Sorgu hatası: {ovResult.error || ovResult.details || 'Bilinmeyen hata'}</p>
            )}
          </div>
        )}
      </div>

      {Object.entries(byType).map(([type, items]) => {
        const style = TYPE_STYLE[type]
        return (
          <div key={type} className="space-y-2">
            {style && (
              <p className={`text-[10px] font-semibold uppercase tracking-wider px-1 ${style.cls.split(' ')[0]}`}>
                {style.label}
              </p>
            )}
            {items.map((mem, i) => <MemoryCard key={i} mem={mem} />)}
          </div>
        )
      })}
    </div>
  )
}
