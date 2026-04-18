import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, ChevronUp, ChevronDown, Filter } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const DEFI_API = '/api/defi'
const REFRESH_INTERVAL = 60_000

const CHAINS = [
  { id: 'all', label: 'Tüm Zincirler' },
  { id: 'ethereum', label: 'Ethereum' },
  { id: 'arbitrum', label: 'Arbitrum' },
  { id: 'optimism', label: 'Optimism' },
  { id: 'base', label: 'Base' },
  { id: 'polygon', label: 'Polygon' },
]

const SORT_OPTIONS = [
  { id: 'apy', label: 'APY' },
  { id: 'tvl', label: 'TVL' },
  { id: 'name', label: 'İsim' },
]

const CHAIN_STYLE = {
  ethereum:  'bg-blue-500/10 text-blue-400 border-blue-500/20',
  arbitrum:  'bg-sky-500/10 text-sky-400 border-sky-500/20',
  optimism:  'bg-rose-500/10 text-rose-400 border-rose-500/20',
  base:      'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  polygon:   'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

function formatUsd(value) {
  if (value == null || !Number.isFinite(value)) return '—'
  if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(1)}B`
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`
  return `$${value.toFixed(0)}`
}

function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function apyColor(apy) {
  if (apy >= 100) return 'text-ax-amber'
  if (apy >= 20) return 'text-ax-cyan'
  return 'text-ax-green'
}

function SortIcon({ field, sortField, sortDir }) {
  if (sortField !== field) return <ChevronUp size={12} className="text-ax-subtle opacity-0 group-hover:opacity-50" />
  return sortDir === 'asc'
    ? <ChevronUp size={12} className="text-ax-accent" />
    : <ChevronDown size={12} className="text-ax-accent" />
}

function PoolRow({ pool, rank }) {
  const apy = typeof pool.apy === 'number' ? pool.apy : 0
  const tvl = typeof pool.tvlUsd === 'number' ? pool.tvlUsd : 0
  const chainKey = String(pool.chain || '').toLowerCase()
  const chainStyle = CHAIN_STYLE[chainKey] || 'bg-ax-muted text-ax-dim border-ax-border'
  const isUrl = String(pool.poolMeta || '').startsWith('http')
  const externalUrl = isUrl
    ? pool.poolMeta
    : `https://defillama.com/yields/pool/${pool.poolId}`

  return (
    <div className="flex items-center gap-3 py-3 border-b border-ax-border/30 last:border-0 hover:bg-ax-panel/50 transition-colors rounded-lg px-2 -mx-2">
      {/* Rank */}
      <span className="text-[11px] text-ax-subtle font-mono w-6 shrink-0 text-center">{rank}</span>

      {/* Pool Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-ax-heading">{pool.symbol || '—'}</span>
          <span className="text-[10px] text-ax-dim uppercase tracking-tighter">{pool.project || '—'}</span>
          {chainKey && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${chainStyle}`}>
              {pool.chain}
            </span>
          )}
        </div>
        <div className="text-[10px] text-ax-dim">
          TVL {formatUsd(tvl)}
        </div>
      </div>

      {/* APY */}
      <div className="text-right shrink-0 w-20">
        <div className={`text-sm font-black font-mono ${apyColor(apy)}`}>
          {apy.toFixed(1)}%
        </div>
        <div className="text-[9px] text-ax-subtle">APY</div>
      </div>

      {/* Action */}
      <a
        href={externalUrl}
        target="_blank"
        rel="noreferrer"
        title="DeFiLlama'da aç"
        className="shrink-0 p-1.5 rounded-lg hover:bg-ax-muted/30 text-ax-subtle hover:text-ax-accent transition-colors"
      >
        <ExternalLink size={13} />
      </a>
    </div>
  )
}

export default function TopPools() {
  const [chain, setChain] = useState('all')
  const [sortField, setSortField] = useState('apy')
  const [sortDir, setSortDir] = useState('desc')
  const [pools, setPools] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dataTimestamp, setDataTimestamp] = useState(null)

  const fetchPools = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams({ limit: '100' })
      if (chain !== 'all') params.set('chain', chain)

      const res = await apiFetch(`${DEFI_API}/pools/top?${params}`)
      if (!res.ok) throw new Error(`API hatası: ${res.status}`)

      const data = await res.json()
      setPools(data.pools || [])
      setDataTimestamp(data.timestamp || null)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [chain])

  useEffect(() => {
    fetchPools()
  }, [fetchPools])

  // Sort pools client-side
  const sortedPools = [...pools].sort((a, b) => {
    let va, vb
    if (sortField === 'apy') {
      va = a.apy ?? 0
      vb = b.apy ?? 0
    } else if (sortField === 'tvl') {
      va = a.tvlUsd ?? 0
      vb = b.tvlUsd ?? 0
    } else if (sortField === 'name') {
      va = (a.symbol || '').toLowerCase()
      vb = (b.symbol || '').toLowerCase()
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
    }
    return sortDir === 'asc' ? va - vb : vb - va
  })

  function handleSort(field) {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('desc')
    }
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ax-accent/10 border border-ax-accent/20 flex items-center justify-center text-lg">
              🏆
            </div>
            <div>
              <h2 className="text-lg font-black text-ax-heading italic">Top Pools</h2>
              <p className="text-[11px] text-ax-dim">En iyi APY'li Beefy havuzları</p>
            </div>
          </div>
          <button
            onClick={fetchPools}
            className="p-2 rounded-xl bg-ax-muted/30 hover:bg-ax-muted text-ax-dim border border-ax-border/50 transition-colors"
            title="Yenile"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Filter Bar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Chain Filter */}
          <div className="flex items-center gap-2">
            <Filter size={13} className="text-ax-subtle" />
            <div className="flex rounded-xl overflow-hidden border border-ax-border/50">
              {CHAINS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    chain === c.id
                      ? 'bg-ax-accent/10 text-ax-accent border-x border-ax-accent/20 first:border-l-0 last:border-r-0'
                      : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted/30 border-x border-ax-border/50 first:border-l-0 last:border-r-0'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-ax-red/5 border border-ax-red/20 p-4 text-xs text-ax-red">
          {error}
        </div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-4 text-[11px] text-ax-subtle">
        <span>
          {loading ? '...' : `${sortedPools.length} havuz`}
        </span>
        <span>·</span>
        <span>
          {chain === 'all' ? 'Tüm zincirler' : CHAINS.find(c => c.id === chain)?.label}
        </span>
        <span>·</span>
        <span>Sıralama: {SORT_OPTIONS.find(s => s.id === sortField)?.label}</span>
        <span>·</span>
        <span>
          Veri: {formatTime(dataTimestamp)}
        </span>
        <span>·</span>
        <span>
          Güncellendi: {formatTime(lastUpdated)}
        </span>
      </div>

      {/* Sort Header */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-ax-border/50 bg-ax-surface/50 text-[10px] text-ax-subtle uppercase tracking-wider font-bold">
          <span className="w-6 text-center">#</span>
          <span className="flex-1">Havuz</span>
          <button
            onClick={() => handleSort('tvl')}
            className="group w-20 flex items-center justify-end gap-1 hover:text-ax-text transition-colors"
          >
            TVL
            <SortIcon field="tvl" sortField={sortField} sortDir={sortDir} />
          </button>
          <button
            onClick={() => handleSort('apy')}
            className="group w-20 flex items-center justify-end gap-1 hover:text-ax-text transition-colors"
          >
            APY
            <SortIcon field="apy" sortField={sortField} sortDir={sortDir} />
          </button>
          <span className="w-8" />
        </div>

        {/* Pool List */}
        <div className="px-4 py-1">
          {loading && pools.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-ax-dim text-sm">
              <div className="w-5 h-5 border-2 border-ax-accent border-t-transparent rounded-full animate-spin mr-3" />
              Yükleniyor...
            </div>
          ) : sortedPools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ax-dim text-xs gap-2">
              <span>🦊</span>
              <span>Bu zincirde havuz bulunamadı</span>
            </div>
          ) : (
            sortedPools.map((pool, i) => (
              <PoolRow key={pool.poolId || pool.id || i} pool={pool} rank={i + 1} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
