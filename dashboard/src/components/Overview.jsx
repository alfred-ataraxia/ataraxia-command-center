import { useState, useEffect } from 'react'
import { Cpu, MemoryStick, HardDrive, Clock, AlertCircle, ListTodo, CheckCircle2, Circle, Activity, BellRing, Siren } from 'lucide-react'
import { getSystemStats } from '../services/haService'
import apiFetch from '../services/apiFetch'
import StatsChart from './StatsChart'

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'az önce'
  if (m < 60) return `${m}dk önce`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa önce`
  return `${Math.floor(h / 24)}g önce`
}

function ActivityDot({ type }) {
  if (type === 'success') return <CheckCircle2 size={12} className="text-ax-green shrink-0 mt-0.5" />
  if (type === 'error')   return <AlertCircle  size={12} className="text-ax-red   shrink-0 mt-0.5" />
  return <Circle size={12} className="text-ax-dim shrink-0 mt-0.5" />
}

const STATS = [
  { key: 'cpuPercent',  label: 'CPU',   unit: '%', icon: Cpu,         color: 'text-ax-accent',  bar: 'bg-ax-accent'  },
  { key: 'memPercent',  label: 'RAM',   unit: '%', icon: MemoryStick, color: 'text-ax-cyan',    bar: 'bg-ax-cyan'    },
  { key: 'diskPercent', label: 'Disk',  unit: '%', icon: HardDrive,   color: 'text-ax-amber',   bar: 'bg-ax-amber'   },
  { key: 'swapPercent', label: 'Swap',  unit: '%', icon: HardDrive,   color: 'text-purple-400', bar: 'bg-purple-400' },
]

function pct(v) { return v != null ? Math.round(v) : null }

export default function Overview() {
  const [stats, setStats] = useState(null)
  const [uptime, setUptime] = useState(null)
  const [error, setError] = useState(false)
  const [now, setNow] = useState(new Date())
  const [taskSummary, setTaskSummary] = useState(null)
  const [activities, setActivities] = useState([])
  const [alerts, setAlerts] = useState([])
  const [notifications, setNotifications] = useState([])

  useEffect(() => {
    const tick = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(tick)
  }, [])

  useEffect(() => {
    async function fetchStats() {
      try {
        const d = await getSystemStats()
        setStats(d)
        setUptime(d.uptimeHuman ?? null)
        setError(false)
      } catch {
        setError(true)
      }
    }
    async function fetchTasks() {
      try {
        const res = await apiFetch('/api/tasks')
        if (res.ok) {
          const d = await res.json()
          const tasks = d.tasks || []
          setTaskSummary({
            pending: tasks.filter(t => t.status === 'pending').length,
            inProgress: tasks.filter(t => t.status === 'in_progress').length,
            done: tasks.filter(t => t.status === 'done').length,
          })
        }
      } catch {
        setTaskSummary(null)
      }
    }
    async function fetchActivity() {
      try {
        const res = await apiFetch('/api/activity')
        if (res.ok) {
          const d = await res.json()
          setActivities(d.activities || [])
        }
      } catch {
        setActivities([])
      }
    }
    async function fetchAlerts() {
      try {
        const res = await apiFetch('/api/alerts')
        if (res.ok) {
          const d = await res.json()
          setAlerts(d.alerts || [])
        }
      } catch {
        setAlerts([])
      }
    }
    async function fetchNotifications() {
      try {
        const res = await apiFetch('/api/notifications')
        if (res.ok) {
          const d = await res.json()
          setNotifications(d.notifications || [])
        }
      } catch {
        setNotifications([])
      }
    }
    fetchStats()
    fetchTasks()
    fetchActivity()
    fetchAlerts()
    fetchNotifications()
    const t = setInterval(() => {
      fetchStats()
      fetchTasks()
      fetchActivity()
      fetchAlerts()
      fetchNotifications()
    }, 30_000)
    return () => clearInterval(t)
  }, [])

  const alarms = STATS.filter(s => stats?.[s.key] >= 85)

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-3xl">

      {/* Başlık */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-ax-heading text-xl font-bold">Genel Bakış</h1>
          <p className="text-ax-dim text-sm mt-0.5">
            {now.toLocaleDateString('tr-TR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ax-panel border border-ax-border">
          <Clock size={13} className="text-ax-dim" />
          <span className="text-ax-text text-sm tabular-nums">
            {now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Alarm */}
      {alarms.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
          <AlertCircle size={16} className="text-red-400 shrink-0" />
          <p className="text-red-300 text-sm">
            {alarms.map(a => `${a.label} %${pct(stats[a.key])}`).join(' · ')} — yüksek kullanım
          </p>
        </div>
      )}

      {/* Stat kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {STATS.map(s => {
          const val = pct(stats?.[s.key])
          const Icon = s.icon
          return (
            <div key={s.key} className="rounded-xl bg-ax-panel border border-ax-border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-ax-dim text-xs font-medium">{s.label}</span>
                <Icon size={13} className={s.color} />
              </div>
              {val != null ? (
                <>
                  <p className={`text-2xl font-bold tabular-nums ${s.color}`}>{val}%</p>
                  <div className="h-1.5 rounded-full bg-ax-muted overflow-hidden">
                    <div className={`h-full rounded-full ${s.bar} transition-all duration-700`} style={{ width: `${val}%` }} />
                  </div>
                </>
              ) : (
                <p className="text-ax-subtle text-sm">{error ? 'hata' : '...'}</p>
              )}
            </div>
          )
        })}
      </div>

      {/* Grafik */}
      <StatsChart />

      {/* Görev özeti */}
      {taskSummary && (
        <div className="rounded-xl bg-ax-panel border border-ax-border p-4 flex items-center gap-6">
          <div className="flex items-center gap-2">
            <ListTodo size={14} className="text-ax-dim" />
            <span className="text-ax-dim text-xs font-medium">Görevler</span>
          </div>
          <div className="flex gap-5 text-xs">
            <span><span className="text-ax-amber font-bold">{taskSummary.inProgress}</span> <span className="text-ax-dim">aktif</span></span>
            <span><span className="text-ax-text font-bold">{taskSummary.pending}</span> <span className="text-ax-dim">bekleyen</span></span>
            <span><span className="text-ax-green font-bold">{taskSummary.done}</span> <span className="text-ax-dim">tamamlandı</span></span>
          </div>
        </div>
      )}

      {/* Son aktiviteler */}
      {(alerts.length > 0 || notifications.length > 0) && (
        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <Siren size={14} className="text-ax-red" />
              <h2 className="text-ax-heading text-sm font-semibold">Operasyon Uyarıları</h2>
            </div>
            {alerts.length === 0 ? (
              <p className="text-ax-dim text-sm">Aktif uyarı yok.</p>
            ) : (
              <div className="space-y-2">
                {alerts.slice(0, 4).map((alert) => (
                  <div
                    key={alert.id}
                    className={`rounded-lg border px-3 py-2 ${
                      alert.severity === 'critical'
                        ? 'border-ax-red/30 bg-ax-red/10'
                        : 'border-ax-amber/30 bg-ax-amber/10'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className={`text-xs font-semibold ${alert.severity === 'critical' ? 'text-ax-red' : 'text-ax-amber'}`}>
                        {alert.title}
                      </span>
                      <span className="text-[10px] text-ax-subtle">{timeAgo(alert.timestamp)}</span>
                    </div>
                    <p className="text-xs text-ax-dim mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
            <div className="flex items-center gap-2 mb-3">
              <BellRing size={14} className="text-ax-accent" />
              <h2 className="text-ax-heading text-sm font-semibold">Bildirim Akışı</h2>
            </div>
            {notifications.length === 0 ? (
              <p className="text-ax-dim text-sm">Henüz bildirim oluşmadı.</p>
            ) : (
              <div className="space-y-2">
                {notifications.slice(0, 5).map((notification) => (
                  <div key={notification.id} className="rounded-lg border border-ax-border bg-ax-surface px-3 py-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-xs font-semibold text-ax-heading">{notification.title}</span>
                      <span className="text-[10px] text-ax-subtle">{timeAgo(notification.timestamp)}</span>
                    </div>
                    <p className="text-xs text-ax-dim mt-1">{notification.message}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {activities.length > 0 && (
        <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Activity size={14} className="text-ax-accent" />
            <h2 className="text-ax-heading text-sm font-semibold">Son Aktiviteler</h2>
          </div>
          <div className="space-y-2">
            {activities.slice(0, 8).map((a, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <ActivityDot type={a.type} />
                <div className="flex-1 min-w-0">
                  <span className="text-ax-accent2 text-xs font-medium">{a.agent}</span>
                  <span className="text-ax-dim text-xs"> — {a.action}</span>
                </div>
                <span className="text-ax-subtle text-[10px] shrink-0">{timeAgo(a.when)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Uptime + hata */}
      <div className="flex items-center gap-3 text-xs text-ax-dim">
        {uptime && <span>Çalışma süresi: <span className="text-ax-text">{uptime}</span></span>}
        {error && <span className="text-ax-amber">Stats API erişilemedi</span>}
      </div>

    </div>
  )
}
