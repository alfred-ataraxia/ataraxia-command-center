import { Flag, CheckCircle2, Clock, XCircle } from 'lucide-react'

export default function SprintStatus({ sprint }) {
  if (!sprint) return null

  const total = Number(sprint.total || 0)
  const done  = Number(sprint.done  || 0)
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="rounded-xl ax-glass p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-ax-cyan/10">
            <Flag size={13} className="text-ax-cyan" />
          </div>
          <h2 className="text-sm font-semibold text-ax-heading">{sprint.name}</h2>
          {sprint.status === 'ACTIVE' && (
            <div className="w-1.5 h-1.5 rounded-full bg-ax-cyan animate-pulse" />
          )}
        </div>
        <span className="text-xs font-mono text-ax-dim">{sprint.start}</span>
      </div>

      <div className="mb-3">
        <div className="flex justify-between items-center mb-1">
          <span className="text-xs text-ax-dim">İlerleme</span>
          <span className="text-xs font-mono font-semibold text-ax-cyan">{pct}%</span>
        </div>
        <div className="h-1 rounded-full bg-ax-subtle/30 overflow-hidden">
          <div
            className="h-full bg-ax-cyan rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="flex items-center gap-2 p-2 rounded-lg bg-ax-surface border border-ax-border">
          <CheckCircle2 size={11} className="text-ax-green shrink-0" />
          <div>
            <p className="text-[10px] text-ax-dim">Done</p>
            <p className="text-sm font-bold text-ax-heading font-mono leading-tight">{sprint.pointsDone ?? done}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-ax-surface border border-ax-border">
          <Clock size={11} className="text-ax-amber shrink-0" />
          <div>
            <p className="text-[10px] text-ax-dim">Kalan</p>
            <p className="text-sm font-bold text-ax-heading font-mono leading-tight">{sprint.pointsPending ?? (total - done)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 p-2 rounded-lg bg-ax-surface border border-ax-border">
          <XCircle size={11} className="text-ax-dim shrink-0" />
          <div>
            <p className="text-[10px] text-ax-dim">Blokaj</p>
            <p className="text-sm font-bold text-ax-heading font-mono leading-tight">{sprint.pointsBlocked ?? 0}</p>
          </div>
        </div>
      </div>
    </div>
  )
}
