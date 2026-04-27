import { useState, useEffect, useCallback } from 'react'
import { Sun, TrendingUp, ListTodo, Activity, AlertCircle, RefreshCw, Sparkles, LineChart, CheckSquare } from 'lucide-react'

function Coin({ symbol, price }) {
  return (
    <div className="flex flex-col items-center px-3 py-2 rounded-xl bg-ax-surface border border-ax-border min-w-[64px]">
      <span className="text-[10px] text-ax-dim font-bold">{symbol}</span>
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

  const now = new Date()
  const market = data.market || {}
  const tasks = data.tasks || {}
  const defi = data.defi || {}

  const btc = Number(market.BTC || 0).toLocaleString('en-US')
  const eth = Number(market.ETH || 0).toLocaleString('en-US')
  const sol = Number(market.SOL || 0).toLocaleString('en-US')
  const taskStats = { bekleyen: tasks.pending || 0, devam: tasks.inProgress || 0, tamam: tasks.done || 0 }

  return (
    <div className="rounded-xl ax-glass p-4 relative overflow-hidden group">

      <div className="flex items-center justify-between mb-5 relative z-10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-ax-amber/10">
            <Sparkles size={14} className="text-ax-amber" />
          </div>
          <h2 className="text-xs font-bold uppercase text-ax-heading">Günlük Özet</h2>
        </div>
        <span className="text-[10px] font-mono text-ax-dim">{now.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', weekday: 'long' })}</span>
      </div>

      <div className="space-y-5 relative z-10">
        {/* Piyasalar */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <LineChart size={12} className="text-ax-dim" />
            <h3 className="text-[11px] font-bold text-ax-dim uppercase">Piyasa</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-ax-surface border border-ax-border hover:bg-ax-muted transition-colors">
              <span className="text-[10px] text-ax-subtle font-mono mb-1">BTC</span>
              <span className="text-sm font-black text-ax-heading font-mono">${btc}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-ax-surface border border-ax-border hover:bg-ax-muted transition-colors">
              <span className="text-[10px] text-ax-subtle font-mono mb-1">ETH</span>
              <span className="text-sm font-black text-ax-heading font-mono">${eth}</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-ax-surface border border-ax-border hover:bg-ax-muted transition-colors">
              <span className="text-[10px] text-ax-subtle font-mono mb-1">SOL</span>
              <span className="text-sm font-black text-ax-heading font-mono">${sol}</span>
            </div>
          </div>
        </div>

        {/* Görevler */}
        <div>
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare size={12} className="text-ax-dim" />
            <h3 className="text-[11px] font-bold text-ax-dim uppercase">Görevler</h3>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-ax-surface border border-ax-border hover:bg-ax-muted transition-colors">
              <span className={`text-lg font-black font-mono ${taskStats.bekleyen > 0 ? 'text-ax-amber' : 'text-ax-dim'}`}>{taskStats.bekleyen}</span>
              <span className="text-[11px] text-ax-dim mt-0.5">Bekleyen</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-ax-surface border border-ax-border hover:bg-ax-muted transition-colors">
              <span className={`text-lg font-black font-mono ${taskStats.devam > 0 ? 'text-ax-cyan' : 'text-ax-dim'}`}>{taskStats.devam}</span>
              <span className="text-[11px] text-ax-dim mt-0.5">Devam</span>
            </div>
            <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-ax-surface border border-ax-border hover:bg-ax-muted transition-colors">
              <span className="text-lg font-black text-ax-green font-mono">{taskStats.tamam}</span>
              <span className="text-[11px] text-ax-dim mt-0.5">Tamam</span>
            </div>
          </div>
        </div>

        {/* DeFi */}
        {defi.status && (
          <div className="flex items-center justify-between pt-3 border-t border-ax-border/50">
            <div className="flex items-center gap-1.5">
              <Activity size={11} className="text-ax-subtle" />
              <span className="text-[10px] text-ax-dim font-bold">DeFi APM</span>
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
