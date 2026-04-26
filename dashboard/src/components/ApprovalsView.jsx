import { useState, useEffect, useCallback } from 'react'
import { CheckCircle2, XCircle, Clock, AlertTriangle, RefreshCw, ShieldCheck } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const RISK_STYLE = {
  low:      { badge: 'bg-ax-green/10 border-ax-green/30 text-ax-green',   label: 'Düşük' },
  medium:   { badge: 'bg-ax-amber/10 border-ax-amber/30 text-ax-amber',   label: 'Orta' },
  high:     { badge: 'bg-ax-red/10 border-ax-red/30 text-ax-red',         label: 'Yüksek' },
  critical: { badge: 'bg-purple-900/20 border-purple-500/30 text-purple-400', label: 'Kritik' },
}
const STATUS_STYLE = {
  pending:  { icon: Clock,        color: 'text-ax-amber', label: 'Bekliyor' },
  approved: { icon: CheckCircle2, color: 'text-ax-green', label: 'Onaylandı' },
  rejected: { icon: XCircle,      color: 'text-ax-red',   label: 'Reddedildi' },
}

function ApprovalCard({ item, onResolve }) {
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const risk = RISK_STYLE[item.risk] || RISK_STYLE.medium
  const stat = STATUS_STYLE[item.status] || STATUS_STYLE.pending
  const StatusIcon = stat.icon

  async function resolve(status) {
    setLoading(true)
    try {
      const res = await apiFetch(`/api/approvals/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, note })
      })
      if (res.ok) onResolve()
    } finally { setLoading(false) }
  }

  return (
    <div className={`rounded-xl bg-ax-panel border p-5 space-y-3 ${item.status === 'pending' ? 'border-ax-amber/30' : 'border-ax-border'}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <StatusIcon size={15} className={stat.color} />
          <span className="text-ax-heading font-semibold text-sm">{item.agent}</span>
          <span className={`px-1.5 py-0.5 rounded border text-[10px] font-medium ${risk.badge}`}>{risk.label}</span>
        </div>
        <span className="text-[10px] text-ax-subtle font-mono">{item.id}</span>
      </div>

      <p className="text-ax-text text-sm font-medium">{item.action}</p>
      {item.details && <p className="text-ax-dim text-xs leading-relaxed">{item.details}</p>}

      <div className="text-[10px] text-ax-subtle">
        {new Date(item.created_at).toLocaleString('tr-TR')}
        {item.resolved_at && ` · ${stat.label}: ${new Date(item.resolved_at).toLocaleString('tr-TR')}`}
        {item.note && ` · "${item.note}"`}
      </div>

      {item.status === 'pending' && (
        <div className="flex items-center gap-2 pt-1 border-t border-ax-border/50">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Not (opsiyonel)..."
            className="flex-1 px-2.5 py-1.5 rounded-lg bg-ax-surface border border-ax-border text-xs text-ax-text placeholder-ax-subtle focus:outline-none focus:border-ax-accent"
          />
          <button onClick={() => resolve('approved')} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ax-green/10 border border-ax-green/30 text-ax-green text-xs font-medium hover:bg-ax-green/20 transition-colors disabled:opacity-40">
            <CheckCircle2 size={12} /> Onayla
          </button>
          <button onClick={() => resolve('rejected')} disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ax-red/10 border border-ax-red/30 text-ax-red text-xs font-medium hover:bg-ax-red/20 transition-colors disabled:opacity-40">
            <XCircle size={12} /> Reddet
          </button>
        </div>
      )}
    </div>
  )
}

export default function ApprovalsView() {
  const [data, setData] = useState({ items: [], pending_count: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('pending')

  const fetch = useCallback(() => {
    setLoading(true)
    apiFetch('/api/approvals')
      .then(r => r.ok ? r.json() : null)
      .then(d => d?.data && setData(d.data))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => { fetch(); const t = setInterval(fetch, 30_000); return () => clearInterval(t) }, [fetch])

  const filtered = (data.items || []).filter(i => filter === 'all' || i.status === filter).reverse()

  return (
    <div className="p-4 sm:p-6 space-y-5 max-w-3xl">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-ax-heading text-xl font-bold tracking-tight">Onay Kuyruğu</h1>
            <p className="text-ax-dim text-sm mt-0.5">Ajan aksiyonları için insan onayı</p>
          </div>
          {data.pending_count > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-ax-amber/10 border border-ax-amber/30 text-ax-amber text-xs font-bold">
              {data.pending_count} bekliyor
            </span>
          )}
        </div>
        <button onClick={fetch} disabled={loading}
          className="p-1.5 rounded-lg hover:bg-ax-muted transition-colors text-ax-subtle hover:text-ax-text disabled:opacity-40">
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected', 'all'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors ${
              filter === f ? 'bg-ax-accent/10 border-ax-accent/30 text-ax-accent' : 'border-ax-border text-ax-dim hover:text-ax-text'
            }`}>
            {f === 'pending' ? 'Bekliyor' : f === 'approved' ? 'Onaylı' : f === 'rejected' ? 'Reddedildi' : 'Tümü'}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-ax-dim">
          <ShieldCheck size={32} className="text-ax-subtle" />
          <p className="text-sm">{filter === 'pending' ? 'Bekleyen onay yok' : 'Kayıt bulunamadı'}</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(item => <ApprovalCard key={item.id} item={item} onResolve={fetch} />)}
        </div>
      )}
    </div>
  )
}
