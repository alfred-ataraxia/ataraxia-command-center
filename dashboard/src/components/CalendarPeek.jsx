import { useEffect, useState } from 'react'
import { CalendarDays, RefreshCw } from 'lucide-react'
import apiFetch from '../services/apiFetch'

export default function CalendarPeek() {
  const [items, setItems] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/calendar?days=2')
      const ct = (res.headers.get('content-type') || '').toLowerCase()
      if (!ct.includes('application/json')) {
        setError('API yaniti JSON degil (dashboard servisi restart gerekebilir)')
        setItems([])
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || 'Takvim okunamadı')
        setItems([])
        return
      }
      setItems(Array.isArray(data.items) ? data.items : [])
    } catch (e) {
      setError(e?.message || 'Ag hatasi')
      setItems([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
    const t = setInterval(load, 10 * 60_000)
    return () => clearInterval(t)
  }, [])

  return (
    <div className="rounded-xl ax-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-ax-cyan/10"><CalendarDays size={14} className="text-ax-cyan" /></div>
        <h2 className="text-xs font-bold uppercase text-ax-heading">Takvim</h2>
        <button onClick={load} className="ml-auto p-2 rounded-xl hover:bg-ax-muted transition-colors text-ax-dim hover:text-ax-accent" title="Yenile">
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      {error ? (
        <div className="text-xs text-ax-red font-mono">{error}</div>
      ) : loading && items.length === 0 ? (
        <div className="text-xs text-ax-dim font-mono">Yukleniyor...</div>
      ) : items.length === 0 ? (
        <div className="text-xs text-ax-dim font-mono">Etkinlik yok</div>
      ) : (
        <div className="space-y-2">
          {items.slice(0, 6).map((it, idx) => (
            <div key={idx} className="flex items-start gap-3">
              <span className="text-[10px] font-mono text-ax-subtle shrink-0 mt-0.5 w-16">{it.when}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ax-text truncate">{it.title}</p>
                {it.where && <p className="text-[10px] text-ax-dim truncate">{it.where}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
