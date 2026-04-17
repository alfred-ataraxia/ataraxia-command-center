import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, AlertTriangle, RefreshCw, DollarSign, Activity, ShieldCheck, ShieldAlert } from 'lucide-react'

const DEFI_API = '/api/defi'
const REFRESH_INTERVAL = 60_000
const SCAN_STALE_MS = 20 * 60 * 1000

function formatUsd(value) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

function levelColor(level) {
  switch (level) {
    case 'CRITICAL': return 'text-ax-red bg-ax-red/10 border-ax-red/25'
    case 'WARN':     return 'text-ax-amber bg-ax-amber/10 border-ax-amber/25'
    case 'INFO':     return 'text-ax-cyan bg-ax-cyan/10 border-ax-cyan/25'
    default:         return 'text-ax-dim bg-ax-muted border-ax-border'
  }
}

function levelDot(level) {
  switch (level) {
    case 'CRITICAL': return 'bg-ax-red animate-pulse'
    case 'WARN':     return 'bg-ax-amber'
    case 'INFO':     return 'bg-ax-cyan'
    default:         return 'bg-ax-subtle'
  }
}

function StablecoinBadge({ symbol, price }) {
  const deviation = Math.abs(price - 1.0)
  const isWarn = deviation >= 0.005
  const isCrit = deviation >= 0.02
  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-mono ${
      isCrit ? 'bg-ax-red/10 border-ax-red/25 text-ax-red'
      : isWarn ? 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber'
      : 'bg-ax-green/5 border-ax-green/20 text-ax-green'
    }`}>
      <span className="font-bold text-[11px]">{symbol}</span>
      <span>${price.toFixed(4)}</span>
      {isCrit && <ShieldAlert size={11} />}
      {!isCrit && isWarn && <AlertTriangle size={11} />}
      {!isCrit && !isWarn && <ShieldCheck size={11} />}
    </div>
  )
}

function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

const CHAIN_BADGE = {
  ethereum: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  arbitrum: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  optimism: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  base:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  polygon:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Ethereum: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Arbitrum: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Optimism: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Base:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Polygon:  'bg-purple-500/10 text-purple-400 border-purple-500/20',
}

function PoolRow({ pool, rank }) {
  const apy = typeof pool.apy === 'number' ? pool.apy : 0
  const tvl = typeof pool.tvlUsd === 'number' ? pool.tvlUsd : 0
  const apyReward = typeof pool.apyReward === 'number' ? pool.apyReward : 0
  const apyColor = apy > 50 ? 'text-ax-amber' : apy > 15 ? 'text-ax-cyan' : 'text-ax-green'
  const chainStyle = CHAIN_BADGE[pool.chain] || 'bg-ax-muted text-ax-dim border-ax-border'
  const apyTier = apy >= 2000 ? 'crit' : apy >= 500 ? 'warn' : null
  
  // Link mantığı: Backend'den gelen poolMeta bir URL ise onu kullan, değilse DeFiLlama
  const isUrl = String(pool.poolMeta || '').startsWith('http')
  const externalUrl = isUrl ? pool.poolMeta : `https://defillama.com/yields/pool/${pool.poolId}`
  
  const hasReward = apyReward > 0.1
  const safetyScore = pool.extraData?.safetyScore || (pool.extraData?.risks ? 'Secure' : null)

  return (
    <div className="flex items-center gap-3 py-3 border-b border-ax-border/30 last:border-0">
      <span className="text-[10px] text-ax-subtle font-mono w-4 shrink-0 text-center">{rank}</span>

      <div className="flex-1 min-w-0">
        {/* Proje + Sembol */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-ax-heading">{pool.symbol || '—'}</span>
          <span className="text-[10px] text-ax-dim uppercase tracking-tighter">{pool.project || '—'}</span>
          {safetyScore && (
            <span className="text-[9px] px-1 bg-ax-green/10 text-ax-green rounded-sm border border-ax-green/20">
              {safetyScore}
            </span>
          )}
          {apyTier === 'crit' && (
            <span className="text-[9px] px-1 bg-ax-red/10 text-ax-red rounded-sm border border-ax-red/20">
              Çok yüksek APY
            </span>
          )}
          {apyTier === 'warn' && (
            <span className="text-[9px] px-1 bg-ax-amber/10 text-ax-amber rounded-sm border border-ax-amber/20">
              Yüksek APY
            </span>
          )}
        </div>
        {/* Chain + TVL + APY Detay */}
        <div className="flex items-center gap-2 flex-wrap">
          {pool.chain && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${chainStyle}`}>
              {pool.chain}
            </span>
          )}
          <span className="text-[10px] text-ax-dim">${(tvl / 1e6).toFixed(1)}M TVL</span>
          {hasReward && (
            <span className="text-[9px] text-ax-amber">+{apyReward.toFixed(1)}% ödül</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className={`text-sm font-black font-mono ${apyColor}`}>
          {apy.toFixed(1)}%
        </span>
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          title={isUrl ? "Uygulamaya Git" : "DeFiLlama'da doğrula"}
          className="text-ax-subtle hover:text-ax-accent transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

function PotentialPoolRow({ pool, rank }) {
  const dailyYieldPct = typeof pool.dailyYieldPct === 'number' ? pool.dailyYieldPct : 0
  const dailyYieldUsdOn1k = typeof pool.dailyYieldUsdOn1k === 'number' ? pool.dailyYieldUsdOn1k : 0
  const avgApy24h = typeof pool.avgApy24h === 'number' ? pool.avgApy24h : null
  const apyChange24h = typeof pool.apyChange24h === 'number' ? pool.apyChange24h : null
  const potentialScore = typeof pool.potentialScore === 'number' ? pool.potentialScore : null
  const warnAlerts24h = typeof pool.warnAlerts24h === 'number' ? pool.warnAlerts24h : 0
  const chainStyle = CHAIN_BADGE[pool.chain] || 'bg-ax-muted text-ax-dim border-ax-border'
  const isUrl = String(pool.poolMeta || '').startsWith('http')
  const externalUrl = isUrl ? pool.poolMeta : `https://defillama.com/yields/pool/${pool.poolId}`
  const isPositiveTrend = apyChange24h !== null && apyChange24h >= 0
  const scoreTone = potentialScore === null
    ? 'bg-ax-muted text-ax-dim border-ax-border'
    : potentialScore >= 120
      ? 'bg-ax-green/10 text-ax-green border-ax-green/25'
      : potentialScore >= 80
        ? 'bg-ax-cyan/10 text-ax-cyan border-ax-cyan/25'
        : 'bg-ax-amber/10 text-ax-amber border-ax-amber/25'

  return (
    <div className="flex items-center gap-3 py-3 border-b border-ax-border/30 last:border-0">
      <span className="text-[10px] text-ax-subtle font-mono w-4 shrink-0 text-center">{rank}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-ax-heading">{pool.symbol || '—'}</span>
          <span className="text-[10px] text-ax-dim uppercase tracking-tighter">{pool.project || '—'}</span>
          {pool.chain && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${chainStyle}`}>
              {pool.chain}
            </span>
          )}
          {potentialScore !== null && (
            <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${scoreTone}`}>
              Skor {potentialScore.toFixed(1)}
            </span>
          )}
          {warnAlerts24h > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[9px] font-bold border bg-ax-amber/10 text-ax-amber border-ax-amber/25">
              {warnAlerts24h} WARN (24s)
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-ax-dim">
          <span>Günlük: %{dailyYieldPct.toFixed(4)}</span>
          <span>${dailyYieldUsdOn1k.toFixed(3)} / 1k</span>
          {avgApy24h !== null && <span>24s ort APY: %{avgApy24h.toFixed(2)}</span>}
          {apyChange24h !== null && (
            <span className={isPositiveTrend ? 'text-ax-green' : 'text-ax-red'}>
              24s APY {isPositiveTrend ? '+' : ''}{apyChange24h.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <span className="text-sm font-black font-mono text-ax-cyan">
          ${dailyYieldUsdOn1k.toFixed(2)}
        </span>
        <a
          href={externalUrl}
          target="_blank"
          rel="noreferrer"
          title={isUrl ? "Uygulamaya Git" : "DeFiLlama'da doğrula"}
          className="text-ax-subtle hover:text-ax-accent transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6"/>
            <polyline points="15 3 21 3 21 9"/>
            <line x1="10" y1="14" x2="21" y2="3"/>
          </svg>
        </a>
      </div>
    </div>
  )
}

export default function DefiView() {
  const [pools, setPools] = useState([])
  const [potentialPools, setPotentialPools] = useState([])
  const [autopilot, setAutopilot] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [stablecoins, setStablecoins] = useState([])
  const [health, setHealth] = useState(null)
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dataTimestamp, setDataTimestamp] = useState(null)
  const [stableTimestamp, setStableTimestamp] = useState(null)
  const [error, setError] = useState(null)

  const fetchAll = useCallback(async () => {
    try {
      const [healthRes, poolsRes, potentialRes, autopilotRes, portfolioRes, alertsRes, stablesRes] = await Promise.allSettled([
        fetch(`${DEFI_API}/health`),
        fetch(`${DEFI_API}/pools/top?limit=15`),
        fetch(`${DEFI_API}/pools/potential?limit=8`),
        fetch(`${DEFI_API}/autopilot/state`),
        fetch(`${DEFI_API}/portfolio?usd=1`),
        fetch(`${DEFI_API}/alerts?limit=20`),
        fetch(`${DEFI_API}/stablecoins`),
      ])

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        setHealth(await healthRes.value.json())
        setError(null)
      } else {
        setError('DeFi APM servisi erişilemiyor (port 4180)')
      }

      if (poolsRes.status === 'fulfilled' && poolsRes.value.ok) {
        const d = await poolsRes.value.json()
        setPools(d.pools || [])
        setDataTimestamp(d.timestamp || null)
      }

      if (potentialRes.status === 'fulfilled' && potentialRes.value.ok) {
        const d = await potentialRes.value.json()
        setPotentialPools(d.pools || [])
        if (!dataTimestamp) {
          setDataTimestamp(d.timestamp || null)
        }
      }

      if (autopilotRes.status === 'fulfilled' && autopilotRes.value.ok) {
        const d = await autopilotRes.value.json()
        setAutopilot(d)
      }

      if (portfolioRes.status === 'fulfilled' && portfolioRes.value.ok) {
        const d = await portfolioRes.value.json()
        setPortfolio(d)
      }

      if (alertsRes.status === 'fulfilled' && alertsRes.value.ok) {
        const d = await alertsRes.value.json()
        setAlerts(d.alerts || [])
      }

      if (stablesRes.status === 'fulfilled' && stablesRes.value.ok) {
        const d = await stablesRes.value.json()
        // Her sembolün son fiyatını al
        const latest = {}
        for (const p of (d.prices || [])) {
          if (!latest[p.symbol] || p.timestamp > latest[p.symbol].timestamp) {
            latest[p.symbol] = p
          }
        }
        setStablecoins(Object.values(latest))
        setStableTimestamp(d.timestamp || null)
      }

      setLastUpdated(new Date())
    } catch (err) {
      setError('Veri alınamadı: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, REFRESH_INTERVAL)
    return () => clearInterval(t)
  }, [fetchAll])

  const criticalAlerts = alerts.filter(a => a.level === 'CRITICAL')
  const warnAlerts = alerts.filter(a => a.level === 'WARN')
  const recentAlerts = alerts.slice(0, 8)
  const isDataStale = dataTimestamp ? (Date.now() - dataTimestamp > SCAN_STALE_MS) : false
  const apCfg = autopilot?.config
  const currentVault = autopilot?.state?.current_vault_id || ''
  const proposedVault = autopilot?.state?.proposed_vault_id || ''
  const shownVault = currentVault || proposedVault || '—'
  const lastAp = autopilot?.latestAction
  const lastReason = lastAp?.details?.reason || lastAp?.details?.decision?.reason || null
  const portfolioUsd = typeof portfolio?.totalBalanceUsd === 'number' ? portfolio.totalBalanceUsd : null
  const ethUsd = typeof portfolio?.ethUsdPrice === 'number' ? portfolio.ethUsdPrice : null

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center gap-3 text-ax-dim">
          <div className="w-5 h-5 border-2 border-ax-accent border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">DeFi APM yükleniyor...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-4 max-w-4xl mx-auto">

      {/* Başlık + Durum */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ax-accent/10 border border-ax-accent/25 flex items-center justify-center text-3xl">
              📈
            </div>
            <div>
              <h2 className="text-xl font-black text-ax-heading italic">DeFi APM</h2>
              <p className="text-xs text-ax-dim font-medium">Gözcü Modu — Faz 1</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-ax-red/10 border border-ax-red/25">
                <div className="w-2 h-2 rounded-full bg-ax-red" />
                <span className="text-ax-red text-xs font-bold">Kapalı</span>
              </div>
            ) : (
              <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${
                isDataStale
                  ? 'bg-ax-amber/10 border-ax-amber/25'
                  : 'bg-ax-green/10 border-ax-green/25'
              }`}>
                <div className={`w-2 h-2 rounded-full ${isDataStale ? 'bg-ax-amber' : 'bg-ax-green animate-pulse'}`} />
                <span className={`${isDataStale ? 'text-ax-amber' : 'text-ax-green'} text-xs font-bold`}>
                  {isDataStale ? 'Veri Bayat' : 'Çevrimiçi'}
                </span>
              </div>
            )}
            <button
              onClick={fetchAll}
              className="p-2 rounded-xl hover:bg-ax-muted transition-colors text-ax-dim"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-ax-red/5 border border-ax-red/20 text-xs text-ax-red">
            {error}
          </div>
        )}

        {/* Özet İstatistikler */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
          <div className="p-3 rounded-xl bg-ax-surface border border-ax-border text-center">
            <div className="text-lg font-black text-ax-cyan font-mono">{pools.length}</div>
            <div className="text-[10px] text-ax-dim uppercase tracking-wider mt-0.5">Havuz</div>
          </div>
          <div className={`p-3 rounded-xl border text-center ${criticalAlerts.length > 0 ? 'bg-ax-red/5 border-ax-red/20' : 'bg-ax-surface border-ax-border'}`}>
            <div className={`text-lg font-black font-mono ${criticalAlerts.length > 0 ? 'text-ax-red' : 'text-ax-green'}`}>
              {criticalAlerts.length}
            </div>
            <div className="text-[10px] text-ax-dim uppercase tracking-wider mt-0.5">Kritik</div>
          </div>
          <div className={`p-3 rounded-xl border text-center ${warnAlerts.length > 0 ? 'bg-ax-amber/5 border-ax-amber/20' : 'bg-ax-surface border-ax-border'}`}>
            <div className={`text-lg font-black font-mono ${warnAlerts.length > 0 ? 'text-ax-amber' : 'text-ax-text'}`}>
              {warnAlerts.length}
            </div>
            <div className="text-[10px] text-ax-dim uppercase tracking-wider mt-0.5">Uyarı</div>
          </div>
          <div className={`p-3 rounded-xl border text-center ${
            portfolio && portfolio.canRead ? 'bg-ax-green/5 border-ax-green/15' : 'bg-ax-surface border-ax-border'
          }`}>
            <div className={`text-lg font-black font-mono ${portfolio && portfolio.canRead ? 'text-ax-green' : 'text-ax-dim'}`}>
              {portfolio && portfolio.canRead ? formatUsd(portfolioUsd) : '—'}
            </div>
            <div className="text-[10px] text-ax-dim uppercase tracking-wider mt-0.5">Portföy</div>
          </div>
        </div>

        <div className="mt-3 flex items-center justify-between gap-3 text-[10px] text-ax-subtle">
          <span>Veri zamanı: {formatTime(dataTimestamp)}</span>
          <span>İstek: {formatTime(lastUpdated)}</span>
        </div>

        {autopilot && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
            <span className="px-2 py-1 rounded-full border bg-ax-surface border-ax-border text-ax-dim font-mono">
              Autopilot: {apCfg?.enabled ? 'ON' : 'OFF'}
            </span>
            <span className={`px-2 py-1 rounded-full border font-mono ${
              apCfg?.execute && !apCfg?.simulateOnly
                ? 'bg-ax-red/10 border-ax-red/25 text-ax-red'
                : 'bg-ax-green/10 border-ax-green/25 text-ax-green'
            }`}>
              Execute: {apCfg?.execute && !apCfg?.simulateOnly ? 'LIVE' : 'SIM'}
            </span>
            <span className="px-2 py-1 rounded-full border bg-ax-surface border-ax-border text-ax-dim font-mono">
              Vault: {shownVault}
            </span>
            {lastAp && (
              <span className={`px-2 py-1 rounded-full border font-mono ${
                lastAp.status === 'FAILED'
                  ? 'bg-ax-red/10 border-ax-red/25 text-ax-red'
                  : lastAp.status === 'EXECUTED'
                    ? 'bg-ax-green/10 border-ax-green/25 text-ax-green'
                    : 'bg-ax-surface border-ax-border text-ax-dim'
              }`}>
                Last: {lastAp.status}/{lastAp.action}{lastReason ? ` (${lastReason})` : ''}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Portföy (USD valuation) */}
      {portfolio && (
        <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-ax-cyan" />
            <h2 className="text-ax-heading text-sm font-bold">Portföy (Base)</h2>
            <span className="ml-auto text-[10px] text-ax-dim font-mono">
              {ethUsd ? `ETH $${ethUsd.toFixed(0)}` : 'ETH $—'}
            </span>
          </div>

          {!portfolio.canRead ? (
            <div className="p-3 rounded-xl bg-ax-surface border border-ax-border text-xs text-ax-dim">
              Cüzdan okunamadı. Read-only için AUTOPILOT_ADDRESS tanımla.
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-ax-surface border border-ax-border">
                  <div className="text-[10px] text-ax-dim uppercase tracking-wider">Toplam</div>
                  <div className="text-lg font-black font-mono text-ax-heading">
                    {formatUsd(portfolioUsd)}
                  </div>
                  <div className="text-[10px] text-ax-dim font-mono">
                    {portfolio.totalBalanceEth ?? '—'} ETH
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-ax-surface border border-ax-border">
                  <div className="text-[10px] text-ax-dim uppercase tracking-wider">Cüzdan</div>
                  <div className="text-[11px] text-ax-heading font-mono truncate">{portfolio.address}</div>
                  <div className="text-[10px] text-ax-dim font-mono">
                    ETH: {portfolio.ethBalance ?? '—'} · WETH: {portfolio.wethBalance ?? '—'}
                  </div>
                </div>
              </div>

              {Array.isArray(portfolio.vaultPositions) && portfolio.vaultPositions.length > 0 ? (
                <div className="rounded-xl bg-ax-surface border border-ax-border overflow-hidden">
                  <div className="px-3 py-2 border-b border-ax-border/50 text-[10px] text-ax-dim uppercase tracking-wider">
                    Vault Pozisyonları
                  </div>
                  <div className="divide-y divide-ax-border/30">
                    {portfolio.vaultPositions.slice(0, 6).map((p, idx) => (
                      <div key={p.vaultId || idx} className="flex items-center gap-3 px-3 py-2.5">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-bold text-ax-heading truncate">
                            {p.symbol || p.vaultId || 'Vault'}
                          </div>
                          <div className="text-[10px] text-ax-dim font-mono truncate">
                            {p.underlyingBalance ?? p.shareBalance ?? '—'} {p.underlyingSymbol ?? 'WETH'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-xs font-black font-mono text-ax-cyan">
                            {typeof p.usdValue === 'number' ? formatUsd(p.usdValue) : '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-ax-surface border border-ax-border text-xs text-ax-dim">
                  Aktif vault pozisyonu yok.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stablecoin Peg Durumu */}
      {stablecoins.length > 0 && (
        <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign size={16} className="text-ax-green" />
            <h2 className="text-ax-heading text-sm font-bold">Stablecoin Peg</h2>
            <span className="ml-auto text-[10px] text-ax-dim">Kaynak: {formatTime(stableTimestamp)}</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {stablecoins.map(sc => (
              <StablecoinBadge key={sc.symbol} symbol={sc.symbol} price={sc.price} />
            ))}
          </div>
        </div>
      )}

      {/* En İyi Havuzlar */}
      {pools.length > 0 && (
        <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-ax-cyan" />
            <h2 className="text-ax-heading text-sm font-bold">En İyi Havuzlar</h2>
            <span className="ml-auto text-[10px] text-ax-dim">(APY sırası)</span>
          </div>
          <div>
            {pools.slice(0, 10).map((pool, i) => (
              <PoolRow key={pool.poolId || pool.id || i} pool={pool} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Günlük Getiri Potansiyeli */}
      {potentialPools.length > 0 && (
        <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-ax-green" />
            <h2 className="text-ax-heading text-sm font-bold">Günlük Getiri Potansiyeli</h2>
            <span className="ml-auto text-[10px] text-ax-dim">($1000 bazında günlük)</span>
          </div>
          <div>
            {potentialPools.slice(0, 8).map((pool, i) => (
              <PotentialPoolRow key={`potential-${pool.poolId || pool.id || i}`} pool={pool} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Risk Alertleri */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-ax-amber" />
          <h2 className="text-ax-heading text-sm font-bold">Risk Alertleri</h2>
          <span className="ml-auto text-[10px] text-ax-dim">{alerts.length} toplam</span>
        </div>

        {recentAlerts.length > 0 ? (
          <div className="space-y-2">
            {recentAlerts.map((alert, i) => (
              <div key={alert.id || i} className={`flex items-start gap-3 p-3 rounded-xl border ${levelColor(alert.level)}`}>
                <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${levelDot(alert.level)}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">{alert.level}</span>
                    <span className="text-[10px] opacity-50">{alert.type}</span>
                  </div>
                  <p className="text-xs leading-relaxed">{alert.message}</p>
                </div>
                <span className="text-[9px] opacity-50 whitespace-nowrap shrink-0">
                  {new Date(alert.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-ax-dim text-xs">
            <ShieldCheck size={24} className="mx-auto mb-2 text-ax-green opacity-50" />
            Aktif alert yok — sistem izleniyor
          </div>
        )}
      </div>

    </div>
  )
}
