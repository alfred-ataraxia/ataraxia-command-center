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
  ethereum: 'bg-ax-cyan/10 text-ax-cyan border-ax-cyan/20',
  arbitrum: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  optimism: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  base:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  polygon:  'bg-ax-purple/10 text-ax-purple border-ax-purple/20',
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
    <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-ax-red/10 text-ax-red border border-ax-red/20">
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
    <div className="px-10 pb-4 pt-2 border-b border-ax-border bg-ax-surface shadow-inner">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 mt-2">
        {pool.apyBase != null && (
          <div className="bg-ax-surface p-2.5 rounded-xl border border-ax-border">
            <p className="text-[11px] text-ax-dim uppercase tracking-widest mb-1 font-bold">APY Baz</p>
            <p className="text-xs font-mono font-black text-ax-green">{pool.apyBase.toFixed(1)}%</p>
          </div>
        )}
        {pool.apyReward != null && pool.apyReward > 0 && (
          <div className="bg-ax-surface p-2.5 rounded-xl border border-ax-border">
            <p className="text-[11px] text-ax-dim uppercase tracking-widest mb-1 font-bold">Ödül</p>
            <p className="text-xs font-mono font-black text-ax-amber">{pool.apyReward.toFixed(1)}%</p>
          </div>
        )}
        {pool.avgApy24h != null && (
          <div className="bg-ax-surface p-2.5 rounded-xl border border-ax-border">
            <p className="text-[11px] text-ax-dim uppercase tracking-widest mb-1 font-bold">Ort. 24s APY</p>
            <p className="text-xs font-mono font-black text-ax-cyan">{pool.avgApy24h.toFixed(1)}%</p>
          </div>
        )}
        {pool.dailyYieldUsdOn1k != null && (
          <div className="bg-ax-surface p-2.5 rounded-xl border border-ax-border">
            <p className="text-[11px] text-ax-dim uppercase tracking-widest mb-1 font-bold">$1K/gün</p>
            <p className="text-xs font-mono font-black text-ax-text">${pool.dailyYieldUsdOn1k.toFixed(2)}</p>
          </div>
        )}
        {pool.potentialScore != null && (
          <div className="bg-ax-surface p-2.5 rounded-xl border border-ax-border">
            <p className="text-[11px] text-ax-dim uppercase tracking-widest mb-1 font-bold">Potansiyel</p>
            <p className="text-xs font-mono font-black text-ax-accent">{pool.potentialScore.toFixed(0)}</p>
          </div>
        )}
        {pool.discoveryScore != null && (
          <div className="bg-ax-surface p-2.5 rounded-xl border border-ax-border">
            <p className="text-[11px] text-ax-dim uppercase tracking-widest mb-1 font-bold">Keşif Skoru</p>
            <p className="text-xs font-mono font-black text-ax-accent">{pool.discoveryScore}</p>
          </div>
        )}
      </div>

      {riskFlags.length > 0 && (
        <div className="flex gap-2 flex-wrap mb-3">
          {riskFlags.map(r => <RiskBadge key={r} label={r} />)}
        </div>
      )}

      {pool.extraData?.assets?.length > 0 && (
        <p className="text-[10px] text-ax-dim mb-3 font-mono bg-ax-surface px-2 py-1 inline-block rounded border border-ax-border">
          Varlıklar: <span className="text-ax-text">{pool.extraData.assets.join(' · ')}</span>
        </p>
      )}

      <div className="flex">
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-ax-accent hover:text-ax-heading transition-colors bg-ax-accent/10 hover:bg-ax-accent/20 border border-ax-accent/20 px-3 py-1.5 rounded-lg"
        >
          <ExternalLink size={12} />
          {pool.extraData?.url ? 'Beefy Finance' : 'DeFiLlama'}
        </a>
      </div>
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
        className={`flex items-center gap-4 py-3.5 px-6 border-b border-ax-border last:border-0 hover:bg-ax-muted transition-colors cursor-pointer ${expanded ? 'bg-ax-muted' : ''}`}
        onClick={() => setExpanded(e => !e)}
      >
        <ChevronRight
          size={14}
          className={`text-ax-subtle shrink-0 transition-transform duration-300 ${expanded ? 'rotate-90 text-ax-heading' : ''}`}
        />
        <span className="text-[11px] text-ax-subtle font-black font-mono w-6 shrink-0 text-center">{rank}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-sm font-black text-ax-heading">{symbol}</span>
            <span className="text-[10px] text-ax-dim font-mono">{project}</span>
            {chain && (
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-widest border ${chainStyle}`}>
                {pool.chain}
              </span>
            )}
            {pool.status && (
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-widest border ${STATUS_STYLE[pool.status] || 'bg-ax-surface text-ax-dim border-ax-border'}`}>
                {pool.status}
              </span>
            )}
          </div>
          <div className="text-[10px] text-ax-dim font-mono tracking-wider">TVL {formatUsd(tvl)}</div>
        </div>

        <div className="text-right shrink-0 w-20">
          <div className={`text-sm font-black font-mono ${apyColor(apy)}`}>
            {apy.toFixed(1)}%
          </div>
          <div className="text-[11px] text-ax-subtle">APY</div>
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
        className={`flex items-center gap-4 py-3.5 px-6 border-b border-ax-border last:border-0 hover:bg-ax-muted transition-colors cursor-pointer ${expanded ? 'bg-ax-muted' : ''}`}
        onClick={() => setExpanded(e => !e)}
      >
        <ChevronRight size={14} className={`text-ax-subtle shrink-0 transition-transform duration-300 ${expanded ? 'rotate-90 text-ax-heading' : ''}`} />
        <span className="text-[11px] text-ax-subtle font-black font-mono w-6 shrink-0 text-center">{rank}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-1 flex-wrap">
            <span className="text-sm font-black text-ax-heading">{pool.symbol || pool.name || '—'}</span>
            <span className="text-[10px] text-ax-dim font-mono">{pool.platformId || '—'}</span>
            {chain && (
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-widest border ${chainStyle}`}>
                {pool.chain}
              </span>
            )}
            {pool.status && (
              <span className={`px-2 py-0.5 rounded-lg text-[11px] font-black uppercase tracking-widest border ${STATUS_STYLE[pool.status] || 'bg-ax-surface text-ax-dim border-ax-border'}`}>
                {pool.status}
              </span>
            )}
          </div>
          <div className="text-[10px] text-ax-dim font-mono tracking-wider">TVL {formatUsd(tvl)} <span className="mx-1 opacity-50">·</span> Skor: {pool.discoveryScore ?? '—'}</div>
        </div>
        <div className="text-right shrink-0 w-20">
          <div className={`text-sm font-black font-mono ${apyColor(apy)}`}>{apy.toFixed(1)}%</div>
          <div className="text-[11px] text-ax-subtle">APY</div>
        </div>
      </div>

      {expanded && (
        <div className="px-10 pb-4 pt-2 border-b border-ax-border bg-ax-surface shadow-inner">
          {pool.scoreBreakdown && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-4 mb-3 mt-2">
              {Object.entries(pool.scoreBreakdown).map(([k, v]) => (
                <div key={k} className="bg-ax-surface p-2.5 rounded-xl border border-ax-border">
                  <p className="text-[11px] text-ax-dim capitalize uppercase tracking-widest mb-1 font-bold">{k.replace(/([A-Z])/g, ' $1')}</p>
                  <p className="text-xs font-mono font-black text-ax-accent">{v}</p>
                </div>
              ))}
            </div>
          )}
          {pool.assets?.length > 0 && (
            <p className="text-[10px] text-ax-dim font-mono bg-ax-surface px-2 py-1 inline-block rounded border border-ax-border">
              Varlıklar: <span className="text-ax-text">{pool.assets.join(' · ')}</span>
            </p>
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
    <div className="p-6 space-y-6 max-w-5xl mx-auto relative">
      {/* Background ambient glow */}
      <div className="fixed top-20 right-1/4 w-3/4 h-96 bg-ax-accent/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header */}
      <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ax-accent/10 border border-ax-accent/25 flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-500">
              🏦
            </div>
            <div>
              <h2 className="text-2xl font-black text-ax-heading uppercase tracking-widest">DeFi Havuzları</h2>
              <p className="text-[11px] text-ax-dim font-mono mt-1 bg-ax-surface px-2 py-0.5 rounded border border-ax-border inline-block">Beefy · APY izleme · {sortedPools.length} havuz</p>
            </div>
          </div>
          <button
            onClick={fetchPools}
            className="p-3 rounded-xl bg-ax-surface hover:bg-ax-muted text-ax-dim border border-ax-border hover:text-ax-heading transition-colors"
            title="Yenile"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-5 p-1.5 bg-ax-surface rounded-2xl border border-ax-border shadow-inner relative z-10 w-fit">
          {TABS.map(t => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center justify-center gap-2 py-2.5 px-5 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                  tab === t.id
                    ? 'bg-ax-accent/15 text-ax-accent border border-ax-accent/30'
                    : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted border border-transparent'
                }`}
              >
                <Icon size={14} />
                {t.label}
              </button>
            )
          })}
        </div>

        {/* Chain Filter (sadece watchlist dışında) */}
        {tab !== 'watchlist' && (
          <div className="flex items-center gap-3 relative z-10">
            <Filter size={14} className="text-ax-subtle shrink-0" />
            <div className="flex flex-wrap gap-1.5">
              {CHAINS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setChain(c.id)}
                  className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all duration-300 border ${
                    chain === c.id
                      ? 'bg-ax-accent/20 text-ax-accent border-ax-accent/30'
                      : 'bg-ax-surface text-ax-dim border-ax-border hover:text-ax-text hover:bg-ax-muted shadow-inner'
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
        <div className="rounded-2xl bg-ax-red/5 border border-ax-red/20 p-5 text-xs text-ax-red font-mono">{error}</div>
      )}

      {/* Stats Bar */}
      <div className="flex items-center gap-3 text-[10px] text-ax-subtle flex-wrap font-mono relative z-10 px-2">
        <span className="bg-ax-surface px-2 py-1 rounded border border-ax-border shadow-inner">{loading ? '...' : `${sortedPools.length} havuz`}</span>
        <span className="bg-ax-surface px-2 py-1 rounded border border-ax-border shadow-inner">Veri: {formatTime(dataTimestamp)}</span>
        <span className="bg-ax-surface px-2 py-1 rounded border border-ax-border shadow-inner">Güncellendi: {formatTime(lastUpdated)}</span>
      </div>

      {/* Table */}
      <div className="rounded-3xl ax-glass border border-ax-border overflow-hidden shadow-xl relative z-10">
        <div className="flex items-center gap-4 px-6 py-3 border-b border-ax-border bg-ax-muted text-[10px] text-ax-subtle uppercase tracking-widest font-black">
          <span className="w-5" />
          <span className="w-6 text-center">#</span>
          <span className="flex-1">Havuz Özeti</span>
          {tab === 'watchlist' ? (
            <button onClick={() => handleSort('score')} className="group w-24 flex items-center justify-end gap-1.5 hover:text-ax-heading transition-colors">
              Skor <SortIcon field="score" />
            </button>
          ) : (
            <button onClick={() => handleSort('tvl')} className="group w-24 flex items-center justify-end gap-1.5 hover:text-ax-heading transition-colors">
              TVL <SortIcon field="tvl" />
            </button>
          )}
          <button onClick={() => handleSort('apy')} className="group w-24 flex items-center justify-end gap-1.5 hover:text-ax-heading transition-colors">
            APY <SortIcon field="apy" />
          </button>
        </div>

        <div className="px-5 py-2 divide-y divide-white/5">
          {loading && pools.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-ax-dim text-xs font-black uppercase tracking-widest font-mono">
              <div className="w-6 h-6 border-2 border-ax-accent border-t-transparent rounded-full animate-spin mr-3" />
              Yükleniyor...
            </div>
          ) : sortedPools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-ax-dim text-[11px] font-black uppercase tracking-widest font-mono gap-3 opacity-50">
              <span className="text-3xl">🦊</span>
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
