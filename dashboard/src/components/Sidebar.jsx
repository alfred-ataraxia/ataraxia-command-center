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
  Menu,
  X,
  Trophy,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview',   label: 'Kokpit',    icon: LayoutDashboard },
  { id: 'tasks',      label: 'Görevler',  icon: ListTodo },
  { id: 'agents',     label: 'Ajanlar',   icon: Bot },
  { id: 'automation', label: 'Otomasyon', icon: Timer },
  { id: 'memory',     label: 'Hafıza',    icon: BrainCircuit },
  { id: 'logs',       label: 'Logs',      icon: ScrollText },
  { id: 'defi',       label: 'DeFi APM',  icon: TrendingUp },
  { id: 'toppools',   label: 'Top Pools', icon: Trophy },
]

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={() => onClick(item.id)}
      className={[
        'group flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm transition-all duration-200',
        active
          ? 'bg-ax-accent/10 text-ax-accent border border-ax-accent/20 shadow-sm'
          : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted/30',
      ].join(' ')}
    >
      <Icon
        size={18}
        className={active ? 'text-ax-accent' : 'text-ax-subtle group-hover:text-ax-text transition-colors'}
      />
      <span className={`flex-1 text-left ${active ? 'font-bold' : 'font-medium'}`}>{item.label}</span>
      {active && <div className="w-1.5 h-1.5 rounded-full bg-ax-accent" />}
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
    <div className="flex flex-col h-full bg-ax-surface">
      {/* Logo */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-ax-accent/10 border border-ax-accent/20">
            <span className="text-lg">🦊</span>
          </div>
          <div className="leading-tight">
            <h1 className="text-ax-heading font-black text-lg tracking-tight italic">ATARAXIA</h1>
            <p className="text-ax-dim text-[10px] uppercase font-bold tracking-[0.2em]">Alfred</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={activeView === item.id} onClick={handleNav} />
        ))}
      </nav>

      {/* System Health */}
      <div className="px-4 py-4">
        <div className={`p-4 rounded-2xl border space-y-2 transition-colors ${
          openclawUp === null ? 'bg-ax-panel border-ax-border'
          : openclawUp ? 'bg-ax-green/5 border-ax-green/20'
          : 'bg-ax-red/5 border-ax-red/20'
        }`}>
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              openclawUp === null ? 'bg-ax-subtle'
              : openclawUp ? 'bg-ax-green animate-pulse'
              : 'bg-ax-red'
            }`} />
            <span className={`text-[10px] font-black uppercase tracking-wider ${
              openclawUp === null ? 'text-ax-dim'
              : openclawUp ? 'text-ax-green'
              : 'text-ax-red'
            }`}>
              {openclawUp === null ? 'Kontrol ediliyor...'
               : openclawUp ? 'OpenClaw Aktif'
               : 'OpenClaw Kapalı'}
            </span>
          </div>
          <p className="text-[10px] text-ax-subtle">
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