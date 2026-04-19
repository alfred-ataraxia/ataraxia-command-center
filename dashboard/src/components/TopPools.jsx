import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, ExternalLink, ChevronUp, ChevronDown, Filter, ChevronRight, Star, TrendingUp, Zap, Eye } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const DEFI_API = '/api/defi'
const REFRESH_INTERVAL = 60_000

const TABS = [
  { id: 'top',       label: 'Top APY',   icon: TrendingUp, endpoint: 'pools/top' },
  { id: 'potential', label: 'Potansiyel', icon: Zap,        endpoint: 'pools/potential' },
  { id: 'watchlist', label: 'Watchlist', icon: Eye,         endpoint: null },
]

const CHAINS = [
  { id: 'all',      label: 'Tümü' },
  { id: 'ethereum', label: 'ETH' },
  { id: 'arbitrum', label: 'ARB' },
  { id: 'optimism', label: 'OP' },
  { id: 'base',     label: 'Base' },
  { id: 'polygon',  label: 'MATIC' },
]

const CHAIN_STYLE = {
  ethereum: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  arbitrum: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  optimism: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  base:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  polygon:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

const STATUS_STYLE = {
  NEW:      'bg-ax-cyan/10 text-ax-cyan border-ax-cyan/20',
  WATCHING: 'bg-ax-green/10 text-ax-green border-ax-green/20',
  EXITED:   'bg-ax-dim/10 text-ax-dim border-ax-border',
  SKIPPED:  'bg-ax-red/10 text-ax-red border-ax-red/20',
}

function formatUsd(v) {
  if (v == null || !Number.isFinite(v)) return '—'
  if (v >= 1e9) return `$${(v / 1e9).toFixed(1)}B`
  if (v >= 1e6) return `$${(v / 1e6).toFixed(1)}M`
  if (v >= 1e3) return `$${(v / 1e3).toFixed(0)}K`
  return `$${v.toFixed(0)}`
}

function formatTime(ts) {
  if (!ts) return '—'
  return new Date(ts).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

function apyColor(apy) {
  if (apy >= 100) return 'text-ax-amber'
  if (apy >= 20)  return 'text-ax-cyan'
  return 'text-ax-green'
}

function RiskBadge({ label }) {
  return (
    <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-ax-red/10 text-ax-red border border-ax-red/20">
      {label}
    </span>
  )
}

function PoolDetail({ pool }) {
  const risks = pool.extraData?.risks || {}
  const riskFlags = [
    risks.complex       && 'Karmaşık',
    risks.notAudited    && 'Denetimsiz',
    risks.notTimelocked && 'Timelock yok',
    risks.synthAsset    && 'Sentetik',
    risks.notCorrelated && 'Korelasyonsuz',
  ].filter(Boolean)

  const isUrl = String(pool.poolMeta || '').startsWith('http')
  const externalUrl = isUrl
    ? pool.poolMeta
    : pool.extraData?.url || `https://defillama.com/yields/pool/${pool.poolId}`

  return (
    <div className="px-10 pb-3 pt-1 border-b border-ax-border/30 bg-ax-surface/30">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
        {pool.apyBase != null && (
          <div>
            <p className="text-[9px] text-ax-dim uppercase tracking-wider mb-0.5">APY Baz</p>
            <p className="text-xs font-mono font-bold text-ax-green">{pool.apyBase.toFixed(1)}%</p>
          </div>
        )}
        {pool.apyReward != null && pool.apyReward > 0 && (
          <div>
            <p className="text-[9px] text-ax-dim uppercase tracking-wider mb-0.5">Ödül</p>
            <p className="text-xs font-mono font-bold text-ax-amber">{pool.apyReward.toFixed(1)}%</p>
          </div>
        )}
        {pool.avgApy24h != null && (
          <div>
            <p className="text-[9px] text-ax-dim uppercase tracking-wider mb-0.5">Ort. 24s APY</p>
            <p className="text-xs font-mono font-bold text-ax-cyan">{pool.avgApy24h.toFixed(1)}%</p>
          </div>
        )}
        {pool.dailyYieldUsdOn1k != null && (
          <div>
            <p className="text-[9px] text-ax-dim uppercase tracking-wider mb-0.5">$1K/gün</p>
            <p className="text-xs font-mono font-bold text-ax-text">${pool.dailyYieldUsdOn1k.toFixed(2)}</p>
          </div>
        )}
        {pool.potentialScore != null && (
          <div>
            <p className="text-[9px] text-ax-dim uppercase tracking-wider mb-0.5">Potansiyel</p>
            <p className="text-xs font-mono font-bold text-ax-accent">{pool.potentialScore.toFixed(0)}</p>
          </div>
        )}
        {pool.discoveryScore != null && (
          <div>
            <p className="text-[9px] text-ax-dim uppercase tracking-wider mb-0.5">Keşif Skoru</p>
            <p className="text-xs font-mono font-bold text-ax-accent">{pool.discoveryScore}</p>
          </div>
        )}
      </div>

      {riskFlags.length > 0 && (
        <div className="flex gap-1.5 flex-wrap mb-2">
          {riskFlags.map(r => <RiskBadge key={r} label={r} />)}
        </div>
      )}

      {pool.extraData?.assets?.length > 0 && (
        <p className="text-[10px] text-ax-dim mb-2">
          Varlıklar: {pool.extraData.assets.join(' · ')}
        </p>
      )}

      <a
        href={externalUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-[10px] text-ax-accent hover:underline"
      >
        <ExternalLink size={10} />
        {pool.extraData?.url ? 'Beefy Finance' : 'DeFiLlama'}
      </a>
    </div>
  )
}

function PoolRow({ pool, rank, tab }) {
  const [expanded, setExpanded] = useState(false)
  const apy    = typeof pool.apy === 'number' ? pool.apy : 0
  const tvl    = typeof pool.tvlUsd === 'number' ? pool.tvlUsd : 0
  const chain  = String(pool.chain || '').toLowerCase()
  const chainStyle = CHAIN_STYLE[chain] || 'bg-ax-muted text-ax-dim border-ax-border'
  const symbol = pool.symbol || pool.name || '—'
  const project = pool.project || pool.platformId || '—'

  return (
    <>
      <div
        className="flex items-center gap-3 py-3 border-b border-ax-border/30 last:border-0 hover:bg-ax-panel/50 transition-colors rounded-lg px-2 -mx-2 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <ChevronRight
          size={12}
          className={`text-ax-subtle shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`}
        />
        <span className="text-[11px] text-ax-subtle font-mono w-5 shrink-0 text-center">{rank}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold text-ax-heading">{symbol}</span>
            <span className="text-[10px] text-ax-dim">{project}</span>
            {chain && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${chainStyle}`}>
                {pool.chain}
              </span>
            )}
            {pool.status && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${STATUS_STYLE[pool.status] || 'bg-ax-muted text-ax-dim border-ax-border'}`}>
                {pool.status}
              </span>
            )}
          </div>
          <div className="text-[10px] text-ax-dim">TVL {formatUsd(tvl)}</div>
        </div>

        <div className="text-right shrink-0 w-20">
          <div className={`text-sm font-black font-mono ${apyColor(apy)}`}>
            {apy.toFixed(1)}%
          </div>
          <div className="text-[9px] text-ax-subtle">APY</div>
        </div>
      </div>

      {expanded && <PoolDetail pool={pool} tab={tab} />}
    </>
  )
}

function WatchlistRow({ pool, rank }) {
  const [expanded, setExpanded] = useState(false)
  const apy   = typeof pool.apy === 'number' ? pool.apy : 0
  const tvl   = typeof pool.tvlUsd === 'number' ? pool.tvlUsd : 0
  const chain = String(pool.chain || '').toLowerCase()
  const chainStyle = CHAIN_STYLE[chain] || 'bg-ax-muted text-ax-dim border-ax-border'

  return (
    <>
      <div
        className="flex items-center gap-3 py-3 border-b border-ax-border/30 last:border-0 hover:bg-ax-panel/50 transition-colors rounded-lg px-2 -mx-2 cursor-pointer"
        onClick={() => setExpanded(e => !e)}
      >
        <ChevronRight size={12} className={`text-ax-subtle shrink-0 transition-transform ${expanded ? 'rotate-90' : ''}`} />
        <span className="text-[11px] text-ax-subtle font-mono w-5 shrink-0 text-center">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <span className="text-xs font-bold text-ax-heading">{pool.symbol || pool.name || '—'}</span>
            <span className="text-[10px] text-ax-dim">{pool.platformId || '—'}</span>
            {chain && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${chainStyle}`}>
                {pool.chain}
              </span>
            )}
            {pool.status && (
              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${STATUS_STYLE[pool.status] || 'bg-ax-muted text-ax-dim border-ax-border'}`}>
                {pool.status}
              </span>
            )}
          </div>
          <div className="text-[10px] text-ax-dim">TVL {formatUsd(tvl)} · Skor: {pool.discoveryScore ?? '—'}</div>
        </div>
        <div className="text-right shrink-0 w-20">
          <div className={`text-sm font-black font-mono ${apyColor(apy)}`}>{apy.toFixed(1)}%</div>
          <div className="text-[9px] text-ax-subtle">APY</div>
        </div>
      </div>

      {expanded && (
        <div className="px-10 pb-3 pt-1 border-b border-ax-border/30 bg-ax-surface/30">
          {pool.scoreBreakdown && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
              {Object.entries(pool.scoreBreakdown).map(([k, v]) => (
                <div key={k}>
                  <p className="text-[9px] text-ax-dim capitalize">{k.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-xs font-mono font-bold text-ax-accent">{v}</p>
                </div>
              ))}
            </div>
          )}
          {pool.assets?.length > 0 && (
            <p className="text-[10px] text-ax-dim">Varlıklar: {pool.assets.join(' · ')}</p>
          )}
        </div>
      )}
    </>
  )
}

export default function TopPools() {
  const [tab, setTab]           = useState('top')
  const [chain, setChain]       = useState('all')
  const [sortField, setSortField] = useState('apy')
  const [sortDir, setSortDir]   = useState('desc')
  const [pools, setPools]       = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dataTimestamp, setDataTimestamp] = useState(null)

  const activeTab = TABS.find(t => t.id === tab)

  const fetchPools = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      let data
      if (tab === 'watchlist') {
        const res = await apiFetch(`${DEFI_API}/watchlist?limit=50`)
        if (!res.ok) throw new Error(`API hatası: ${res.status}`)
        data = await res.json()
        setPools(data.pools || [])
        setDataTimestamp(data.timestamp || null)
      } else {
        const params = new URLSearchParams({ limit: '100' })
        if (chain !== 'all') params.set('chain', chain)
        const res = await apiFetch(`${DEFI_API}/${activeTab.endpoint}?${params}`)
        if (!res.ok) throw new Error(`API hatası: ${res.status}`)
        data = await res.json()
        setPools(data.pools || [])
        setDataTimestamp(data.timestamp || null)
      }
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [tab, chain, activeTab])

  useEffect(() => {
    fetchPools()
    const t = setInterval(fetchPools, REFRESH_INTERVAL)
    return () => clearInterval(t)
  }, [fetchPools])

  const sortedPools = [...pools].sort((a, b) => {
    if (sortField === 'apy') return sortDir === 'asc' ? (a.apy ?? 0) - (b.apy ?? 0) : (b.apy ?? 0) - (a.apy ?? 0)
    if (sortField === 'tvl') return sortDir === 'asc' ? (a.tvlUsd ?? 0) - (b.tvlUsd ?? 0) : (b.tvlUsd ?? 0) - (a.tvlUsd ?? 0)
    if (sortField === 'score') return sortDir === 'asc' ? (a.discoveryScore ?? 0) - (b.discoveryScore ?? 0) : (b.discoveryScore ?? 0) - (a.discoveryScore ?? 0)
    const va = (a.symbol || a.name || '').toLowerCase()
    const vb = (b.symbol || b.name || '').toLowerCase()
    return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va)
  })

  function handleSort(field) {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortField(field); setSortDir('desc') }
  }

  function SortIcon({ field }) {
    if (sortField !== field) return <ChevronUp size={12} className="text-ax-subtle opacity-0 group-hover:opacity-50" />
    return sortDir === 'asc'
      ? <ChevronUp size={12} className="text-ax-accent" />
      : <ChevronDown size={12} className="text-ax-accent" />
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ax-accent/10 border border-ax-accent/20 flex items-center justify-center text-lg">
              🏦
            </div>
            <div>
              <h2 className="text-lg font-black text-ax-heading italic">DeFi Havuzları</h2>
              <p className="text-[11px] text-ax-dim">Beefy · APY izleme · {sortedPools.length} havuz</p>
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

        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-ax-surface rounded-xl border border-ax-border/50">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
                  tab === t.id
                    ? 'bg-ax-accent/10 text-ax-accent border border-ax-accent/20'
                    : 'text-ax-dim hover:text-ax-text'
                }`}
              >
                <Icon size={12} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Chain Filter (sadece watchlist dışında) */}
        {tab !== 'watchlist' && (
          <div className="flex items-center gap-2">
            <Filter size={12} className="text-ax-subtle shrink-0" />
            <div className="flex rounded-xl overflow-hidden border border-ax-border/50">
              {CHAINS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={`px-3 py-1.5 text-[11px] font-bold transition-colors ${
                    chain === c.id
                      ? 'bg-ax-accent/10 text-ax-accent'
                      : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted/30'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="rounded-xl bg-ax-red/5 border border-ax-red/20 p-4 text-xs text-ax-red">{error}</div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-3 text-[11px] text-ax-subtle flex-wrap">
        <span>{loading ? '...' : `${sortedPools.length} havuz`}</span>
        <span>·</span>
        <span>Veri: {formatTime(dataTimestamp)}</span>
        <span>·</span>
        <span>Güncellendi: {formatTime(lastUpdated)}</span>
      </div>

      {/* Table */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-ax-border/50 bg-ax-surface/50 text-[10px] text-ax-subtle uppercase tracking-wider font-bold">
          <span className="w-4" />
          <span className="w-5 text-center">#</span>
          <span className="flex-1">Havuz</span>
          {tab === 'watchlist' ? (
            <button onClick={() => handleSort('score')} className="group w-20 flex items-center justify-end gap-1 hover:text-ax-text transition-colors">
              Skor <SortIcon field="score" />
            </button>
          ) : (
            <button onClick={() => handleSort('tvl')} className="group w-20 flex items-center justify-end gap-1 hover:text-ax-text transition-colors">
              TVL <SortIcon field="tvl" />
            </button>
          )}
          <button onClick={() => handleSort('apy')} className="group w-20 flex items-center justify-end gap-1 hover:text-ax-text transition-colors">
            APY <SortIcon field="apy" />
          </button>
        </div>

        <div className="px-4 py-1">
          {loading && pools.length === 0 ? (
            <div className="flex items-center justify-center py-12 text-ax-dim text-sm">
              <div className="w-5 h-5 border-2 border-ax-accent border-t-transparent rounded-full animate-spin mr-3" />
              Yükleniyor...
            </div>
          ) : sortedPools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-ax-dim text-xs gap-2">
              <span>🦊</span>
              <span>Havuz bulunamadı</span>
            </div>
          ) : tab === 'watchlist' ? (
            sortedPools.map((pool, i) => (
              <WatchlistRow key={pool.vaultId || i} pool={pool} rank={i + 1} />
            ))
          ) : (
            sortedPools.map((pool, i) => (
              <PoolRow key={pool.poolId || i} pool={pool} rank={i + 1} tab={tab} />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
