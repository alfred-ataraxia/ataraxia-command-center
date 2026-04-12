import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import {
  LayoutDashboard,
  Zap,
  ChevronRight,
  Menu,
  X,
  Activity,
  Settings,
} from 'lucide-react'

const NAV_ITEMS = [
  { id: 'overview',      label: 'Kokpit',        icon: LayoutDashboard },
  { id: 'orchestration', label: 'Orkestrasyon', icon: Zap },
  { id: 'tasks',          label: 'Operasyon',    icon: Activity },
  { id: 'memory',         label: 'Sistem',       icon: Settings },
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
  function handleNav(id) {
    onNavigate(id)
    if (onClose) onClose()
  }

  return (
    <div className="flex flex-col h-full bg-ax-surface">
      {/* Logo Area */}
      <div className="px-6 py-8">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-ax-accent/10 border border-ax-accent/20">
            <Zap size={20} className="text-ax-accent" />
          </div>
          <div className="leading-tight">
            <h1 className="text-ax-heading font-black text-lg tracking-tight italic">ATARAXIA</h1>
            <p className="text-ax-dim text-[10px] uppercase font-bold tracking-[0.2em]">v2.0 Beta</p>
          </div>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map(item => (
          <NavItem key={item.id} item={item} active={activeView === item.id} onClick={handleNav} />
        ))}
      </nav>

      {/* Health Indicator */}
      <div className="px-4 py-4">
        <div className="p-4 rounded-2xl bg-ax-panel border border-ax-border space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-ax-green animate-pulse" />
            <span className="text-[10px] font-black uppercase text-ax-dim tracking-wider">Sistem Stabil</span>
          </div>
          <div className="h-1 w-full bg-ax-muted rounded-full overflow-hidden">
            <div className="h-full bg-ax-green w-[85%]" />
          </div>
        </div>
      </div>

      {/* Bottom Actions */}
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
