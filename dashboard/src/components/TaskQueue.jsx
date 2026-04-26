import { useState, useEffect, useCallback } from 'react'
import {
  CheckCircle2,
  Circle,
  AlertCircle,
  Clock,
  Plus,
  X,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import { getTasks, addTask, updateTask } from '../services/haService'
import { useToast } from './useToast'

// Status config
const STATUS_CONFIG = {
  in_progress: { icon: AlertCircle, label: 'Devam Ediyor', iconClass: 'text-ax-amber', bg: 'bg-ax-amber/10', badgeClass: 'border-ax-amber/30 text-ax-amber' },
  pending:     { icon: Circle,      label: 'Bekliyor',     iconClass: 'text-ax-dim',   bg: 'bg-ax-muted',    badgeClass: 'border-ax-border text-ax-dim' },
  done:        { icon: CheckCircle2, label: 'Tamamlandı',  iconClass: 'text-ax-green', bg: 'bg-ax-green/10', badgeClass: 'border-ax-green/30 text-ax-green' },
}

const PRIORITY_CONFIG = {
  high:   { label: 'Yüksek', class: 'text-ax-red   bg-ax-red/10   border-ax-red/20' },
  medium: { label: 'Orta',   class: 'text-ax-amber bg-ax-amber/10 border-ax-amber/20' },
  low:    { label: 'Düşük',  class: 'text-ax-dim   bg-ax-muted    border-ax-border' },
}

const STATUS_FLOW = {
  pending:     { next: 'in_progress', label: 'Başlat',  btnClass: 'bg-ax-amber/15 border-ax-amber/30 text-ax-amber' },
  in_progress: { next: 'done',        label: 'Tamamla', btnClass: 'bg-ax-green/15 border-ax-green/30 text-ax-green' },
  done:        { next: 'pending',     label: 'Geri',    btnClass: 'bg-ax-dim/15 border-ax-border text-ax-dim' },
}

function getDeadlineStatus(dueDate, status) {
  if (!dueDate || dueDate === '—' || status === 'done') return null
  const today = new Date(); today.setHours(0,0,0,0)
  const due = new Date(dueDate); due.setHours(0,0,0,0)
  const diffDays = Math.round((due - today) / 86400000)
  if (diffDays < 0) return 'overdue'
  if (diffDays === 0) return 'today'
  return null
}

function normalizeTask(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description || '',
    status: t.status === 'in_progress' ? 'in_progress' : t.status || 'pending',
    priority: t.priority || 'medium',
    tags: t.tags || [],
    due: t.due || '',
    created_at: t.created_at || '',
  }
}

// Single task card
function TaskCard({ task, onToggle, onDelete }) {
  const [updating, setUpdating] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const { addToast } = useToast()
  
  const status = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium
  const StatusIcon = status.icon
  const flow = STATUS_FLOW[task.status] || STATUS_FLOW.pending

  async function handleToggle(e) {
    e.stopPropagation()
    setUpdating(true)
    try {
      await updateTask(task.id, { status: flow.next })
      const label = STATUS_CONFIG[flow.next]?.label || flow.next
      addToast(`${task.title.slice(0, 30)} → ${label}`, 'success')
      onToggle()
    } catch (err) {
      addToast(`Hata: ${err.message}`, 'error')
    }
    setUpdating(false)
  }

  function handleDeleteClick(e) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmingDelete(true)
  }

  function handleDeleteConfirm(e) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmingDelete(false)
    // Parent's handleDelete shows toast + calls loadTasks
    // skipConfirm=true → inline UI zaten onayladı, confirm() dialogunu atlama
    onDelete(task.id, true)
  }

  function handleDeleteCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmingDelete(false)
  }

  return (
    <div className="bg-ax-panel border border-ax-border rounded-xl overflow-hidden">
      {/* Header - always visible */}
      <div 
        className="flex items-center gap-3 p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <StatusIcon size={18} className={status.iconClass} />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] text-ax-subtle">{task.id}</span>
            <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${priority.class}`}>
              {priority.label}
            </span>
            {getDeadlineStatus(task.due, task.status) === 'overdue' && (
              <span className="px-1.5 py-0.5 rounded border text-[10px] font-medium bg-ax-red/10 border-ax-red/30 text-ax-red">
                ⚠️ Gecikti
              </span>
            )}
            {getDeadlineStatus(task.due, task.status) === 'today' && (
              <span className="px-1.5 py-0.5 rounded border text-[10px] font-medium bg-ax-amber/10 border-ax-amber/30 text-ax-amber">
                🟡 Bugün
              </span>
            )}
          </div>
          <p className={`text-sm font-medium mt-0.5 ${task.status === 'done' ? 'line-through text-ax-dim' : 'text-ax-heading'}`}>
            {task.title}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={updating}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium shrink-0 transition-colors ${flow.btnClass} disabled:opacity-40`}
        >
          <RefreshCw size={10} className={updating ? 'animate-spin' : ''} />
          {flow.label}
        </button>

        {expanded ? <ChevronUp size={16} className="text-ax-subtle" /> : <ChevronDown size={16} className="text-ax-subtle" />}
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t border-ax-border/50">
          {task.description && (
            <p className="text-xs text-ax-dim leading-relaxed pt-3">{task.description}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap pt-2">
            {task.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-md bg-ax-muted border border-ax-border text-[10px] text-ax-subtle">
                {tag}
              </span>
            ))}
            {task.due && (
              <span className="text-[10px] text-ax-dim">📅 {task.due}</span>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-ax-subtle">
              Oluşturuldu: {task.created_at ? new Date(task.created_at).toLocaleDateString('tr-TR') : '—'}
            </span>
            {confirmingDelete ? (
              <div className="flex items-center gap-1.5" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-2 py-1 rounded text-[10px] bg-ax-red/20 text-ax-red hover:bg-ax-red/30 transition-colors font-medium"
                >
                  Sil
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="px-2 py-1 rounded text-[10px] text-ax-dim hover:bg-ax-muted transition-colors"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick}
                className="px-2 py-1 rounded text-[10px] text-ax-red hover:bg-ax-red/10 transition-colors"
              >
                Sil
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Add task form
function AddTaskForm({ onAdded }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [due, setDue] = useState('')
  const [assignee, setAssignee] = useState('Alfred')
  const [saving, setSaving] = useState(false)
  const { addToast } = useToast()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        due,
        status: 'pending',
        tags: [],
        assignee,
      })
      addToast(`'${title.trim()}' eklendi`, 'success')
      setTitle('')
      setDescription('')
      setPriority('medium')
      setDue('')
      setAssignee('Alfred')
      setOpen(false)
      onAdded()
    } catch (err) {
      addToast(`Hata: ${err.message}`, 'error')
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-ax-accent/15 border border-ax-accent/30 text-ax-accent text-sm font-medium hover:bg-ax-accent/25 transition-colors"
      >
        <Plus size={16} />
        Yeni Görev Ekle
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-ax-panel border border-ax-accent/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-ax-heading text-sm font-semibold">Yeni Görev</h3>
        <button type="button" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-ax-muted text-ax-dim">
          <X size={14} />
        </button>
      </div>
      
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Görev başlığı..."
        className="w-full px-3 py-2.5 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm placeholder:text-ax-subtle focus:outline-none focus:border-ax-accent/50"
        autoFocus
      />
      
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Açıklama (opsiyonel)"
        rows={2}
        className="w-full px-3 py-2.5 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm placeholder:text-ax-subtle focus:outline-none focus:border-ax-accent/50 resize-none"
      />
      
      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="px-3 py-2 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm focus:outline-none"
        >
          <option value="high">🔴 Yüksek</option>
          <option value="medium">🟡 Orta</option>
          <option value="low">⚪ Düşük</option>
        </select>

        <input
          type="date"
          value={due}
          onChange={e => setDue(e.target.value)}
          className="px-3 py-2 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm focus:outline-none"
        />

        <select
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
          className="px-3 py-2 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm focus:outline-none"
        >
          <option value="Alfred">🦊 Alfred</option>
          <option value="Master Sefa">👤 Master Sefa</option>
          <option value="Claude">🤖 Claude</option>
          <option value="Gemini">✨ Gemini</option>
        </select>

        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-ax-accent text-white text-sm font-medium disabled:opacity-40 hover:bg-ax-accent/80 transition-colors"
        >
          {saving ? 'Kaydediliyor...' : 'Ekle'}
        </button>
      </div>
    </form>
  )
}

// Status section with collapsible tasks
function StatusSection({ status, tasks, onToggle, onDelete }) {
  const [collapsed, setCollapsed] = useState(false)
  const config = STATUS_CONFIG[status]
  const StatusIcon = config.icon

  return (
    <div className="space-y-3">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center gap-3 w-full p-3 rounded-xl bg-ax-surface border border-ax-border hover:bg-ax-muted/30 transition-colors"
      >
        <StatusIcon size={18} className={config.iconClass} />
        <span className="text-sm font-semibold text-ax-heading flex-1 text-left">{config.label}</span>
        <span className={`px-2 py-0.5 rounded-full border text-xs font-bold ${config.badgeClass}`}>
          {tasks.length}
        </span>
        {collapsed ? <ChevronDown size={16} className="text-ax-subtle" /> : <ChevronUp size={16} className="text-ax-subtle" />}
      </button>

      {!collapsed && (
        <div className="space-y-2 pl-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
          ))}
          {tasks.length === 0 && (
            <p className="text-xs text-ax-subtle italic py-4 text-center">—</p>
          )}
        </div>
      )}
    </div>
  )
}

// Main component
export default function TaskQueue() {
  const { addToast } = useToast()
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hideDone, setHideDone] = useState(true)
  const [priorityFilter, setPriorityFilter] = useState('')

  const loadTasks = useCallback(async () => {
    try {
      const raw = await getTasks()
      setTasks(raw.map(normalizeTask))
    } catch (err) {
      addToast(`Görevler yüklenemedi: ${err.message}`, 'error')
    } finally {
      setLoading(false)
    }
  }, [addToast])

  useEffect(() => {
    loadTasks()
    const interval = setInterval(loadTasks, 60_000)
    return () => clearInterval(interval)
  }, [loadTasks])

  async function handleDelete(taskId, skipConfirm = false) {
    if (!skipConfirm && !confirm('Bu görevi sil?')) return
    try {
      await updateTask(taskId, { status: 'deleted' })
      addToast('Görev silindi', 'success')
      loadTasks()
    } catch (err) {
      addToast(`Silinemedi: ${err.message}`, 'error')
    }
  }

  // Filter tasks
  const filtered = tasks.filter(t => {
    if (t.status === 'deleted') return false
    if (hideDone && t.status === 'done') return false
    if (search) {
      const q = search.toLowerCase()
      if (!t.title.toLowerCase().includes(q) && !t.id.toLowerCase().includes(q)) return false
    }
    if (priorityFilter && t.priority !== priorityFilter) return false
    return true
  })

  const inProgress = filtered.filter(t => t.status === 'in_progress')
  const pending = filtered.filter(t => t.status === 'pending')
  const done = filtered.filter(t => t.status === 'done')

  const stats = {
    active: inProgress.length + pending.length,
    done: done.length,
    total: tasks.filter(t => t.status !== 'deleted').length,
  }

  return (
    <div className="p-4 space-y-4 max-w-3xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-ax-heading text-xl font-bold">Görevler</h1>
        <p className="text-ax-dim text-sm">
          {loading ? 'Yükleniyor...' : `${stats.active} aktif · ${stats.done} tamamlandı · ${stats.total} toplam`}
        </p>
      </div>

      {/* Add Task */}
      <AddTaskForm onAdded={loadTasks} />

      {/* Search + Filters */}
      <div className="flex items-center gap-2">
        <div className="flex-1 flex items-center gap-2 px-3 py-2 rounded-lg bg-ax-panel border border-ax-border">
          <Search size={14} className="text-ax-subtle" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Ara..."
            className="flex-1 bg-transparent text-ax-text text-sm placeholder:text-ax-subtle focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 hover:bg-ax-muted rounded">
              <X size={12} className="text-ax-dim" />
            </button>
          )}
        </div>
        
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-ax-panel border border-ax-border text-ax-text text-sm"
        >
          <option value="">Tüm öncelik</option>
          <option value="high">🔴 Yüksek</option>
          <option value="medium">🟡 Orta</option>
          <option value="low">⚪ Düşük</option>
        </select>

        <button
          onClick={() => setHideDone(!hideDone)}
          className={`px-3 py-2 rounded-lg border text-xs font-medium transition-colors ${
            hideDone
              ? 'bg-ax-accent/15 border-ax-accent/30 text-ax-accent'
              : 'bg-ax-panel border-ax-border text-ax-dim'
          }`}
        >
          {hideDone ? '✓ Tamamlananlar gizli' : 'Tamamlananlar görünür'}
        </button>


      </div>

      {/* Task Sections */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-ax-dim">
            <div className="w-5 h-5 border-2 border-ax-accent border-t-transparent rounded-full animate-spin" />
            <span>Yükleniyor...</span>
          </div>
        </div>
      ) : (
        <>
          <StatusSection status="in_progress" tasks={inProgress} onToggle={loadTasks} onDelete={handleDelete} />
          <StatusSection status="pending" tasks={pending} onToggle={loadTasks} onDelete={handleDelete} />
          
          {!hideDone && (
            <StatusSection status="done" tasks={done} onToggle={loadTasks} onDelete={handleDelete} />
          )}
        </>
      )}

      {/* Bottom info */}
      <div className="text-center py-4 text-[10px] text-ax-subtle">
        Alfred her 30 dakikada bir pending görev alır 🦊
      </div>
    </div>
  )
}