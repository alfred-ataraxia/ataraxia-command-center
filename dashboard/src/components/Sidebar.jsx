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
        'group flex items-center gap-3 w-full pl-0 pr-4 py-2.5 text-sm transition-all duration-200 border-l-2',
        active
          ? 'border-ax-accent text-ax-heading bg-ax-accent/5'
          : 'border-transparent text-ax-dim hover:text-ax-text hover:bg-ax-muted/20 hover:border-ax-subtle',
      ].join(' ')}
    >
      <span className={`font-mono text-[10px] w-8 text-right pr-1 shrink-0 transition-colors ${active ? 'text-ax-accent' : 'text-ax-subtle group-hover:text-ax-dim'}`}>
        {item.num}
      </span>
      <Icon
        size={15}
        className={`shrink-0 transition-colors ${active ? 'text-ax-accent' : 'text-ax-subtle group-hover:text-ax-text'}`}
      />
      <span className={`flex-1 text-left tracking-wide ${active ? 'font-semibold text-ax-heading' : 'font-medium'}`}>
        {item.label}
      </span>
      {active && <div className="w-1 h-1 rounded-full bg-ax-accent shrink-0" />}
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
    <div className="flex flex-col h-full bg-ax-surface border-r border-ax-border">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-ax-border/60">
        <div className="flex items-center gap-3">
          <img
            src={openclawUp ? '/logo-mark-live.svg' : '/logo-mark.svg'}
            width="36"
            height="36"
            alt="Ataraxia"
            className="shrink-0"
          />
          <div className="leading-tight">
            <h1 className="text-ax-heading font-black text-base tracking-tight italic">ATARAXIA</h1>
            <p className="text-ax-dim text-[9px] uppercase font-bold tracking-[0.25em] mt-0.5">Command Center</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-3">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={activeView === item.id} onClick={handleNav} />
        ))}
      </nav>

      {/* System Health */}
      <div className="px-4 py-4 border-t border-ax-border/60">
        <div className={`px-3 py-3 rounded-xl border transition-colors ${
          openclawUp === null ? 'bg-ax-panel/50 border-ax-border'
          : openclawUp ? 'bg-ax-green/5 border-ax-green/20'
          : 'bg-ax-red/5 border-ax-red/20'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
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
          <p className="text-[10px] text-ax-subtle mt-1">
            {openclawUp ? 'Her 30dk\'da görev alır' : 'Gateway yanıt vermiyor'}
          </p>
        </div>
      </div>

      {/* Theme Toggle */}
      <div className="px-4 pb-6 pt-4 border-t border-ax-border/50">
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
          className="fixed top-5 left-5 z-50 p-2.5 rounded-xl bg-ax-panel border border-ax-border text-ax-dim shadow-lg md:hidden"
        >
          <Menu size={20} />
        </button>
      )}

      {/* Mobile Sidebar */}
      <div className={`fixed inset-0 z-50 transform ${open ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 md:hidden`}>
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setOpen(false)} />
        <aside className="relative w-72 h-full bg-ax-surface shadow-2xl">
          <button onClick={() => setOpen(false)} className="absolute top-5 right-5 p-2 text-ax-dim">
            <X size={20} />
          </button>
          <SidebarContent activeView={activeView} onNavigate={onNavigate} onClose={() => setOpen(false)} />
        </aside>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 h-screen bg-ax-surface border-r border-ax-border shrink-0 shadow-sm">
        <SidebarContent activeView={activeView} onNavigate={onNavigate} />
      </aside>
    </>
  )
}