import { useState, useEffect, useCallback } from 'react'
import { BrainCircuit, RefreshCw, ChevronDown, ChevronRight } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const TYPE_STYLE = {
  feedback:  { label: 'Feedback',  cls: 'text-ax-amber  bg-ax-amber/10  border-ax-amber/30'  },
  project:   { label: 'Proje',     cls: 'text-ax-cyan   bg-ax-cyan/10   border-ax-cyan/30'   },
  user:      { label: 'Kullanıcı', cls: 'text-purple-400 bg-purple-400/10 border-purple-400/30' },
  reference: { label: 'Referans',  cls: 'text-ax-green  bg-ax-green/10  border-ax-green/30'  },
}

function MemoryCard({ mem }) {
  const [open, setOpen] = useState(false)
  const style = TYPE_STYLE[mem.type] || { label: mem.type || '—', cls: 'text-ax-dim bg-ax-muted border-ax-border' }

  return (
    <div className="rounded-xl bg-ax-panel border border-ax-border overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-ax-muted/40 transition-colors text-left"
      >
        {open ? <ChevronDown size={13} className="text-ax-dim shrink-0" /> : <ChevronRight size={13} className="text-ax-dim shrink-0" />}
        <div className="flex-1 min-w-0">
          <p className="text-ax-text text-sm font-medium truncate">{mem.name}</p>
          {mem.description && <p className="text-ax-dim text-xs mt-0.5 truncate">{mem.description}</p>}
        </div>
        {mem.type && (
          <span className={`shrink-0 px-2 py-0.5 rounded-md border text-[10px] font-medium ${style.cls}`}>
            {style.label}
          </span>
        )}
      </button>

      {open && mem.content && (
        <div className="border-t border-ax-border bg-ax-surface px-4 py-3">
          <pre className="text-ax-dim text-[11px] leading-relaxed whitespace-pre-wrap font-mono max-h-64 overflow-y-auto">
            {mem.content}
          </pre>
        </div>
      )}
    </div>
  )
}

export default function MemoryView() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchMemories = useCallback(async () => {
    setLoading(true)
    try {
      const res = await apiFetch('/api/memory')
      if (res.ok) {
        const data = await res.json()
        // MEMORY.md'yi sona at, diğerlerini type'a göre sırala
        const files = data.files || []
        const index = files.filter(f => f.name === 'MEMORY.md' || f.name?.toLowerCase().includes('memory.md'))
        const rest = files.filter(f => !index.includes(f))
        setMemories([...rest, ...index])
      }
    } catch {
      setMemories([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => {
      void fetchMemories()
    }, 0)
    return () => clearTimeout(timer)
  }, [fetchMemories])

  const byType = {}
  for (const m of memories) {
    const t = m.type || 'other'
    if (!byType[t]) byType[t] = []
    byType[t].push(m)
  }

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-purple-400" />
          <h1 className="text-ax-heading text-xl font-bold">Hafıza</h1>
          <span className="text-ax-dim text-sm">({memories.length} dosya)</span>
        </div>
        <button onClick={fetchMemories} className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors">
          <RefreshCw size={14} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading && memories.length === 0 && (
        <p className="text-ax-dim text-sm">Yükleniyor...</p>
      )}

      {Object.entries(byType).map(([type, items]) => {
        const style = TYPE_STYLE[type]
        return (
          <div key={type} className="space-y-2">
            {style && (
              <p className={`text-[10px] font-semibold uppercase tracking-wider px-1 ${style.cls.split(' ')[0]}`}>
                {style.label}
              </p>
            )}
            {items.map((mem, i) => <MemoryCard key={i} mem={mem} />)}
          </div>
        )
      })}
    </div>
  )
}
