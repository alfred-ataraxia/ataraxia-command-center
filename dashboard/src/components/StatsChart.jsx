import { useState, useEffect } from 'react'
import { TrendingUp } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const LINES = [
  { key: 'cpu',  label: 'CPU',  color: '#6366f1' },
  { key: 'mem',  label: 'RAM',  color: '#06b6d4' },
  { key: 'disk', label: 'Disk', color: '#f59e0b' },
]

const W = 600
const H = 120
const PAD = { top: 8, right: 8, bottom: 20, left: 28 }
const IW = W - PAD.left - PAD.right
const IH = H - PAD.top - PAD.bottom

function toPath(points, xScale, yScale) {
  return points.map((p, i) => `${i === 0 ? 'M' : 'L'}${xScale(i)},${yScale(p)}`).join(' ')
}

function formatTime(iso) {
  try { return new Date(iso).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }) }
  catch { return '' }
}

export default function StatsChart() {
  const [history, setHistory] = useState([])
  const [hover, setHover] = useState(null)

  useEffect(() => {
    async function fetch() {
      try {
        const res = await apiFetch('/api/stats/history')
        if (res.ok) {
          const d = await res.json()
          const arr = Array.isArray(d) ? d : (d.history || [])
          setHistory(arr.slice(-60)) // son 60 nokta (~1 saat)
        }
      } catch {
        setHistory([])
      }
    }
    fetch()
    const t = setInterval(fetch, 30_000)
    return () => clearInterval(t)
  }, [])

  if (history.length < 2) return null

  const n = history.length
  const xScale = i => PAD.left + (i / (n - 1)) * IW
  const yScale = v => PAD.top + IH - (v / 100) * IH

  // Y eksen çizgileri: 0, 25, 50, 75, 100
  const yTicks = [0, 25, 50, 75, 100]

  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TrendingUp size={14} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-semibold">Son 1 Saat</h2>
        </div>
        <div className="flex items-center gap-3">
          {LINES.map(l => (
            <span key={l.key} className="flex items-center gap-1.5 text-[10px] text-ax-dim">
              <span className="inline-block w-2.5 h-0.5 rounded" style={{ backgroundColor: l.color }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 120 }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={e => {
          const rect = e.currentTarget.getBoundingClientRect()
          const x = ((e.clientX - rect.left) / rect.width) * W - PAD.left
          const idx = Math.round((x / IW) * (n - 1))
          if (idx >= 0 && idx < n) setHover(idx)
        }}
      >
        {/* Grid */}
        {yTicks.map(v => (
          <g key={v}>
            <line
              x1={PAD.left} y1={yScale(v)} x2={W - PAD.right} y2={yScale(v)}
              stroke="#ffffff08" strokeWidth={1}
            />
            <text x={PAD.left - 4} y={yScale(v) + 3} fill="#ffffff30" fontSize={8} textAnchor="end">
              {v}
            </text>
          </g>
        ))}

        {/* X labels: start, mid, end */}
        {[0, Math.floor(n / 2), n - 1].map(i => (
          <text key={i} x={xScale(i)} y={H - 4} fill="#ffffff30" fontSize={8} textAnchor="middle">
            {formatTime(history[i]?.t)}
          </text>
        ))}

        {/* Lines */}
        {LINES.map(l => (
          <path
            key={l.key}
            d={toPath(history.map(p => p[l.key] ?? 0), xScale, yScale)}
            fill="none"
            stroke={l.color}
            strokeWidth={1.5}
            strokeLinejoin="round"
            strokeLinecap="round"
            opacity={0.85}
          />
        ))}

        {/* Hover */}
        {hover !== null && (
          <>
            <line
              x1={xScale(hover)} y1={PAD.top} x2={xScale(hover)} y2={H - PAD.bottom}
              stroke="#ffffff20" strokeWidth={1} strokeDasharray="3 3"
            />
            {LINES.map(l => {
              const v = history[hover]?.[l.key]
              if (v == null) return null
              return (
                <circle key={l.key} cx={xScale(hover)} cy={yScale(v)} r={3}
                  fill={l.color} stroke="#1a1a2e" strokeWidth={1.5} />
              )
            })}
            {/* Tooltip */}
            <foreignObject
              x={Math.min(xScale(hover) + 6, W - 80)}
              y={PAD.top}
              width={75} height={60}
            >
              <div xmlns="http://www.w3.org/1999/xhtml"
                className="bg-ax-surface border border-ax-border rounded-lg px-2 py-1.5 text-[10px] space-y-0.5 shadow-lg">
                {LINES.map(l => (
                  <div key={l.key} className="flex justify-between gap-2">
                    <span style={{ color: l.color }}>{l.label}</span>
                    <span className="text-ax-text font-mono">{history[hover]?.[l.key] ?? '—'}%</span>
                  </div>
                ))}
              </div>
            </foreignObject>
          </>
        )}
      </svg>
    </div>
  )
}
