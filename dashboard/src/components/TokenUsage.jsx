import { useState, useEffect } from 'react'
import { Zap, TrendingDown, AlertTriangle } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const WEEKLY_BUDGET = 35000

function TokenUsageBar({ label, value, max, color, icon: Icon }) {
  const percent = Math.round((value / max) * 100)
  const isWarning = percent >= 80

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className={`text-${color}`} />
          <span className="text-xs text-ax-dim">{label}</span>
        </div>
        <span className="text-xs text-ax-text tabular-nums font-medium">
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className={`h-1.5 rounded-full ${isWarning ? 'bg-red-500/20' : 'bg-ax-muted'} overflow-hidden`}>
        <div
          className={`h-full rounded-full ${
            percent >= 90 ? 'bg-red-500' :
            percent >= 80 ? 'bg-ax-amber' :
            color === 'ax-cyan' ? 'bg-ax-cyan' :
            color === 'ax-accent' ? 'bg-ax-accent' :
            'bg-ax-green'
          } transition-all duration-700`}
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
      <div className="text-[10px] text-ax-subtle text-right">
        {percent}% kullanılmış
      </div>
    </div>
  )
}

export default function TokenUsage() {
  const [tokenData, setTokenData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await apiFetch('/api/tokens')
        if (!response.ok) throw new Error('Token API failed')
        const data = await response.json()
        setTokenData(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchTokenData()
    // Refresh every 5 minutes
    const interval = setInterval(fetchTokenData, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-ax-amber" />
          <h2 className="text-ax-heading text-sm font-semibold">Token Kullanımı</h2>
        </div>
        <div className="space-y-3">
          <div className="h-6 w-full rounded-md bg-ax-muted animate-pulse" />
          <div className="h-4 w-3/4 rounded-md bg-ax-muted animate-pulse" />
          <div className="h-4 w-1/2 rounded-md bg-ax-muted animate-pulse" />
        </div>
      </div>
    )
  }

  if (error || !tokenData) {
    return (
      <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
        <div className="flex items-center gap-2 mb-4">
          <Zap size={14} className="text-ax-amber" />
          <h2 className="text-ax-heading text-sm font-semibold">Token Kullanımı</h2>
        </div>
        <p className="text-ax-dim text-xs">{error || 'Token verisi yüklenmedi'}</p>
      </div>
    )
  }

  const weeklyUsed = tokenData.estimated_tokens || 0
  const weeklyRemaining = Math.max(0, WEEKLY_BUDGET - weeklyUsed)
  const weeklyPercent = Math.round((weeklyUsed / WEEKLY_BUDGET) * 100)

  const showWarning = weeklyPercent >= 80

  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Zap size={14} className="text-ax-amber" />
          <h2 className="text-ax-heading text-sm font-semibold">Token Kullanımı</h2>
        </div>
        {showWarning && (
          <AlertTriangle size={12} className="text-red-400" />
        )}
      </div>

      {/* Weekly budget bar */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-ax-dim">Haftalık Bütçe</span>
          <span className="text-xs font-medium text-ax-text tabular-nums">
            {weeklyUsed.toLocaleString()} / {WEEKLY_BUDGET.toLocaleString()}
          </span>
        </div>
        <div className={`h-2 rounded-full ${showWarning ? 'bg-red-500/20' : 'bg-ax-muted'} overflow-hidden`}>
          <div
            className={`h-full rounded-full ${
              weeklyPercent >= 90 ? 'bg-red-500' :
              weeklyPercent >= 80 ? 'bg-ax-amber' :
              'bg-ax-cyan'
            } transition-all duration-700`}
            style={{ width: `${Math.min(weeklyPercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-[10px] text-ax-subtle">{weeklyPercent}% kullanılmış</span>
          <span className="text-[10px] text-ax-accent2 font-medium">
            {weeklyRemaining.toLocaleString()} kaldı
          </span>
        </div>
      </div>

      {/* Model breakdown */}
      {tokenData.tasks_by_model && (
        <div className="space-y-3 pt-3 border-t border-ax-border">
          <div className="text-[10px] text-ax-dim font-semibold uppercase tracking-wider">Model Dağılımı</div>
          <TokenUsageBar
            label="Haiku"
            value={tokenData.tasks_by_model.haiku || 0}
            max={50}
            color="ax-green"
            icon={TrendingDown}
          />
          <TokenUsageBar
            label="Sonnet"
            value={tokenData.tasks_by_model.sonnet || 0}
            max={10}
            color="ax-accent"
            icon={Zap}
          />
          <TokenUsageBar
            label="Opus"
            value={tokenData.tasks_by_model.opus || 0}
            max={2}
            color="ax-cyan"
            icon={Zap}
          />
        </div>
      )}

      {/* Warning banner */}
      {showWarning && (
        <div className="mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
          <p className="text-red-300 text-xs font-medium">
            Token bütçesinin {weeklyPercent}%'i kullanıldı
          </p>
          <p className="text-red-400/70 text-[10px] mt-1">
            {weeklyRemaining > 0
              ? `${weeklyRemaining.toLocaleString()} token kaldı`
              : 'Haftalık bütçe tükenmiş'}
          </p>
        </div>
      )}
    </div>
  )
}
