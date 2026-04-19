import { Flag, Calendar, CheckCircle2, PauseCircle, Clock } from 'lucide-react'

export default function SprintStatus({ sprint }) {
  if (!sprint) return null

  const total = Number(sprint.total || 0)
  const done = Number(sprint.done || 0)
  const deferred = Number(sprint.deferred || 0)
  const pending = Number(sprint.pending || 0)
  const pct = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
      <div className="flex items-center gap-2 mb-4">
        <Flag size={16} className="text-ax-accent" />
        <h2 className="text-ax-heading text-sm font-bold">{sprint.sprintName || 'Sprint'}</h2>
        {sprint.endDate && (
          <span className="ml-auto flex items-center gap-1.5 text-[10px] text-ax-dim font-mono">
            <Calendar size={11} className="text-ax-subtle" /> {sprint.endDate}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-ax-dim">İlerleme</span>
        <span className="text-ax-heading font-mono font-bold">%{pct}</span>
      </div>
      <div className="h-2 rounded-full bg-ax-muted overflow-hidden">
        <div className="h-full bg-ax-accent rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="bg-ax-surface border border-ax-border rounded-xl p-3 flex items-center gap-2">
          <CheckCircle2 size={14} className="text-ax-green" />
          <div>
            <p className="text-ax-heading font-bold">{done}</p>
            <p className="text-[10px] text-ax-dim">Done</p>
          </div>
        </div>
        <div className="bg-ax-surface border border-ax-border rounded-xl p-3 flex items-center gap-2">
          <Clock size={14} className="text-ax-amber" />
          <div>
            <p className="text-ax-heading font-bold">{pending}</p>
            <p className="text-[10px] text-ax-dim">Bekliyor</p>
          </div>
        </div>
        <div className="bg-ax-surface border border-ax-border rounded-xl p-3 flex items-center gap-2">
          <PauseCircle size={14} className="text-ax-dim" />
          <div>
            <p className="text-ax-heading font-bold">{deferred}</p>
            <p className="text-[10px] text-ax-dim">Ertelendi</p>
          </div>
        </div>
      </div>
    </div>
  )
}

