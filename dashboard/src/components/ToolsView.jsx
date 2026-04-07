import { useState } from 'react'
import { Wrench, RotateCcw, Trash2, Hammer, CheckCircle2, Loader2 } from 'lucide-react'

const TOOLS = [
  { id: 'restart', label: 'Dashboard Yeniden Başlat', desc: 'server.cjs sunucusunu yeniden başlatır', icon: RotateCcw, action: 'restart' },
  { id: 'build', label: 'Dashboard Derle', desc: 'Vite build çalıştırır (dist/ güncellenir)', icon: Hammer, action: 'build' },
  { id: 'cache', label: 'Cache Temizle', desc: 'Tarayıcı cache header\'larını sıfırlar', icon: Trash2, action: 'cache' },
]

export default function ToolsView() {
  const [status, setStatus] = useState({})

  async function runAction(id, action) {
    setStatus(s => ({ ...s, [id]: 'running' }))
    try {
      const res = await fetch(`/api/actions/${action}`, { method: 'POST' })
      if (res.ok) {
        setStatus(s => ({ ...s, [id]: 'done' }))
      } else {
        setStatus(s => ({ ...s, [id]: 'error' }))
      }
    } catch {
      setStatus(s => ({ ...s, [id]: 'error' }))
    }
    setTimeout(() => setStatus(s => ({ ...s, [id]: null })), 3000)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-4xl">
      <div className="flex items-center gap-2">
        <Wrench size={18} className="text-ax-amber" />
        <h1 className="text-ax-heading text-xl font-bold">Araçlar</h1>
      </div>
      <p className="text-ax-dim text-sm">Sistem yönetim araçları ve kısayollar.</p>

      <div className="grid gap-3">
        {TOOLS.map(tool => {
          const Icon = tool.icon
          const st = status[tool.id]
          return (
            <div key={tool.id} className="flex items-center gap-4 p-4 rounded-xl bg-ax-panel border border-ax-border">
              <div className="p-2 rounded-lg bg-ax-muted">
                <Icon size={16} className="text-ax-amber" />
              </div>
              <div className="flex-1">
                <p className="text-ax-heading text-sm font-medium">{tool.label}</p>
                <p className="text-ax-dim text-xs">{tool.desc}</p>
              </div>
              <button
                onClick={() => runAction(tool.id, tool.action)}
                disabled={st === 'running'}
                className="px-3 py-1.5 rounded-lg bg-ax-accent/15 border border-ax-accent/30 text-ax-accent text-xs font-medium hover:bg-ax-accent/25 transition-colors disabled:opacity-50"
              >
                {st === 'running' ? <Loader2 size={12} className="animate-spin" />
                  : st === 'done' ? <CheckCircle2 size={12} className="text-ax-green" />
                  : 'Çalıştır'}
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
