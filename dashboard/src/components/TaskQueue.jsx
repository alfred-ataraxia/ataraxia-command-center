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
    onDelete(task.id, true)
  }

  function handleDeleteCancel(e) {
    e.preventDefault()
    e.stopPropagation()
    setConfirmingDelete(false)
  }

  return (
    <div className={`group rounded-2xl border transition-all duration-300 overflow-hidden ${
      expanded 
        ? 'bg-ax-muted border-ax-border shadow-[0_8px_30px_rgba(0,0,0,0.5)]' 
        : 'bg-ax-muted border-ax-border hover:border-ax-border hover:bg-ax-muted/60'
    }`}>
      {/* Header - always visible */}
      <div 
        className="flex items-center gap-4 p-4 cursor-pointer relative"
        onClick={() => setExpanded(!expanded)}
      >
        <div className={`p-2 rounded-xl transition-all duration-300 ${status.bg} shadow-inner group-hover:scale-110`}>
          <StatusIcon size={16} className={`${status.iconClass}`} />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="font-mono text-[10px] text-ax-dim uppercase tracking-widest">{task.id}</span>
            <span className={`px-2 py-0.5 rounded-md border text-[11px] font-black ${priority.class}`}>
              {priority.label}
            </span>
            <span className="px-2 py-0.5 rounded-md border border-ax-border bg-ax-surface text-[11px] font-mono text-ax-subtle">
              {task.assignee || 'Alfred'}
            </span>
            {getDeadlineStatus(task.due, task.status) === 'overdue' && (
              <span className="px-2 py-0.5 rounded-md border text-[11px] font-black bg-ax-red/10 border-ax-red/30 text-ax-red">
                ⚠️ Gecikti
              </span>
            )}
            {getDeadlineStatus(task.due, task.status) === 'today' && (
              <span className="px-2 py-0.5 rounded-md border text-[11px] font-black bg-ax-amber/10 border-ax-amber/30 text-ax-amber">
                🟡 Bugün
              </span>
            )}
          </div>
          <p className={`text-sm font-medium transition-colors ${task.status === 'done' ? 'line-through text-ax-dim' : 'text-ax-text group-hover:text-ax-heading'}`}>
            {task.title}
          </p>
        </div>

        <button
          onClick={handleToggle}
          disabled={updating}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest shrink-0 transition-all duration-300 ${flow.btnClass} disabled:opacity-40 hover:-translate-y-0.5`}
        >
          <RefreshCw size={12} className={updating ? 'animate-spin' : ''} />
          {flow.label}
        </button>

        <div className="pl-2">
          {expanded ? <ChevronUp size={16} className="text-ax-dim" /> : <ChevronDown size={16} className="text-ax-dim group-hover:text-ax-accent transition-colors" />}
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="px-5 pb-5 pt-1 space-y-4">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          
          {task.description && (
            <p className="text-xs text-ax-dim leading-relaxed font-mono bg-ax-surface p-3 rounded-xl border border-ax-border">{task.description}</p>
          )}
          
          <div className="flex items-center gap-2 flex-wrap">
            {task.tags.map(tag => (
              <span key={tag} className="px-2.5 py-1 rounded-lg bg-ax-muted border border-ax-border text-[10px] text-ax-dim font-mono hover:text-ax-heading transition-colors cursor-default">
                #{tag}
              </span>
            ))}
            {task.due && (
              <span className="px-2.5 py-1 rounded-lg bg-ax-muted border border-ax-border text-[10px] text-ax-dim font-mono flex items-center gap-1.5">
                <Clock size={10} className="text-ax-cyan" /> {task.due}
              </span>
            )}
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-[10px] text-ax-subtle font-mono">
              Oluşturuldu: {task.created_at ? new Date(task.created_at).toLocaleDateString('tr-TR') : '—'}
            </span>
            {confirmingDelete ? (
              <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-1.5 rounded-lg text-[10px] font-black bg-ax-red text-white hover:bg-ax-red/80 transition-colors"
                >
                  Sil
                </button>
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-1.5 rounded-lg text-[10px] font-bold text-ax-text bg-ax-muted/60 hover:bg-ax-muted transition-colors"
                >
                  İptal
                </button>
              </div>
            ) : (
              <button
                onClick={handleDeleteClick}
                className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-ax-dim hover:text-ax-red hover:bg-ax-red/10 transition-colors"
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
        className="w-full group relative flex items-center justify-center gap-2 px-4 py-4 rounded-xl ax-glass border border-ax-accent/20 text-ax-accent text-sm font-bold uppercase tracking-widest hover:border-ax-accent/50 transition-all duration-300 overflow-hidden"
      >
        <div className="absolute inset-0 bg-ax-accent/5 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
        <Plus size={16} className="relative z-10 group-hover:scale-125 transition-transform duration-300" />
        <span className="relative z-10">Yeni Görev Ekle</span>
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl ax-glass border border-ax-accent/30 p-6 space-y-4 relative overflow-hidden">
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-xl bg-ax-accent/10">
            <Plus size={14} className="text-ax-accent" />
          </div>
          <h3 className="text-ax-heading text-sm font-black uppercase tracking-widest">Yeni Görev</h3>
        </div>
        <button type="button" onClick={() => setOpen(false)} className="p-2 rounded-xl bg-ax-surface hover:bg-ax-muted/60 text-ax-dim transition-colors">
          <X size={14} />
        </button>
      </div>
      
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Görev başlığı..."
        className="relative z-10 w-full px-4 py-3 rounded-xl bg-ax-muted border border-ax-border text-ax-text text-sm font-medium placeholder:text-ax-dim focus:outline-none focus:border-ax-accent/50 focus:bg-ax-surface transition-colors shadow-inner"
        autoFocus
      />
      
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Açıklama (opsiyonel)"
        rows={2}
        className="relative z-10 w-full px-4 py-3 rounded-xl bg-ax-muted border border-ax-border text-ax-text text-sm font-mono placeholder:text-ax-dim focus:outline-none focus:border-ax-accent/50 focus:bg-ax-surface transition-colors shadow-inner resize-none"
      />
      
      <div className="flex items-center gap-3 flex-wrap relative z-10">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-ax-muted border border-ax-border text-ax-text text-sm font-medium focus:outline-none focus:border-ax-accent/50 hover:bg-ax-muted transition-colors cursor-pointer"
        >
          <option value="high">🔴 Yüksek</option>
          <option value="medium">🟡 Orta</option>
          <option value="low">⚪ Düşük</option>
        </select>

        <input
          type="date"
          value={due}
          onChange={e => setDue(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-ax-muted border border-ax-border text-ax-text text-sm font-mono focus:outline-none focus:border-ax-accent/50 hover:bg-ax-muted transition-colors cursor-pointer"
        />

        <select
          value={assignee}
          onChange={e => setAssignee(e.target.value)}
          className="px-4 py-2.5 rounded-xl bg-ax-muted border border-ax-border text-ax-text text-sm font-medium focus:outline-none focus:border-ax-accent/50 hover:bg-ax-muted transition-colors cursor-pointer"
        >
          <option value="Alfred">🦊 Alfred</option>
          <option value="Codex">⚡ Codex</option>
          <option value="Claude">🤖 Claude</option>
          <option value="Gemini">✨ Gemini</option>
          <option value="MAIT">🏠 MAIT</option>
          <option value="MERCER">💰 MERCER</option>
          <option value="Master Sefa">👤 Master Sefa</option>
        </select>

        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-ax-accent text-ax-bg text-sm font-semibold disabled:opacity-40 hover:bg-ax-accent2 transition-colors"
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
    <div className="space-y-4">
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="group flex items-center gap-4 w-full p-4 rounded-2xl ax-glass border border-ax-border hover:border-ax-border hover:bg-ax-muted transition-all duration-300"
      >
        <div className={`p-2 rounded-xl ${config.bg} group-hover:scale-110 transition-transform duration-300`}>
          <StatusIcon size={16} className={`${config.iconClass}`} />
        </div>
        <span className="text-sm font-black uppercase tracking-widest text-ax-heading flex-1 text-left">{config.label}</span>
        <span className={`px-3 py-1 rounded-lg border text-xs font-black ${config.badgeClass}`}>
          {tasks.length}
        </span>
        <div className="pl-2">
          {collapsed ? <ChevronDown size={18} className="text-ax-subtle group-hover:text-ax-text transition-colors" /> : <ChevronUp size={18} className="text-ax-subtle group-hover:text-ax-text transition-colors" />}
        </div>
      </button>

      {!collapsed && (
        <div className="space-y-3 pl-2">
          {tasks.map(task => (
            <TaskCard key={task.id} task={task} onToggle={onToggle} onDelete={onDelete} />
          ))}
          {tasks.length === 0 && (
            <div className="flex flex-col items-center justify-center py-8 rounded-2xl border border-ax-border bg-ax-surface border-dashed">
              <p className="text-xs text-ax-subtle font-mono uppercase tracking-widest">— Boş —</p>
            </div>
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
  const [assigneeFilter, setAssigneeFilter] = useState('')

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
    if (assigneeFilter && t.assignee !== assigneeFilter) return false
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
    <div className="p-6 space-y-6 max-w-4xl mx-auto relative">
      {/* Background ambient glow */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-ax-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="mb-8 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase text-ax-accent mb-2">İş Kuyruğu</p>
          <h1 className="text-2xl font-bold text-ax-heading tracking-tight">Görevler</h1>
        </div>
        <div className="flex items-center gap-4 bg-ax-surface px-5 py-2.5 rounded-2xl border border-ax-border">
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-ax-dim tracking-widest mb-0.5">Aktif</span>
            <span className="text-lg font-black font-mono text-ax-amber">{stats.active}</span>
          </div>
          <div className="w-px h-8 bg-ax-muted/60" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-ax-dim tracking-widest mb-0.5">Tamam</span>
            <span className="text-lg font-black font-mono text-ax-green">{stats.done}</span>
          </div>
          <div className="w-px h-8 bg-ax-muted/60" />
          <div className="flex flex-col items-center">
            <span className="text-[10px] uppercase font-bold text-ax-dim tracking-widest mb-0.5">Toplam</span>
            <span className="text-lg font-black font-mono text-ax-heading">{stats.total}</span>
          </div>
        </div>
      </div>

      {/* Add Task */}
      <div className="relative z-10">
        <AddTaskForm onAdded={loadTasks} />
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 relative z-10">
        <div className="flex-1 flex items-center gap-3 px-4 py-3 rounded-2xl ax-glass border border-ax-border focus-within:border-ax-accent/50 transition-all duration-300 group">
          <Search size={16} className="text-ax-subtle group-focus-within:text-ax-accent transition-colors" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Görev ara..."
            className="flex-1 bg-transparent text-ax-text text-sm font-medium placeholder:text-ax-dim focus:outline-none"
          />
          {search && (
            <button onClick={() => setSearch('')} className="p-1 hover:bg-ax-muted/60 rounded-lg transition-colors">
              <X size={14} className="text-ax-dim hover:text-ax-heading" />
            </button>
          )}
        </div>
        
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-4 py-3 rounded-2xl ax-glass border border-ax-border text-ax-text text-sm font-medium focus:outline-none hover:bg-ax-muted transition-colors cursor-pointer"
        >
          <option value="">Tüm öncelik</option>
          <option value="high">🔴 Yüksek</option>
          <option value="medium">🟡 Orta</option>
          <option value="low">⚪ Düşük</option>
        </select>

        <select
          value={assigneeFilter}
          onChange={e => setAssigneeFilter(e.target.value)}
          className="px-4 py-3 rounded-2xl ax-glass border border-ax-border text-ax-text text-sm font-medium focus:outline-none hover:bg-ax-muted transition-colors cursor-pointer"
        >
          <option value="">Tüm ajan</option>
          <option value="Alfred">🦊 Alfred</option>
          <option value="Codex">⚡ Codex</option>
          <option value="Claude">🤖 Claude</option>
          <option value="Gemini">✨ Gemini</option>
          <option value="MAIT">🏠 MAIT</option>
          <option value="MERCER">💰 MERCER</option>
          <option value="Master Sefa">👤 Master Sefa</option>
        </select>

        <button
          onClick={() => setHideDone(!hideDone)}
          className={`px-5 py-3 rounded-2xl border text-xs font-black uppercase tracking-widest transition-all duration-300 ${
            hideDone
              ? 'bg-ax-accent/15 border-ax-accent/30 text-ax-accent'
              : 'ax-glass border-ax-border text-ax-dim hover:text-ax-text'
          }`}
        >
          {hideDone ? 'Tamamlananlar Gizli' : 'Tamamlananlar Görünür'}
        </button>
      </div>

      {/* Task Sections */}
      {loading ? (
        <div className="flex items-center justify-center py-24 relative z-10">
          <div className="flex flex-col items-center gap-4 text-ax-dim">
            <div className="relative w-12 h-12">
              <div className="absolute inset-0 border-2 border-ax-accent/20 rounded-full" />
              <div className="absolute inset-0 border-2 border-ax-accent border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-sm tracking-widest uppercase font-bold text-ax-accent">Görevler Yükleniyor</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6 relative z-10 pt-4">
          <StatusSection status="in_progress" tasks={inProgress} onToggle={loadTasks} onDelete={handleDelete} />
          <StatusSection status="pending" tasks={pending} onToggle={loadTasks} onDelete={handleDelete} />
          
          {!hideDone && (
            <StatusSection status="done" tasks={done} onToggle={loadTasks} onDelete={handleDelete} />
          )}
        </div>
      )}

      {/* Bottom info */}
      <div className="text-center py-8 text-[10px] text-ax-dim uppercase tracking-widest font-bold relative z-10 flex items-center justify-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-ax-amber animate-pulse" />
        Alfred her 30 dakikada bir pending görev alır 🦊
      </div>
    </div>
  )
}