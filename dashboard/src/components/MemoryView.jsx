import { useState, useEffect } from 'react'
import { BrainCircuit, RefreshCw, FileText } from 'lucide-react'

export default function MemoryView() {
  const [memories, setMemories] = useState([])
  const [loading, setLoading] = useState(true)

  async function fetchMemories() {
    setLoading(true)
    try {
      const res = await fetch('/api/memory')
      if (res.ok) {
        const data = await res.json()
        setMemories(data.files || [])
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchMemories() }, [])

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-6xl">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BrainCircuit size={18} className="text-ax-purple" />
          <h1 className="text-ax-heading text-xl font-bold">Hafıza</h1>
        </div>
        <button onClick={fetchMemories} className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors">
          <RefreshCw size={14} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
      <p className="text-ax-dim text-sm">Kaydedilmiş hafıza dosyaları ve bağlam bilgileri.</p>

      <div className="grid gap-2">
        {memories.length === 0 && !loading && (
          <p className="text-ax-dim text-sm">Hafıza dosyası bulunamadı.</p>
        )}
        {memories.map((mem, i) => (
          <div key={i} className="p-3 rounded-xl bg-ax-panel border border-ax-border">
            <div className="flex items-center gap-2 mb-2">
              <FileText size={12} className="text-ax-purple" />
              <span className="text-ax-heading text-xs font-medium">{mem.name}</span>
              {mem.type && (
                <span className="px-1.5 py-0.5 rounded-md bg-ax-purple/15 border border-ax-purple/30 text-[10px] text-ax-purple">{mem.type}</span>
              )}
            </div>
            {mem.description && <p className="text-ax-dim text-xs">{mem.description}</p>}
            {mem.content && (
              <pre className="mt-2 text-ax-dim text-[11px] leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto font-mono bg-ax-surface rounded-lg p-2">
                {mem.content}
              </pre>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
