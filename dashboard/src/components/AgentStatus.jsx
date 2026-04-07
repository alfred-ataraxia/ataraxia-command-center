import { Bot, Cpu, Clock, MessageSquare, RefreshCw, ExternalLink } from 'lucide-react'

const AGENTS = [
  {
    id: 1,
    name: 'Alfred',
    role: 'Orkestratör',
    model: 'claude-sonnet-4-6',
    status: 'active',
    uptime: '14sa 32dk',
    tasksTotal: 147,
    tasksToday: 3,
    lastAction: 'Sabah brifingini tamamladı',
    lastActionTime: '2dk önce',
    description: 'Birincil koordinasyon ajanı. Zamanlanmış görevleri, hafızayı ve ağ genelinde görev dağılımını yönetir.',
    tags: ['cron', 'hafıza', 'delegasyon'],
  },
  {
    id: 2,
    name: 'Planner',
    role: 'Stratejist',
    model: 'claude-opus-4-6',
    status: 'idle',
    uptime: '6sa 10dk',
    tasksTotal: 34,
    tasksToday: 0,
    lastAction: 'EPIC.md yol haritası oluşturuldu',
    lastActionTime: '8dk önce',
    description: 'Üst düzey planlama ve yol haritası oluşturma. EPIC ayrıştırma ve kilometre taşı takibi yapar.',
    tags: ['planlama', 'yol haritası', 'epikler'],
  },
  {
    id: 3,
    name: 'Monitor',
    role: 'Gözcü',
    model: 'claude-haiku-4-5',
    status: 'active',
    uptime: '3g 4sa',
    tasksTotal: 892,
    tasksToday: 1,
    lastAction: 'Sistem sağlık kontrolü başarılı',
    lastActionTime: '1sa önce',
    description: 'Sürekli sistem izleme, sağlık kontrolleri ve OpenClaw çalışma alanı için uyarı yönetimi.',
    tags: ['izleme', 'sağlık', 'uyarılar'],
  },
  {
    id: 4,
    name: 'Security',
    role: 'Denetçi',
    model: 'claude-sonnet-4-6',
    status: 'idle',
    uptime: '1g 2sa',
    tasksTotal: 56,
    tasksToday: 0,
    lastAction: '2 bağımlılık güncellemesi işaretlendi',
    lastActionTime: '15dk önce',
    description: 'Güvenlik denetimi, bağımlılık taraması ve ajan ağı için güvenlik açığı değerlendirmesi.',
    tags: ['güvenlik', 'denetim', 'CVE'],
  },
]

const STATUS_STYLE = {
  active: {
    badge: 'text-ax-green bg-ax-green/10 border-ax-green/25',
    dot: 'bg-ax-green',
    ping: true,
    label: 'Aktif',
  },
  idle: {
    badge: 'text-ax-dim bg-ax-muted border-ax-border',
    dot: 'bg-ax-subtle',
    ping: false,
    label: 'Boşta',
  },
}

function StatusDot({ status }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.idle
  return (
    <span className="relative flex h-2 w-2">
      {s.ping && (
        <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${s.dot} opacity-60`} />
      )}
      <span className={`relative inline-flex rounded-full h-2 w-2 ${s.dot}`} />
    </span>
  )
}

function AgentCard({ agent }) {
  const s = STATUS_STYLE[agent.status] ?? STATUS_STYLE.idle
  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border p-5 flex flex-col gap-4 hover:border-ax-muted transition-colors">
      {/* Başlık satırı */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ax-accent/10 border border-ax-accent/25 flex items-center justify-center shrink-0">
            <Bot size={18} className="text-ax-accent" />
          </div>
          <div>
            <p className="text-ax-heading font-semibold text-sm">{agent.name}</p>
            <p className="text-ax-dim text-xs">{agent.role}</p>
          </div>
        </div>
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-xs font-medium ${s.badge}`}>
          <StatusDot status={agent.status} />
          {s.label}
        </span>
      </div>

      {/* Açıklama */}
      <p className="text-ax-dim text-xs leading-relaxed">{agent.description}</p>

      {/* Etiketler */}
      <div className="flex flex-wrap gap-1.5">
        {agent.tags.map(tag => (
          <span key={tag} className="px-2 py-0.5 rounded-md bg-ax-muted border border-ax-border text-ax-subtle text-[10px] font-medium">
            {tag}
          </span>
        ))}
      </div>

      {/* İstatistik satırı */}
      <div className="grid grid-cols-3 gap-3 pt-1 border-t border-ax-border">
        <div>
          <p className="text-ax-heading text-sm font-bold tabular-nums">{agent.tasksTotal}</p>
          <p className="text-ax-dim text-[10px] uppercase tracking-wide">Toplam görev</p>
        </div>
        <div>
          <p className="text-ax-heading text-sm font-bold tabular-nums">{agent.tasksToday}</p>
          <p className="text-ax-dim text-[10px] uppercase tracking-wide">Bugün</p>
        </div>
        <div>
          <p className="text-ax-heading text-sm font-bold">{agent.uptime}</p>
          <p className="text-ax-dim text-[10px] uppercase tracking-wide">Çalışma süresi</p>
        </div>
      </div>

      {/* Son işlem */}
      <div className="flex items-center gap-2 text-xs text-ax-dim">
        <MessageSquare size={11} className="shrink-0" />
        <span className="truncate">{agent.lastAction}</span>
        <span className="shrink-0 text-ax-subtle">{agent.lastActionTime}</span>
      </div>

      {/* Alt satır */}
      <div className="flex items-center justify-between pt-1 border-t border-ax-border">
        <div className="flex items-center gap-1.5 text-[10px] text-ax-subtle">
          <Cpu size={10} />
          <span className="font-mono">{agent.model}</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1 rounded hover:bg-ax-muted transition-colors text-ax-subtle hover:text-ax-text">
            <RefreshCw size={12} />
          </button>
          <button className="p-1 rounded hover:bg-ax-muted transition-colors text-ax-subtle hover:text-ax-text">
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function AgentStatus() {
  const activeCount = AGENTS.filter(a => a.status === 'active').length

  return (
    <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 max-w-6xl">
      {/* Başlık */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-ax-heading text-xl sm:text-2xl font-bold tracking-tight">Ajan Durumları</h1>
          <p className="text-ax-dim text-sm mt-0.5">
            {AGENTS.length} ajandan {activeCount} tanesi aktif
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={13} className="text-ax-dim" />
          <span className="text-ax-dim text-xs">Her 30 saniyede otomatik yenilenir</span>
        </div>
      </div>

      {/* Izgara */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {AGENTS.map(agent => <AgentCard key={agent.id} agent={agent} />)}
      </div>
    </div>
  )
}
