import { useState } from 'react'
import {
  X,
  AlertCircle,
  Circle,
  CheckCircle2,
  Tag,
  Calendar,
  Bot,
  Clock,
  MessageSquare,
  Send,
  ArrowRight,
  Cpu,
} from 'lucide-react'
import { addTaskNote, updateTask } from '../services/haService'

const AGENTS = ['Alfred', 'Lucius', 'Robin', 'Netrunner']
const MODELS = [
  { value: 'claude', label: 'Claude (Sonnet)' },
  { value: 'gemini', label: 'Gemini 2.5 Pro' },
]

const STATUS_CONFIG = {
  in_progress: { icon: AlertCircle, label: 'Devam Ediyor', color: 'text-ax-amber', bg: 'bg-ax-amber/10', border: 'border-ax-amber/20' },
  pending:     { icon: Circle,       label: 'Bekliyor',      color: 'text-ax-dim',   bg: 'bg-ax-muted',    border: 'border-ax-border'   },
  done:        { icon: CheckCircle2, label: 'Tamamlandı',    color: 'text-ax-green', bg: 'bg-ax-green/10', border: 'border-ax-green/20' },
}

const PRIORITY_CONFIG = {
  high:   { label: 'Yüksek', class: 'text-ax-red   bg-ax-red/10   border-ax-red/20'   },
  medium: { label: 'Orta',   class: 'text-ax-amber bg-ax-amber/10 border-ax-amber/20' },
  low:    { label: 'Düşük',  class: 'text-ax-dim   bg-ax-muted    border-ax-border'   },
}

function getDeadlineStatus(dueDate, status) {
  if (!dueDate || dueDate === '—') return null
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const due = new Date(dueDate)
  due.setHours(0, 0, 0, 0)

  if (status === 'done') return null

  const diffTime = due - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  return null
}

const STATUS_FLOW = {
  pending:     { next: 'in_progress', label: 'Başlat',     btnClass: 'bg-ax-amber/15 border-ax-amber/30 text-ax-amber hover:bg-ax-amber/25' },
  in_progress: { next: 'done',        label: 'Tamamla',    btnClass: 'bg-ax-green/15 border-ax-green/30 text-ax-green hover:bg-ax-green/25' },
  done:        { next: 'pending',     label: 'Yeniden Aç', btnClass: 'bg-ax-dim/15 border-ax-border text-ax-dim hover:bg-ax-dim/25' },
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function StatusBadge({ status }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending
  const Icon = cfg.icon
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${cfg.color} ${cfg.bg} ${cfg.border}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  )
}

function DeadlineBadge({ status, dueDate }) {
  const deadlineStatus = getDeadlineStatus(dueDate, status)
  if (!deadlineStatus) return null

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-medium ${
      deadlineStatus === 'overdue'
        ? 'text-ax-red bg-ax-red/10 border-ax-red/20'
        : 'text-ax-amber bg-ax-amber/10 border-ax-amber/20'
    }`}>
      {deadlineStatus === 'overdue' ? '⚠️ Süresi Geçti' : '🟡 Bugün Bitiyor'}
    </span>
  )
}

export default function TaskDetailModal({ task, onClose, onUpdated }) {
  const [noteText, setNoteText] = useState('')
  const [saving, setSaving] = useState(false)
  const [statusUpdating, setStatusUpdating] = useState(false)
  const [fieldSaving, setFieldSaving] = useState(null)

  // Local state for editable fields so UI doesn't snap back on save
  const [assignee, setAssignee] = useState(task.assignee || 'Alfred')
  const [preferredModel, setPreferredModel] = useState(task.preferred_model || 'claude')

  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.low
  const flow = STATUS_FLOW[task.status] ?? STATUS_FLOW.pending
  const notes = task.notes || []
  const history = task.status_history || []

  async function handleFieldChange(field, value, localSetter) {
    localSetter(value)
    setFieldSaving(field)
    try {
      await updateTask(task.id, { [field]: value })
      onUpdated()
    } catch {
      // revert on error
    }
    setFieldSaving(null)
  }

  async function handleAddNote(e) {
    e.preventDefault()
    if (!noteText.trim()) return
    setSaving(true)
    try {
      await addTaskNote(task.id, noteText.trim())
      setNoteText('')
      onUpdated()
    } catch {
      // silently fail
    }
    setSaving(false)
  }

  async function handleStatusChange() {
    setStatusUpdating(true)
    try {
      await updateTask(task.id, { status: flow.next })
      onUpdated(flow.next)
    } catch {
      // silently fail
    }
    setStatusUpdating(false)
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-2xl bg-ax-panel border border-ax-border shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-start gap-3 p-5 border-b border-ax-border shrink-0">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              <span className="font-mono text-[10px] text-ax-subtle">{task.id}</span>
              <StatusBadge status={task.status} />
              <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${priority.class}`}>
                {priority.label}
              </span>
              <DeadlineBadge status={task.status} dueDate={task.due} />
            </div>
            <h2 className="text-ax-heading text-base font-semibold leading-snug">{task.title}</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-ax-muted text-ax-dim transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* Meta */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className={`flex items-center gap-1.5 ${
              getDeadlineStatus(task.due, task.status) === 'overdue' ? 'text-ax-red font-medium' :
              getDeadlineStatus(task.due, task.status) === 'today' ? 'text-ax-amber font-medium' :
              'text-ax-dim'
            }`}>
              <Calendar size={12} />
              Son: {task.due || '—'}
            </span>
            <span className="flex items-center gap-1.5 text-ax-dim"><Clock size={12} />Oluşturuldu: {formatDate(task.created_at)}</span>
          </div>

          {/* Otomasyon Ayarları */}
          <div className="rounded-xl bg-ax-surface border border-ax-border p-4 space-y-3">
            <h3 className="text-ax-dim text-[10px] font-semibold uppercase tracking-wider">Otomasyon Ayarları</h3>

            {/* Ajan */}
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-ax-dim text-xs shrink-0">
                <Bot size={12} /> Ajan
              </label>
              <select
                value={assignee}
                disabled={fieldSaving === 'assignee'}
                onChange={e => handleFieldChange('assignee', e.target.value, setAssignee)}
                className="flex-1 max-w-[160px] px-2 py-1 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-xs focus:outline-none focus:border-ax-accent/50 disabled:opacity-50"
              >
                {AGENTS.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>

            {/* Model */}
            <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-1.5 text-ax-dim text-xs shrink-0">
                <Cpu size={12} /> Model
              </label>
              <select
                value={preferredModel}
                disabled={fieldSaving === 'preferred_model'}
                onChange={e => handleFieldChange('preferred_model', e.target.value, setPreferredModel)}
                className="flex-1 max-w-[160px] px-2 py-1 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-xs focus:outline-none focus:border-ax-accent/50 disabled:opacity-50"
              >
                {MODELS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>


          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {task.tags.map(tag => (
                <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-ax-muted border border-ax-border text-[10px] text-ax-subtle">
                  <Tag size={9} />{tag}
                </span>
              ))}
            </div>
          )}

          {/* Description */}
          {task.description && (
            <div className="rounded-xl bg-ax-surface border border-ax-border p-4">
              <h3 className="text-ax-dim text-[10px] font-semibold uppercase tracking-wider mb-2">Açıklama</h3>
              <p className="text-ax-text text-sm leading-relaxed">{task.description}</p>
            </div>
          )}

          {/* Status History */}
          {history.length > 0 && (
            <div>
              <h3 className="text-ax-dim text-[10px] font-semibold uppercase tracking-wider mb-2">Statü Geçmişi</h3>
              <div className="space-y-1.5">
                {history.map((h, i) => {
                  const fromCfg = STATUS_CONFIG[h.from] ?? STATUS_CONFIG.pending
                  const toCfg   = STATUS_CONFIG[h.to]   ?? STATUS_CONFIG.pending
                  return (
                    <div key={i} className="flex items-center gap-2 text-xs text-ax-dim">
                      <span className={`font-medium ${fromCfg.color}`}>{fromCfg.label}</span>
                      <ArrowRight size={10} className="shrink-0" />
                      <span className={`font-medium ${toCfg.color}`}>{toCfg.label}</span>
                      <span className="text-ax-subtle ml-auto">{formatDate(h.at)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <h3 className="text-ax-dim text-[10px] font-semibold uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MessageSquare size={11} />
              İlerleme Notları ({notes.length})
            </h3>
            {notes.length === 0 ? (
              <p className="text-ax-subtle text-xs italic">Henüz not eklenmemiş.</p>
            ) : (
              <div className="space-y-2">
                {notes.map(note => (
                  <div key={note.id} className="rounded-lg bg-ax-surface border border-ax-border px-3.5 py-2.5">
                    <p className="text-ax-text text-sm leading-relaxed">{note.text}</p>
                    <p className="text-ax-subtle text-[10px] mt-1">{formatDate(note.at)}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Add Note Form */}
          <form onSubmit={handleAddNote} className="flex gap-2">
            <input
              type="text"
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder="Not ekle..."
              className="flex-1 px-3 py-2 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm placeholder:text-ax-subtle focus:outline-none focus:border-ax-accent/50"
            />
            <button
              type="submit"
              disabled={!noteText.trim() || saving}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-ax-accent/15 border border-ax-accent/30 text-ax-accent text-sm font-medium hover:bg-ax-accent/25 transition-colors disabled:opacity-40"
            >
              <Send size={13} />
              {saving ? '...' : 'Ekle'}
            </button>
          </form>
        </div>

        {/* Footer: status action */}
        <div className="shrink-0 px-5 py-3 border-t border-ax-border flex justify-end">
          <button
            onClick={handleStatusChange}
            disabled={statusUpdating}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${flow.btnClass} disabled:opacity-40`}
          >
            {statusUpdating ? '...' : flow.label}
          </button>
        </div>
      </div>
    </div>
  )
}
