import { useState, useEffect } from 'react'
import ThemeToggle from './ThemeToggle'
import {
  LayoutDashboard,
  ListTodo,
  ScrollText,
  Bot,
  Timer,
  BrainCircuit,
  TrendingUp,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview',   label: 'Kokpit',    icon: LayoutDashboard, num: '01' },
  { id: 'tasks',      label: 'Görevler',  icon: ListTodo,        num: '02' },
  { id: 'agents',     label: 'Ajanlar',   icon: Bot,             num: '03' },
  { id: 'automation', label: 'Otomasyon', icon: Timer,           num: '04' },
  { id: 'approvals',  label: 'Onaylar',   icon: ShieldCheck,     num: '05' },
  { id: 'memory',     label: 'Hafıza',    icon: BrainCircuit,    num: '06' },
  { id: 'logs',       label: 'Logs',      icon: ScrollText,      num: '07' },
  { id: 'defi',       label: 'DeFi APM',  icon: TrendingUp,      num: '08' },
]

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={() => onClick(item.id)}
      className={[
        'group relative flex items-center gap-3 w-full pl-0 pr-4 py-3 text-sm transition-all duration-300',
        active
          ? 'text-ax-heading bg-ax-accent/10 shadow-[inset_2px_0_0_0_var(--color-ax-accent)]'
          : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted',
      ].join(' ')}
    >
      <span className={`font-mono text-[10px] w-8 text-right pr-1 shrink-0 transition-colors ${active ? 'text-ax-accent' : 'text-ax-subtle group-hover:text-ax-dim'}`}>
        {item.num}
      </span>
      <Icon
        size={16}
        className={`shrink-0 transition-all duration-300 ${active ? 'text-ax-accent scale-110' : 'text-ax-subtle group-hover:text-ax-text group-hover:scale-105'}`}
      />
      <span className={`flex-1 text-left tracking-wide ${active ? 'font-semibold text-ax-heading' : 'font-medium'}`}>
        {item.label}
      </span>
      {/* Active Indicator Glow */}
      {active && (
        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-ax-accent ax-glow" />
      )}
    </button>
  )
}

function SidebarContent({ activeView, onNavigate, onClose }) {
  const [openclawUp, setOpenclawUp] = useState(null)

  useEffect(() => {
    async function checkStatus() {
      try {
        const res = await fetch('/api/ai-status')
        if (res.ok) {
          const d = await res.json()
          setOpenclawUp(d.openclawStatus === 'up')
        }
      } catch { setOpenclawUp(false) }
    }
    checkStatus()
    const t = setInterval(checkStatus, 60_000)
    return () => clearInterval(t)
  }, [])

  function handleNav(id) {
    onNavigate(id)
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col h-full ax-glass border-r border-ax-border/30">
      {/* Logo */}
      <div className="px-6 py-8 border-b border-ax-border relative overflow-hidden">
        {/* Subtle background glow behind logo */}
        <div className="absolute -top-10 -left-10 w-32 h-32 bg-ax-accent2/20 rounded-full blur-[40px] pointer-events-none" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="relative">
            <img
              src={openclawUp ? '/logo-mark-live.svg' : '/logo-mark.svg'}
              width="36"
              height="36"
              alt="Ataraxia"
              className="shrink-0 relative z-10"
            />
            {openclawUp && <div className="absolute inset-0 bg-ax-accent/40 blur-md rounded-full" />}
          </div>
          <div className="leading-tight">
            <h1 className="text-ax-heading font-black text-lg tracking-tight">ATARAXIA</h1>
            <p className="text-ax-accent text-[11px] uppercase font-bold mt-0.5">Command Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 flex flex-col gap-1">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={activeView === item.id} onClick={handleNav} />
        ))}
      </nav>

      {/* System Health */}
      <div className="px-5 py-5 border-t border-ax-border bg-ax-surface">
        <div className={`px-4 py-3 rounded-2xl border transition-all duration-300 ${
          openclawUp === null ? 'bg-ax-panel/50 border-ax-border'
          : openclawUp ? 'bg-ax-green/10 border-ax-green/30'
          : 'bg-ax-red/10 border-ax-red/30'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-2 h-2 rounded-full shrink-0 ${
              openclawUp === null ? 'bg-ax-subtle'
              : openclawUp ? 'bg-ax-green animate-pulse'
              : 'bg-ax-red'
            }`} />
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              openclawUp === null ? 'text-ax-dim'
              : openclawUp ? 'text-ax-green'
              : 'text-ax-red'
            }`}>
              {openclawUp === null ? 'Kontrol ediliyor...'
               : openclawUp ? 'OpenClaw Aktif'
               : 'OpenClaw Kapalı'}
            </span>
          </div>
          <p className="text-[10px] text-ax-dim mt-1.5 ml-4">
            {openclawUp ? 'Her 30dk\'da görev alır' : 'Gateway yanıt vermiyor'}
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="px-5 pb-6 pt-4 bg-ax-surface">
        <ThemeToggle />
      </div>
    </div>
  )
}

export default function Sidebar({ activeView, onNavigate }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile Toggle */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed top-5 left-5 z-50 p-2.5 rounded-xl ax-glass text-ax-dim shadow-xl md:hidden hover:text-ax-accent transition-colors"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 transform ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-400 ease-out md:hidden`}>
        <div className={`absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-400 ${open ? 'opacity-100' : 'opacity-0'}`} onClick={() => setOpen(false)} />
        <aside className="relative w-72 h-full">
          <button onClick={() => setOpen(false)} className="absolute top-5 right-5 p-2 text-ax-dim hover:text-ax-heading transition-colors z-20">
            <X size={20} />
          </button>
          <SidebarContent activeView={activeView} onNavigate={onNavigate} onClose={() => setOpen(false)} />
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-72 h-screen shrink-0 relative z-20">
        <SidebarContent activeView={activeView} onNavigate={onNavigate} />
      </aside>
    </>
  )
}