import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import {
  LayoutDashboard,
  Bot,
  ListTodo,
  Wrench,
  BrainCircuit,
  ScrollText,
  Settings,
  Zap,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Lightbulb,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview',  label: 'Genel Bakış',  icon: LayoutDashboard },
  { id: 'agents',    label: 'Ajanlar',      icon: Bot },
  { id: 'tasks',     label: 'Görevler',     icon: ListTodo },
  { id: 'tools',     label: 'Araçlar',      icon: Wrench },
  { id: 'ha',        label: 'Otomasyon',    icon: Lightbulb },
  { id: 'memory',    label: 'Hafıza',       icon: BrainCircuit },
  { id: 'logs',      label: 'Kayıtlar',     icon: ScrollText },
  // { id: 'freeride',  label: 'FreeRide',     icon: Sparkles }, // openclaw-only
]

const BOTTOM_ITEMS = [
  { id: 'settings', label: 'Ayarlar', icon: Settings },
]

function NavItem({ item, active, onClick }) {
  const Icon = item.icon
  return (
    <button
      onClick={() => onClick(item.id)}
      className={[
        'group flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm transition-all duration-150',
        active
          ? 'bg-ax-accent/15 text-ax-accent2 border border-ax-accent/30'
          : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted/50',
      ].join(' ')}
    >
      <Icon
        size={16}
        className={active ? 'text-ax-accent' : 'text-ax-subtle group-hover:text-ax-text transition-colors'}
      />
      <span className="flex-1 text-left font-medium">{item.label}</span>
      {active && <ChevronRight size={12} className="text-ax-accent/60" />}
    </button>
  )
}

function SidebarContent({ activeView, onNavigate, onClose }) {
  function handleNav(id) {
    onNavigate(id)
    if (onClose) onClose()
  }

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-ax-border">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-ax-accent/20 border border-ax-accent/30">
            <Zap size={15} className="text-ax-accent" />
          </div>
          <div className="leading-none">
            <p className="text-ax-heading font-semibold text-sm tracking-wide">ATARAXIA</p>
            <p className="text-ax-dim text-[10px] uppercase tracking-widest mt-0.5">Komut Merkezi</p>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1.5 rounded-lg text-ax-dim hover:text-ax-text hover:bg-ax-muted md:hidden">
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 space-y-0.5 overflow-y-auto">
        <p className="px-3 mb-2 text-[10px] uppercase tracking-widest text-ax-subtle font-medium">Navigasyon</p>
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={activeView === item.id} onClick={handleNav} />
        ))}
      </nav>

      {/* Status */}
      <div className="mx-3 mb-3 px-3 py-2 rounded-lg bg-ax-panel border border-ax-border">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-ax-green opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-ax-green" />
          </span>
          <span className="text-xs text-ax-dim">Sistem çalışıyor</span>
        </div>
      </div>

      {/* Bottom */}
      <div className="px-2 pb-4 border-t border-ax-border pt-3 space-y-2">
        <div className="px-1">
          <ThemeToggle />
        </div>
        {BOTTOM_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={activeView === item.id} onClick={handleNav} />
        ))}
      </div>
    </>
  )
}

export default function Sidebar({ activeView, onNavigate }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-ax-surface border border-ax-border text-ax-dim hover:text-ax-text md:hidden"
      >
        <Menu size={20} />
      </button>

      {/* Mobile overlay */}
      {open && (
        <div className="fixed inset-0 z-40 bg-black/60 md:hidden" onClick={() => setOpen(false)} />
      )}

      {/* Mobile drawer */}
      <aside
        className={[
          'fixed inset-y-0 left-0 z-50 flex flex-col w-64 bg-ax-surface border-r border-ax-border transform transition-transform duration-200 md:hidden',
          open ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <SidebarContent activeView={activeView} onNavigate={onNavigate} onClose={() => setOpen(false)} />
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex flex-col w-60 h-screen bg-ax-surface border-r border-ax-border shrink-0">
        <SidebarContent activeView={activeView} onNavigate={onNavigate} />
      </aside>
    </>
  )
}
