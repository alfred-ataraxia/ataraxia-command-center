import { useState, useEffect } from 'react'
import {
  Bot,
  Activity,
  Clock,
  CheckCircle2,
  AlertCircle,
  Circle,
  Cpu,
  MemoryStick,
  HardDrive,
  RefreshCw,
  WifiOff,
} from 'lucide-react'
import { useHA } from '../hooks/useHA'
import SystemMetricsChart from './SystemMetricsChart'

const STAT_SCHEMA = [
  {
    label: 'İşlemci Kullanımı',
    key: 'cpuPercent',
    unit: '%',
    icon: Cpu,
    bg: 'bg-ax-accent/10',
    border: 'border-ax-accent/20',
    iconColor: 'text-ax-accent',
  },
  {
    label: 'Bellek',
    key: 'memPercent',
    unit: '%',
    icon: MemoryStick,
    bg: 'bg-ax-cyan/10',
    border: 'border-ax-cyan/20',
    iconColor: 'text-ax-cyan',
  },
  {
    label: 'Disk Kullanımı',
    key: 'diskPercent',
    unit: '%',
    icon: HardDrive,
    bg: 'bg-ax-amber/10',
    border: 'border-ax-amber/20',
    iconColor: 'text-ax-amber',
  },
  {
    label: 'Çalışma Süresi',
    key: 'uptimeHuman',
    unit: '',
    icon: Clock,
    bg: 'bg-ax-green/10',
    border: 'border-ax-green/20',
    iconColor: 'text-ax-green',
    isText: true,
  },
]

function buildStats(sysStats) {
  return STAT_SCHEMA.map(s => {
    const raw = sysStats?.[s.key]
    const value = raw !== undefined ? raw : null
    return { ...s, value }
  })
}

const RESOURCE_ICONS = {
  'İşlemci': Cpu,
  'Bellek':  MemoryStick,
  'Disk':    HardDrive,
}

const ACTIVE_AGENTS = [
  { name: 'Alfred',   role: 'Orkestratör',  status: 'active',  model: 'claude-sonnet-4-6', tasks: 3 },
  { name: 'Planner',  role: 'Stratejist',   status: 'idle',    model: 'claude-opus-4-6',   tasks: 0 },
  { name: 'Monitor',  role: 'Gözcü',        status: 'active',  model: 'claude-haiku-4-5',  tasks: 1 },
]

function formatTimeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'az önce'
  if (mins < 60) return `${mins}dk önce`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}sa önce`
  return `${Math.floor(hours / 24)}g önce`
}

function StatCard({ stat, loading }) {
  const Icon = stat.icon
  const displayValue = stat.value !== null
    ? stat.isText ? stat.value : `${Math.round(stat.value)}${stat.unit}`
    : '—'
  return (
    <div className={`rounded-xl p-4 bg-ax-panel border ${stat.border} flex flex-col gap-3`}>
      <div className="flex items-center justify-between">
        <span className="text-ax-dim text-xs font-medium uppercase tracking-wider">{stat.label}</span>
        <div className={`p-1.5 rounded-lg ${stat.bg}`}>
          <Icon size={14} className={stat.iconColor} />
        </div>
      </div>
      <div>
        {loading ? (
          <>
            <div className="h-8 w-20 rounded-md bg-ax-muted animate-pulse" />
            <div className="h-3 w-24 rounded mt-1.5 bg-ax-muted animate-pulse" />
          </>
        ) : (
          <>
            <p className="text-ax-heading text-2xl font-bold tabular-nums">{displayValue}</p>
            <p className="text-ax-dim text-xs mt-0.5">
              {stat.value !== null ? 'canlı veri' : 'sensör erişilemez'}
            </p>
          </>
        )}
      </div>
    </div>
  )
}

function ActivityDot({ type }) {
  if (type === 'success') return <CheckCircle2 size={14} className="text-ax-green shrink-0 mt-0.5" />
  if (type === 'warning') return <AlertCircle  size={14} className="text-ax-amber  shrink-0 mt-0.5" />
  return <Circle size={14} className="text-ax-accent shrink-0 mt-0.5" />
}

function ResourceBar({ resource }) {
  const Icon = RESOURCE_ICONS[resource.label] ?? Cpu
  const value = resource.value
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Icon size={12} className="text-ax-dim" />
          <span className="text-xs text-ax-dim">{resource.label}</span>
        </div>
        <span className="text-xs text-ax-text tabular-nums">
          {value !== null ? `${Math.round(value)}%` : '—'}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-ax-muted overflow-hidden">
        <div
          className={`h-full rounded-full ${resource.color} transition-all duration-700`}
          style={{ width: value !== null ? `${value}%` : '0%' }}
        />
      </div>
    </div>
  )
}

function AgentBadge({ status }) {
  if (status === 'active') {
    return (
      <span className="inline-flex items-center gap-1.5 text-xs text-ax-green">
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ax-green opacity-75" />
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-ax-green" />
        </span>
        Aktif
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-xs text-ax-dim">
      <span className="h-1.5 w-1.5 rounded-full bg-ax-subtle" />
      Boşta
    </span>
  )
}

export default function Overview() {
  const [now, setNow] = useState(new Date())
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(t)
  }, [])

  const { resources, systemStats, activity, loading: haLoading, error: haError, lastUpdated } = useHA()

  const timeStr = now.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
  const dateStr = now.toLocaleDateString('tr-TR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const liveStats = buildStats(systemStats)
  const liveResources = resources ?? [
    { label: 'İşlemci', key: 'cpu',  value: null, color: 'bg-ax-accent' },
    { label: 'Bellek',  key: 'mem',  value: null, color: 'bg-ax-cyan' },
    { label: 'Disk',    key: 'disk', value: null, color: 'bg-ax-green' },
  ]

  const liveActivity = Array.isArray(activity)
    ? activity.slice(0, 10).map((entry, i) => ({
        id: i,
        type: entry.type || 'info',
        agent: entry.agent || 'Sistem',
        action: entry.action || '',
        time: formatTimeAgo(entry.when),
      }))
    : []

  // Alarm detection
  const alarms = []
  if (systemStats?.cpuPercent >= 90) alarms.push({ label: 'CPU', value: systemStats.cpuPercent, icon: Cpu })
  if (systemStats?.memPercent >= 85) alarms.push({ label: 'RAM', value: systemStats.memPercent, icon: MemoryStick })
  if (systemStats?.diskPercent >= 90) alarms.push({ label: 'Disk', value: systemStats.diskPercent, icon: HardDrive })

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      {/* Alarm banner */}
      {alarms.length > 0 && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30 animate-pulse">
          <AlertCircle size={18} className="text-red-400 shrink-0" />
          <div className="flex-1">
            <p className="text-red-300 text-sm font-semibold">Sistem Uyarısı</p>
            <p className="text-red-400/80 text-xs mt-0.5">
              {alarms.map(a => `${a.label} %${a.value}`).join(' · ')} — Kaynak kullanımı kritik seviyede!
            </p>
          </div>
        </div>
      )}

      {/* Başlık */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-ax-heading text-xl sm:text-2xl font-bold tracking-tight">Genel Bakış</h1>
          <p className="text-ax-dim text-sm mt-0.5">{dateStr}</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-ax-panel border border-ax-border">
          <Clock size={13} className="text-ax-dim" />
          <span className="text-ax-text text-sm tabular-nums">{timeStr}</span>
        </div>
      </div>

      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        {liveStats.map(stat => (
          <StatCard key={stat.key} stat={stat} loading={haLoading && !lastUpdated} />
        ))}
      </div>

      {/* Sistem metrikleri grafiği */}
      <SystemMetricsChart />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Son aktiviteler */}
        <div className="xl:col-span-2 rounded-xl bg-ax-panel border border-ax-border p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Activity size={14} className="text-ax-accent" />
              <h2 className="text-ax-heading text-sm font-semibold">Son Aktiviteler</h2>
            </div>
            <span className="text-ax-dim text-xs">
              {haLoading && !lastUpdated ? 'yükleniyor...' : `${liveActivity.length} olay`}
            </span>
          </div>
          <div className="space-y-3">
            {liveActivity.length > 0 ? (
              liveActivity.map(event => (
                <div key={event.id} className="flex items-start gap-2.5">
                  <ActivityDot type={event.type} />
                  <div className="flex-1 min-w-0">
                    <p className="text-ax-text text-xs leading-relaxed">
                      <span className="text-ax-accent2 font-medium">{event.agent}</span>
                      {' — '}{event.action}
                    </p>
                  </div>
                  <span className="text-ax-subtle text-xs shrink-0">{event.time}</span>
                </div>
              ))
            ) : (
              <p className="text-ax-dim text-xs">
                {haError ? 'Aktivite API erişilemedi' : 'Henüz aktivite yok'}
              </p>
            )}
          </div>
        </div>

        {/* Sağ sütun */}
        <div className="space-y-4">
          {/* Sistem kaynakları */}
          <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Cpu size={14} className="text-ax-cyan" />
                <h2 className="text-ax-heading text-sm font-semibold">Sistem Kaynakları</h2>
              </div>
              {haError ? (
                <span className="flex items-center gap-1 text-[10px] text-ax-amber">
                  <WifiOff size={10} /> API çevrimdışı
                </span>
              ) : haLoading && !lastUpdated ? (
                <RefreshCw size={10} className="text-ax-dim animate-spin" />
              ) : lastUpdated ? (
                <span className="text-[10px] text-ax-subtle">
                  {lastUpdated.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </span>
              ) : null}
            </div>
            <div className="space-y-3">
              {liveResources.map(r => <ResourceBar key={r.label} resource={r} />)}
            </div>
          </div>

          {/* Ajan kadrosu */}
          <div className="rounded-xl bg-ax-panel border border-ax-border p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bot size={14} className="text-ax-purple" />
              <h2 className="text-ax-heading text-sm font-semibold">Ajan Kadrosu</h2>
            </div>
            <div className="space-y-3">
              {ACTIVE_AGENTS.map(agent => (
                <div key={agent.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-ax-muted border border-ax-border flex items-center justify-center">
                      <Bot size={12} className="text-ax-dim" />
                    </div>
                    <div>
                      <p className="text-ax-text text-xs font-medium">{agent.name}</p>
                      <p className="text-ax-subtle text-[10px]">{agent.role}</p>
                    </div>
                  </div>
                  <AgentBadge status={agent.status} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
