import { useState, useEffect, useCallback } from 'react'
import { Sun, TrendingUp, ListTodo, Activity, AlertCircle, RefreshCw } from 'lucide-react'

function Coin({ symbol, price }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-ax-surface border border-ax-border min-w-[64px]">
      <span className="text-[10px] text-ax-dim font-bold uppercase tracking-wider">{symbol}</span>
      <span className="text-xs font-mono font-bold text-ax-heading mt-0.5">${Number(price).toLocaleString('en-US', {maximumFractionDigits: 2})}</span>
    </div>
  )
}

export default function DailySummary() {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(() => {
    setLoading(true)
    fetch('/api/daily-summary')
      .then(r => r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`)))
      .then(d => { setData(d); setError(null) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    fetchData()
    const t = setInterval(fetchData, 5 * 60_000)
    return () => clearInterval(t)
  }, [fetchData])

  if (error) return (
    <div className="rounded-2xl bg-ax-panel border border-ax-amber/30 p-5 flex items-center gap-3">
      <AlertCircle size={16} className="text-ax-amber shrink-0" />
      <p className="text-ax-dim text-xs flex-1">Günlük özet yüklenemedi: {error}</p>
      <button onClick={fetchData} disabled={loading}
        className="flex items-center gap-1.5 px-2 py-1 rounded-lg border border-ax-border text-xs text-ax-dim hover:text-ax-text hover:border-ax-muted transition-colors disabled:opacity-40">
        <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        Tekrar Dene
      </button>
    </div>
  )

  if (!data) return null

  const today = new Date().toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })
  const market = data.market || {}
  const tasks = data.tasks || {}
  const defi = data.defi || {}

  return (
    <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sun size={16} className="text-ax-amber" />
        <h2 className="text-ax-heading text-sm font-bold">Günlük Özet</h2>
        <span className="ml-auto text-[11px] text-ax-dim capitalize">{today}</span>
      </div>

      <div className="space-y-4">
        {/* Piyasa */}
        {Object.keys(market).length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <TrendingUp size={11} className="text-ax-subtle" />
              <span className="text-[10px] text-ax-dim uppercase tracking-wider font-bold">Piyasa</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              {Object.entries(market).map(([sym, price]) => (
                <Coin key={sym} symbol={sym} price={price} />
              ))}
            </div>
          </div>
        )}

        {/* Görevler */}
        {tasks.total != null && (
          <div>
            <div className="flex items-center gap-1.5 mb-2">
              <ListTodo size={11} className="text-ax-subtle" />
              <span className="text-[10px] text-ax-dim uppercase tracking-wider font-bold">Görevler</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-2 rounded-lg bg-ax-surface border border-ax-border">
                <p className="text-sm font-black text-ax-amber font-mono">{tasks.pending ?? 0}</p>
                <p className="text-[9px] text-ax-dim">Bekliyor</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-ax-surface border border-ax-border">
                <p className="text-sm font-black text-ax-cyan font-mono">{tasks.inProgress ?? 0}</p>
                <p className="text-[9px] text-ax-dim">Devam</p>
              </div>
              <div className="text-center p-2 rounded-lg bg-ax-surface border border-ax-border">
                <p className="text-sm font-black text-ax-green font-mono">{tasks.done ?? 0}</p>
                <p className="text-[9px] text-ax-dim">Bitti</p>
              </div>
            </div>
          </div>
        )}

        {/* DeFi */}
        {defi.status && (
          <div className="flex items-center justify-between pt-3 border-t border-ax-border/50">
            <div className="flex items-center gap-1.5">
              <Activity size={11} className="text-ax-subtle" />
              <span className="text-[10px] text-ax-dim uppercase tracking-wider font-bold">DeFi APM</span>
            </div>
            <div className="flex items-center gap-3">
              {defi.poolCount != null && (
                <span className="text-[11px] font-mono text-ax-dim">{defi.poolCount} havuz</span>
              )}
              <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                defi.status === 'ok' ? 'bg-ax-green/10 text-ax-green' : 'bg-ax-red/10 text-ax-red'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${defi.status === 'ok' ? 'bg-ax-green animate-pulse' : 'bg-ax-red'}`} />
                {defi.status === 'ok' ? 'Aktif' : 'Down'}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
