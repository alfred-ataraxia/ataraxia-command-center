import { useEffect, useState } from 'react'
import apiFetch from '../services/apiFetch'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import { TrendingUp, RefreshCw } from 'lucide-react'

function formatLabel(iso) {
  const d = new Date(iso)
  return d.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

const SERIES = [
  { key: 'cpu',  label: 'CPU',  color: '#7c6af7' },
  { key: 'mem',  label: 'RAM',  color: '#22d3ee' },
  { key: 'disk', label: 'Disk', color: '#34d399' },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="rounded-lg bg-ax-panel border border-ax-border px-3 py-2 text-xs shadow-lg">
      <p className="text-ax-dim mb-1">{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.color }} className="tabular-nums">
          {p.name}: {p.value}%
        </p>
      ))}
    </div>
  )
}

export default function SystemMetricsChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const fetchHistory = () => {
    apiFetch('/api/stats/history')
      .then(r => r.json())
      .then(raw => {
        const mapped = raw.map(d => ({
          time: formatLabel(d.t),
          cpu: d.cpu,
          mem: d.mem,
          disk: d.disk,
        }))
        setData(mapped)
        setError(false)
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchHistory()
    // Refresh every 5 min to pick up new samples
    const t = setInterval(fetchHistory, 5 * 60 * 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-semibold">Sistem Metrikleri</h2>
          <span className="text-ax-subtle text-[10px]">Son 24 saat</span>
        </div>
        <div className="flex items-center gap-3">
          {SERIES.map(s => (
            <span key={s.key} className="flex items-center gap-1 text-[10px] text-ax-dim">
              <span className="w-2 h-2 rounded-full inline-block" style={{ background: s.color }} />
              {s.label}
            </span>
          ))}
          {loading && <RefreshCw size={10} className="text-ax-dim animate-spin" />}
        </div>
      </div>

      {error ? (
        <p className="text-ax-dim text-xs py-6 text-center">Geçmiş veri alınamadı</p>
      ) : data.length === 0 && !loading ? (
        <p className="text-ax-dim text-xs py-6 text-center">Henüz yeterli veri yok (5 dakikada bir örnekleme)</p>
      ) : (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
            <defs>
              {SERIES.map(s => (
                <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={s.color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={s.color} stopOpacity={0} />
                </linearGradient>
              ))}
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="time"
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: '#6b7280', fontSize: 10 }}
              tickLine={false}
              axisLine={false}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip content={<CustomTooltip />} />
            {SERIES.map(s => (
              <Area
                key={s.key}
                type="monotone"
                dataKey={s.key}
                name={s.label}
                stroke={s.color}
                strokeWidth={1.5}
                fill={`url(#grad-${s.key})`}
                dot={false}
                activeDot={{ r: 3, fill: s.color }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
