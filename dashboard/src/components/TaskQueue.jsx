import { useState, useEffect, useRef } from 'react'
import {
  ListTodo,
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Bot,
  Tag,
  Calendar,
  RefreshCw,
  Plus,
  X,
  Send,
  GripVertical,
  Filter,
  Search,
  Archive,
  Eye,
  EyeOff,
} from 'lucide-react'
import { getTasks, addTask, updateTask } from '../services/haService'
import TaskDetailModal from './TaskDetailModal'

const STATUS_MAP = {
  in_progress: 'in_progress',
  'In Progress': 'in_progress',
  pending: 'pending',
  done: 'done',
}

const STATUS_CONFIG = {
  in_progress: {
    icon: AlertCircle,
    label: 'Devam Ediyor',
    iconClass: 'text-ax-amber',
  },
  pending: {
    icon: Circle,
    label: 'Bekliyor',
    iconClass: 'text-ax-dim',
  },
  done: {
    icon: CheckCircle2,
    label: 'Tamamlandı',
    iconClass: 'text-ax-green',
  },
}

const PRIORITY_CONFIG = {
  high:   { label: 'Yüksek', class: 'text-ax-red   bg-ax-red/10   border-ax-red/20' },
  medium: { label: 'Orta',   class: 'text-ax-amber bg-ax-amber/10 border-ax-amber/20' },
  low:    { label: 'Düşük',  class: 'text-ax-dim   bg-ax-muted    border-ax-border' },
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

function normalizeTask(t) {
  return {
    id: t.id,
    title: t.title,
    description: t.description || '',
    status: STATUS_MAP[t.status] || 'pending',
    priority: t.priority || 'medium',
    agent: t.assignee || t.agent || '—',
    tags: t.tags || [],
    due: t.due || '—',
    created_at: t.created_at || '',
    notes: t.notes || [],
    status_history: t.status_history || [],
  }
}

const STATUS_FLOW = {
  pending:     { next: 'in_progress', label: 'Başlat',     btnClass: 'bg-ax-amber/15 border-ax-amber/30 text-ax-amber hover:bg-ax-amber/25' },
  in_progress: { next: 'done',        label: 'Tamamla',    btnClass: 'bg-ax-green/15 border-ax-green/30 text-ax-green hover:bg-ax-green/25' },
  done:        { next: 'pending',     label: 'Yeniden Aç', btnClass: 'bg-ax-dim/15 border-ax-border text-ax-dim hover:bg-ax-dim/25' },
}

function TaskRow({ task, onStatusChange, onDragStart, dragging, onOpen }) {
  const [updating, setUpdating] = useState(false)
  const status   = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.pending
  const priority = PRIORITY_CONFIG[task.priority] ?? PRIORITY_CONFIG.low
  const StatusIcon = status.icon
  const flow = STATUS_FLOW[task.status] || STATUS_FLOW.pending
  const deadlineStatus = getDeadlineStatus(task.due, task.status)

  async function handleStatusChange(e) {
    e.stopPropagation()
    setUpdating(true)
    try {
      await updateTask(task.id, { status: flow.next })
      onStatusChange()
    } catch {
      // silently fail
    }
    setUpdating(false)
  }

  return (
    <div
      draggable
      onClick={() => onOpen(task)}
      onDragStart={e => {
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', task.id)
        onDragStart(task.id)
      }}
      className={[
        'group flex flex-col sm:flex-row items-start gap-3 sm:gap-4 p-4 rounded-xl border transition-all cursor-pointer select-none',
        dragging === task.id
          ? 'opacity-40 scale-[0.98]'
          : deadlineStatus === 'overdue'
            ? 'bg-ax-red/5 border-ax-red/40 hover:bg-ax-red/10'
            : deadlineStatus === 'today'
              ? 'bg-ax-amber/5 border-ax-amber/30 hover:bg-ax-amber/10'
              : task.status === 'done'
                ? 'bg-ax-surface border-ax-border opacity-60 hover:opacity-80'
                : 'bg-ax-panel border-ax-border hover:border-ax-muted',
      ].join(' ')}
    >
      <GripVertical size={14} className="text-ax-subtle mt-0.5 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
      <StatusIcon size={16} className={`${status.iconClass} mt-0.5 shrink-0`} />

      <div className="flex-1 min-w-0 space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-mono text-[10px] text-ax-subtle">{task.id}</span>
          <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-ax-dim' : 'text-ax-heading'}`}>
            {task.title}
          </p>
        </div>
        {task.description && (
          <p className="text-xs text-ax-dim leading-relaxed">{task.description}</p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {task.tags.length > 0 && task.tags.map(tag => (
            <span key={tag} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-ax-muted border border-ax-border text-[10px] text-ax-subtle">
              <Tag size={8} />
              {tag}
            </span>
          ))}
          <button
            onClick={handleStatusChange}
            disabled={updating}
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-medium transition-colors ${flow.btnClass} disabled:opacity-40`}
          >
            <RefreshCw size={8} className={updating ? 'animate-spin' : ''} />
            {updating ? '...' : flow.label}
          </button>
        </div>
      </div>

      <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${priority.class}`}>
          {priority.label}
        </span>
        <div className="flex items-center gap-1 text-ax-subtle text-[10px]">
          <Bot size={10} />
          <span>{task.agent}</span>
        </div>
        <div className="flex items-center gap-1">
          <Calendar size={10} className={
            deadlineStatus === 'overdue' ? 'text-ax-red' :
            deadlineStatus === 'today' ? 'text-ax-amber' :
            'text-ax-subtle'
          } />
          <span className={`text-[10px] ${
            deadlineStatus === 'overdue' ? 'text-ax-red font-medium' :
            deadlineStatus === 'today' ? 'text-ax-amber font-medium' :
            'text-ax-subtle'
          }`}>
            {task.due}
            {deadlineStatus === 'overdue' && ' ⚠️'}
            {deadlineStatus === 'today' && ' 🟡'}
          </span>
        </div>
      </div>
    </div>
  )
}

function DropZone({ status, label, icon: Icon, iconClass, badgeClass, count, children, onDrop, dragOver, onDragOver, onDragLeave }) {
  return (
    <section
      className="space-y-3"
      onDragOver={e => { e.preventDefault(); onDragOver(status) }}
      onDragLeave={onDragLeave}
      onDrop={e => {
        e.preventDefault()
        const id = e.dataTransfer.getData('text/plain')
        if (id) onDrop(id, status)
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={13} className={iconClass} />
        <h2 className="text-ax-text text-xs font-semibold uppercase tracking-wider">{label}</h2>
        <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${badgeClass}`}>{count}</span>
      </div>
      <div className={[
        'space-y-2 min-h-[56px] rounded-xl border-2 border-dashed transition-all p-1',
        dragOver === status
          ? 'border-ax-accent/60 bg-ax-accent/5'
          : 'border-transparent',
      ].join(' ')}>
        {children}
        {dragOver === status && count === 0 && (
          <div className="h-12 flex items-center justify-center text-ax-subtle text-xs">Buraya bırak</div>
        )}
      </div>
    </section>
  )
}

function AddTaskForm({ onAdded }) {
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('medium')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) return
    setSaving(true)
    try {
      await addTask({
        title: title.trim(),
        description: description.trim(),
        priority,
        status: 'pending',
        tags: [],
      })
      setTitle('')
      setDescription('')
      setPriority('medium')
      setOpen(false)
      onAdded()
    } catch {
      // silently fail
    }
    setSaving(false)
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-ax-accent/15 border border-ax-accent/30 text-ax-accent text-sm font-medium hover:bg-ax-accent/25 transition-colors"
      >
        <Plus size={14} />
        Yeni Görev
      </button>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl bg-ax-panel border border-ax-accent/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-ax-heading text-sm font-semibold">Yeni Görev Ekle</h3>
        <button type="button" onClick={() => setOpen(false)} className="p-1 rounded hover:bg-ax-muted text-ax-dim">
          <X size={14} />
        </button>
      </div>
      <input
        type="text"
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Görev başlığı..."
        className="w-full px-3 py-2 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm placeholder:text-ax-subtle focus:outline-none focus:border-ax-accent/50"
        autoFocus
      />
      <textarea
        value={description}
        onChange={e => setDescription(e.target.value)}
        placeholder="Açıklama (opsiyonel)"
        rows={2}
        className="w-full px-3 py-2 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm placeholder:text-ax-subtle focus:outline-none focus:border-ax-accent/50 resize-none"
      />
      <div className="flex items-center gap-3">
        <select
          value={priority}
          onChange={e => setPriority(e.target.value)}
          className="px-3 py-1.5 rounded-lg bg-ax-bg border border-ax-border text-ax-text text-sm focus:outline-none"
        >
          <option value="high">Yüksek</option>
          <option value="medium">Orta</option>
          <option value="low">Düşük</option>
        </select>
        <button
          type="submit"
          disabled={!title.trim() || saving}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-ax-accent text-white text-sm font-medium disabled:opacity-40 hover:bg-ax-accent/80 transition-colors"
        >
          <Send size={12} />
          {saving ? 'Kaydediliyor...' : 'Ekle'}
        </button>
      </div>
    </form>
  )
}

function FilterPanel({ filters, onFilterChange, allTags, allAssignees }) {
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="space-y-3">
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ax-panel border border-ax-border text-ax-text text-sm hover:bg-ax-muted transition-colors"
      >
        <Filter size={14} />
        Filtreler
      </button>

      {showFilters && (
        <div className="rounded-lg bg-ax-panel border border-ax-border p-4 space-y-4">
          {/* Priority Filter */}
          <div className="space-y-2">
            <p className="text-ax-text text-xs font-semibold uppercase">Öncelik</p>
            <div className="flex flex-wrap gap-2">
              {['high', 'medium', 'low'].map(p => (
                <button
                  key={p}
                  onClick={() => {
                    const current = filters.priority || []
                    onFilterChange('priority', current.includes(p)
                      ? current.filter(x => x !== p)
                      : [...current, p]
                    )
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                    (filters.priority || []).includes(p)
                      ? 'bg-ax-accent text-white border-ax-accent'
                      : 'bg-ax-bg border-ax-border text-ax-text hover:bg-ax-muted'
                  }`}
                >
                  {p === 'high' ? 'Yüksek' : p === 'medium' ? 'Orta' : 'Düşük'}
                </button>
              ))}
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="space-y-2">
              <p className="text-ax-text text-xs font-semibold uppercase">Etiketler</p>
              <div className="flex flex-wrap gap-2">
                {allTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => {
                      const current = filters.tags || []
                      onFilterChange('tags', current.includes(tag)
                        ? current.filter(x => x !== tag)
                        : [...current, tag]
                      )
                    }}
                    className={`px-3 py-1 rounded-md border text-xs transition-colors ${
                      (filters.tags || []).includes(tag)
                        ? 'bg-ax-accent text-white border-ax-accent'
                        : 'bg-ax-bg border-ax-border text-ax-text hover:bg-ax-muted'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Assignee Filter */}
          {allAssignees.length > 0 && (
            <div className="space-y-2">
              <p className="text-ax-text text-xs font-semibold uppercase">Atanan</p>
              <div className="flex flex-wrap gap-2">
                {allAssignees.map(assignee => (
                  <button
                    key={assignee}
                    onClick={() => {
                      const current = filters.assignee || []
                      onFilterChange('assignee', current.includes(assignee)
                        ? current.filter(x => x !== assignee)
                        : [...current, assignee]
                      )
                    }}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
                      (filters.assignee || []).includes(assignee)
                        ? 'bg-ax-accent text-white border-ax-accent'
                        : 'bg-ax-bg border-ax-border text-ax-text hover:bg-ax-muted'
                    }`}
                  >
                    {assignee}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Clear Filters */}
          {(filters.search || filters.priority?.length || filters.tags?.length || filters.assignee?.length) && (
            <button
              onClick={() => onFilterChange('clear', true)}
              className="w-full px-3 py-1.5 rounded-lg bg-ax-red/10 border border-ax-red/20 text-ax-red text-xs font-medium hover:bg-ax-red/20 transition-colors"
            >
              Filtreleri Temizle
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function TaskQueue() {
  const [tasks, setTasks]     = useState([])
  const [loading, setLoading] = useState(true)
  const [dragging, setDragging] = useState(null)
  const [dragOver, setDragOver] = useState(null)
  const [selectedTask, setSelectedTask] = useState(null)
  const [hideCompleted, setHideCompleted] = useState(() => {
    return localStorage.getItem('hideCompletedTasks') === 'true'
  })
  const [activeTab, setActiveTab] = useState('active')
  const [filters, setFilters] = useState({
    search: '',
    priority: [],
    tags: [],
    assignee: [],
  })

  // Load filters from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const newFilters = {
      search: params.get('search') || '',
      priority: params.get('priority')?.split(',').filter(Boolean) || [],
      tags: params.get('tags')?.split(',').filter(Boolean) || [],
      assignee: params.get('assignee')?.split(',').filter(Boolean) || [],
    }
    setFilters(newFilters)
  }, [])

  function handleHideCompletedToggle() {
    const newValue = !hideCompleted
    setHideCompleted(newValue)
    localStorage.setItem('hideCompletedTasks', newValue.toString())
    if (newValue) {
      setActiveTab('active')
    }
  }

  function updateFilters(key, value) {
    let newFilters
    if (key === 'clear') {
      newFilters = { search: '', priority: [], tags: [], assignee: [] }
    } else {
      newFilters = { ...filters, [key]: value }
    }
    setFilters(newFilters)

    // Update URL
    const params = new URLSearchParams()
    if (newFilters.search) params.set('search', newFilters.search)
    if (newFilters.priority.length) params.set('priority', newFilters.priority.join(','))
    if (newFilters.tags.length) params.set('tags', newFilters.tags.join(','))
    if (newFilters.assignee.length) params.set('assignee', newFilters.assignee.join(','))

    const query = params.toString()
    window.history.replaceState(null, '', query ? `?${query}` : '/')
  }

  function getFilteredTasks() {
    return tasks.filter(task => {
      // Hide completed tasks if toggle is on and we're in active tab
      if (hideCompleted && activeTab === 'active' && task.status === 'done') {
        return false
      }

      // Show only completed tasks in archive tab
      if (activeTab === 'archive' && task.status !== 'done') {
        return false
      }

      // Search filter
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const match = task.title.toLowerCase().includes(q) || task.description.toLowerCase().includes(q) || task.id.toLowerCase().includes(q)
        if (!match) return false
      }

      // Priority filter
      if (filters.priority.length && !filters.priority.includes(task.priority)) {
        return false
      }

      // Tags filter - task must have at least one of the selected tags
      if (filters.tags.length && !filters.tags.some(tag => task.tags.includes(tag))) {
        return false
      }

      // Assignee filter
      if (filters.assignee.length && !filters.assignee.includes(task.agent)) {
        return false
      }

      return true
    })
  }

  async function loadTasks() {
    try {
      const raw = await getTasks()
      setTasks(raw.map(normalizeTask))
    } catch {
      // keep existing tasks on error
    }
    setLoading(false)
  }

  useEffect(() => {
    loadTasks()
    const t = setInterval(loadTasks, 30_000)
    return () => clearInterval(t)
  }, [])

  async function handleDrop(taskId, newStatus) {
    setDragging(null)
    setDragOver(null)
    const task = tasks.find(t => t.id === taskId)
    if (!task || task.status === newStatus) return
    // Optimistic update
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t))
    try {
      await updateTask(taskId, { status: newStatus })
    } catch {
      loadTasks() // rollback
    }
  }

  const filteredTasks = getFilteredTasks()
  const inProgress = filteredTasks.filter(t => t.status === 'in_progress')
  const pending    = filteredTasks.filter(t => t.status === 'pending')
  const done       = filteredTasks.filter(t => t.status === 'done')

  // Get unique values for filter options
  const allTags = [...new Set(tasks.flatMap(t => t.tags))].sort()
  const allAssignees = [...new Set(tasks.map(t => t.agent).filter(a => a && a !== '—'))].sort()

  const COLUMNS = [
    {
      status: 'in_progress',
      label: 'Devam Ediyor',
      icon: AlertCircle,
      iconClass: 'text-ax-amber',
      badgeClass: 'bg-ax-amber/10 border-ax-amber/20 text-ax-amber',
      items: inProgress,
    },
    {
      status: 'pending',
      label: 'Bekliyor',
      icon: Clock,
      iconClass: 'text-ax-dim',
      badgeClass: 'bg-ax-muted border-ax-border text-ax-dim',
      items: pending,
    },
    {
      status: 'done',
      label: 'Tamamlandı',
      icon: CheckCircle2,
      iconClass: 'text-ax-green',
      badgeClass: 'bg-ax-green/10 border-ax-green/20 text-ax-green',
      items: done,
    },
  ]

  return (
    <div
      className="p-4 sm:p-6 space-y-6 max-w-4xl"
      onDragEnd={() => { setDragging(null); setDragOver(null) }}
    >
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-ax-heading text-xl sm:text-2xl font-bold tracking-tight">Görev Kuyruğu</h1>
          <p className="text-ax-dim text-sm mt-0.5">
            {loading
              ? 'Yükleniyor...'
              : `${inProgress.length} devam ediyor · ${pending.length} bekliyor · ${done.length} tamamlandı`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ax-panel border border-ax-border">
            <ListTodo size={13} className="text-ax-accent" />
            <span className="text-ax-text text-sm">{filteredTasks.length} / {tasks.length}</span>
          </div>
          <button
            onClick={handleHideCompletedToggle}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-colors ${
              hideCompleted
                ? 'bg-ax-accent/15 border-ax-accent/30 text-ax-accent hover:bg-ax-accent/25'
                : 'bg-ax-panel border-ax-border text-ax-text hover:bg-ax-muted'
            }`}
            title={hideCompleted ? 'Tamamlananları göster' : 'Tamamlananları gizle'}
          >
            {hideCompleted ? <EyeOff size={13} /> : <Eye size={13} />}
            <span className="text-sm hidden sm:inline">{hideCompleted ? 'Gizli' : 'Görünür'}</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex items-center gap-2 border-b border-ax-border">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 border-b-2 transition-colors ${
            activeTab === 'active'
              ? 'border-ax-accent text-ax-accent font-medium'
              : 'border-transparent text-ax-dim hover:text-ax-text'
          }`}
        >
          <span className="flex items-center gap-2">
            <ListTodo size={14} />
            Etkinler
          </span>
        </button>
        {done.length > 0 && (
          <button
            onClick={() => setActiveTab('archive')}
            className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'archive'
                ? 'border-ax-accent text-ax-accent font-medium'
                : 'border-transparent text-ax-dim hover:text-ax-text'
            }`}
          >
            <Archive size={14} />
            Arşiv ({done.length})
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ax-panel border border-ax-border">
        <Search size={14} className="text-ax-subtle" />
        <input
          type="text"
          value={filters.search}
          onChange={e => updateFilters('search', e.target.value)}
          placeholder="Görev adı, açıklama veya ID'ye göre ara..."
          className="flex-1 bg-transparent text-ax-text text-sm placeholder:text-ax-subtle focus:outline-none"
        />
        {filters.search && (
          <button
            onClick={() => updateFilters('search', '')}
            className="p-1 rounded hover:bg-ax-muted text-ax-dim transition-colors"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filters */}
      <FilterPanel
        filters={filters}
        onFilterChange={updateFilters}
        allTags={allTags}
        allAssignees={allAssignees}
      />

      {/* Active Tasks View */}
      {activeTab === 'active' && (
        <>
          <AddTaskForm onAdded={loadTasks} />

          {COLUMNS.map(col => (
            <DropZone
              key={col.status}
              status={col.status}
              label={col.label}
              icon={col.icon}
              iconClass={col.iconClass}
              badgeClass={col.badgeClass}
              count={col.items.length}
              onDrop={handleDrop}
              dragOver={dragOver}
              onDragOver={setDragOver}
              onDragLeave={() => setDragOver(null)}
            >
              {col.items.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onStatusChange={loadTasks}
                  onDragStart={setDragging}
                  dragging={dragging}
                  onOpen={setSelectedTask}
                />
              ))}
            </DropZone>
          ))}
        </>
      )}

      {/* Archive View */}
      {activeTab === 'archive' && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Archive size={13} className="text-ax-green" />
            <h2 className="text-ax-text text-xs font-semibold uppercase tracking-wider">Arşiv</h2>
            <span className="px-1.5 py-0.5 rounded border text-[10px] font-medium bg-ax-green/10 border-ax-green/20 text-ax-green">{filteredTasks.length}</span>
          </div>
          <div className="space-y-2">
            {filteredTasks.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-ax-subtle text-sm rounded-lg border border-ax-border bg-ax-surface">
                Arşivlenmiş görev bulunmuyor
              </div>
            ) : (
              filteredTasks.map(t => (
                <TaskRow
                  key={t.id}
                  task={t}
                  onStatusChange={loadTasks}
                  onDragStart={setDragging}
                  dragging={dragging}
                  onOpen={setSelectedTask}
                />
              ))
            )}
          </div>
        </div>
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onUpdated={async () => {
            try {
              const raw = await getTasks()
              const normalized = raw.map(normalizeTask)
              setTasks(normalized)
              const fresh = normalized.find(t => t.id === selectedTask.id)
              if (fresh) setSelectedTask(fresh)
            } catch {
              loadTasks()
            }
          }}
        />
      )}
    </div>
  )
}
