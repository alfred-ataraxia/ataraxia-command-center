import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, AlertTriangle, RefreshCw, DollarSign, Activity, ShieldCheck, ShieldAlert, Trophy } from 'lucide-react'
import apiFetch from '../services/apiFetch'
import TopPools from './TopPools'

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

function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('tr-TR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
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

function alphaDecisionTone(decision) {
  switch (String(decision || '').toUpperCase()) {
    case 'LIVE_ENTER': return 'bg-ax-red/10 text-ax-red border-ax-red/25'
    case 'PAPER_ENTER': return 'bg-ax-cyan/10 text-ax-cyan border-ax-cyan/25'
    case 'WATCH': return 'bg-ax-amber/10 text-ax-amber border-ax-amber/25'
    default: return 'bg-ax-surface text-ax-dim border-ax-border'
  }
}

function AlphaCandidateRow({ candidate, rank }) {
  const chainStyle = CHAIN_BADGE[candidate.chain] || 'bg-ax-muted text-ax-dim border-ax-border'
  const confidence = typeof candidate.confidence === 'number' ? candidate.confidence : 0
  const survivability = typeof candidate.survivabilityScore === 'number' ? candidate.survivabilityScore : 0
  const exitability = typeof candidate.exitabilityScore === 'number' ? candidate.exitabilityScore : 0
  const tvl = typeof candidate.tvlUsd === 'number' ? candidate.tvlUsd : 0
  const honeypot = typeof candidate.honeypotProbability === 'number' ? candidate.honeypotProbability : 0
  const eventBacked = candidate.eventBacked === true
  const sourceTone = eventBacked
    ? 'bg-ax-green/10 text-ax-green border-ax-green/25'
    : 'bg-ax-amber/10 text-ax-amber border-ax-amber/25'

  return (
    <div className="flex items-center gap-3 py-3 border-b border-ax-border/30 last:border-0">
      <span className="text-[10px] text-ax-subtle font-mono w-4 shrink-0 text-center">{rank}</span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className="text-xs font-bold text-ax-heading">{candidate.symbol || '—'}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${chainStyle}`}>
            {candidate.chain || '—'}
          </span>
          <span className="text-[10px] text-ax-dim uppercase tracking-tighter">{candidate.dex || '—'}</span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${sourceTone}`}>
            {eventBacked ? 'EVENT' : (candidate.discoverySource || 'SCAN').toUpperCase()}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-black border ${alphaDecisionTone(candidate.decision)}`}>
            {candidate.decision || 'IGNORE'}
          </span>
        </div>
        <div className="flex items-center gap-2 flex-wrap text-[10px] text-ax-dim">
          <span>TVL {formatUsdCompact(tvl)}</span>
          <span>APY %{Number(candidate.apy || 0).toFixed(2)}</span>
          <span>Survive {survivability}</span>
          <span>Exit {exitability}</span>
          <span>Confidence {confidence}</span>
          <span>Honey {(honeypot * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  )
}

function AlphaEventRow({ event, rank }) {
  const chainStyle = CHAIN_BADGE[event.chain] || 'bg-ax-muted text-ax-dim border-ax-border'
  const poolAddress = typeof event.poolAddress === 'string' ? event.poolAddress : ''
  const txHash = typeof event.txHash === 'string' ? event.txHash : ''

  return (
    <div className="flex items-center gap-3 py-3 border-b border-ax-border/30 last:border-0">
      <span className="text-[10px] text-ax-subtle font-mono w-4 shrink-0 text-center">{rank}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${chainStyle}`}>
            {event.chain || '—'}
          </span>
          <span className="text-xs font-bold text-ax-heading">{event.dex || '—'}</span>
          <span className="text-[10px] text-ax-dim uppercase tracking-tighter">{event.eventType || 'POOL_CREATED'}</span>
        </div>
        <div className="text-[10px] text-ax-dim font-mono truncate">
          pool {shortHash(poolAddress) || '—'} · tx {shortHash(txHash) || '—'} · {formatDateTime(event.detectedAt)}
        </div>
      </div>
    </div>
  )
}

function statusTone(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'FAILED') return 'bg-ax-red/10 border-ax-red/25 text-ax-red'
  if (s === 'EXECUTED') return 'bg-ax-green/10 border-ax-green/25 text-ax-green'
  if (s === 'APPROVED') return 'bg-ax-cyan/10 border-ax-cyan/25 text-ax-cyan'
  if (s === 'PROPOSED') return 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber'
  return 'bg-ax-surface border-ax-border text-ax-dim'
}

function shortHash(value) {
  if (!value || typeof value !== 'string') return null
  if (!value.startsWith('0x') || value.length < 12) return value
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

function formatUsdCompact(value) {
  if (value == null || !Number.isFinite(value)) return 'â€”'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency',
    currency: 'USD',
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

function summaryToneClass(tone) {
  if (tone === 'danger') return 'bg-ax-red/10 border-ax-red/25 text-ax-red'
  if (tone === 'warn') return 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber'
  if (tone === 'ok') return 'bg-ax-green/10 border-ax-green/25 text-ax-green'
  return 'bg-ax-cyan/10 border-ax-cyan/25 text-ax-cyan'
}

function buildSystemSummary({ error, isDataStale, criticalCount, warnCount, portfolioUsd, canReadPortfolio, currentVault, pendingApprovals, lastReason, potentialPoolsCount }) {
  if (error) {
    return {
      tone: 'danger',
      title: 'Servis veya veri akisinda sorun var',
      body: 'API erisimi veya arka plan taramasi dogrulanamiyor. Once servis sagligini kontrol et.',
    }
  }

  if (isDataStale) {
    return {
      tone: 'warn',
      title: 'Veri gecikiyor',
      body: 'Son tarama beklenenden eski. Tarama loopu veya servis yeniden kontrol edilmeli.',
    }
  }

  if (criticalCount > 0) {
    return {
      tone: 'warn',
      title: 'Sistem calisiyor ama risk baskisi var',
      body: `${criticalCount} kritik ve ${warnCount} uyari var. Autopilot'tan once risk tarafina bakmak daha dogru olur.`,
    }
  }

  if (!currentVault && canReadPortfolio && (portfolioUsd ?? 0) > 0 && pendingApprovals === 0 && lastReason === 'no_candidates') {
    return {
      tone: 'info',
      title: 'Sistem izliyor ama uygun aday bulamiyor',
      body: 'Portfoy okunuyor ancak Beefy scope icinde uygun aday cikmadi. Bu, zap destekli pariteler de dahil tum adaylarin guardrail veya skor tarafinda elendigi anlamina gelebilir.',
    }
  }

  if (pendingApprovals > 0) {
    return {
      tone: 'info',
      title: 'Sistem karar uretiyor, operator onayi bekliyor',
      body: `${pendingApprovals} adet onay bekleyen aksiyon var. LIVE gecmeden once karar detaylarina bakmak gerekir.`,
    }
  }

  if (potentialPoolsCount > 0) {
    return {
      tone: 'ok',
      title: 'Sistem saglikli gorunuyor',
      body: 'Tarama, API ve aday uretimi calisiyor. Siradaki bakilacak yer autopilot karar gecmisi.',
    }
  }

  return {
    tone: 'info',
    title: 'Sistem acik ve veri topluyor',
    body: 'Ana akis calisiyor. Ancak operator tarafinda yorumlanabilir bir aksiyon henuz olusmamis olabilir.',
  }
}

function buildNextActions({ criticalCount, warnCount, lastReason, currentVault, potentialPoolsCount, canReadPortfolio }) {
  const items = []

  if (criticalCount > 0) items.push('Once Risk Alertleri bolumundeki kritik kayitlari incele.')
  if (lastReason === 'no_candidates') items.push('Autopilot su an uygun aday bulamiyor; bu hata degil, guardrail, skor veya replay kosullarinin sonucu olabilir.')
  if (!currentVault && canReadPortfolio) items.push('Portfoy bosta duruyor; Beefy Execution Universe bolumu yoruma en yakin alan.')
  if (potentialPoolsCount === 0) items.push('Execution Universe de bossa Beefy scope veya guardrail tarafini kontrol etmek gerekir.')
  if (warnCount > 0 && criticalCount === 0) items.push('Uyarilar var ama sistem bloklu degil; APY anomalilerini gozden gecirmek faydali olur.')
  if (items.length === 0) items.push('Ana akis saglikli gorunuyor; sonraki kontrol noktasi Autopilot Aksiyonlari ve Portfoy olmali.')

  return items.slice(0, 4)
}

export default function DefiView() {
  const [pools, setPools] = useState([])
  const [potentialPools, setPotentialPools] = useState([])
  const [highApyPools, setHighApyPools] = useState([])
  const [alphaCandidates, setAlphaCandidates] = useState([])
  const [alphaEvents, setAlphaEvents] = useState([])
  const [alphaMode, setAlphaMode] = useState('watch_only')
  const [autopilot, setAutopilot] = useState(null)
  const [actions, setActions] = useState([])
  const [expandedActionId, setExpandedActionId] = useState(null)
  const [actionEvents, setActionEvents] = useState({})
  const [approvingId, setApprovingId] = useState(null)
  const [portfolio, setPortfolio] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [stablecoins, setStablecoins] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [dataTimestamp, setDataTimestamp] = useState(null)
  const [stableTimestamp, setStableTimestamp] = useState(null)
  const [error, setError] = useState(null)
  const [defiTab, setDefiTab] = useState('overview')

  const fetchAll = useCallback(async () => {
    try {
      let nextDataTimestamp = null
      const [healthRes, poolsRes, highApyRes, potentialRes, alphaCandidatesRes, alphaEventsRes, autopilotRes, actionsRes, portfolioRes, alertsRes, stablesRes] = await Promise.allSettled([
        apiFetch(`${DEFI_API}/health`),
        apiFetch(`${DEFI_API}/pools/top?limit=15`),
        apiFetch(`${DEFI_API}/pools/high-apy?minApy=500&limit=15`),
        apiFetch(`${DEFI_API}/pools/potential?limit=8`),
        apiFetch(`${DEFI_API}/alpha/candidates?limit=10`),
        apiFetch(`${DEFI_API}/alpha/events?limit=10`),
        apiFetch(`${DEFI_API}/autopilot/state`),
        apiFetch(`${DEFI_API}/autopilot/actions?limit=25`),
        apiFetch(`${DEFI_API}/portfolio?usd=1`),
        apiFetch(`${DEFI_API}/alerts?limit=20`),
        apiFetch(`${DEFI_API}/stablecoins`),
      ])

      if (healthRes.status === 'fulfilled' && healthRes.value.ok) {
        // health JSON'u şu an UI'da kullanılmıyor; erişimi doğrulamak yeterli
        await healthRes.value.json().catch(() => null)
        setError(null)
      } else {
        setError('DeFi APM servisi erişilemiyor (port 4180)')
      }

      if (poolsRes.status === 'fulfilled' && poolsRes.value.ok) {
        const d = await poolsRes.value.json()
        setPools(d.pools || [])
        nextDataTimestamp = d.timestamp || null
      }

      if (highApyRes.status === 'fulfilled' && highApyRes.value.ok) {
        const d = await highApyRes.value.json()
        setHighApyPools(d.pools || [])
        if (!nextDataTimestamp) nextDataTimestamp = d.timestamp || null
      }

      if (potentialRes.status === 'fulfilled' && potentialRes.value.ok) {
        const d = await potentialRes.value.json()
        setPotentialPools(d.pools || [])
        if (!nextDataTimestamp) nextDataTimestamp = d.timestamp || null
      }

      if (alphaCandidatesRes.status === 'fulfilled' && alphaCandidatesRes.value.ok) {
        const d = await alphaCandidatesRes.value.json()
        setAlphaCandidates(d.candidates || [])
        setAlphaMode(d.mode || 'watch_only')
      }

      if (alphaEventsRes.status === 'fulfilled' && alphaEventsRes.value.ok) {
        const d = await alphaEventsRes.value.json()
        setAlphaEvents(d.events || [])
      }

      if (autopilotRes.status === 'fulfilled' && autopilotRes.value.ok) {
        const d = await autopilotRes.value.json()
        setAutopilot(d)
      }

      if (actionsRes.status === 'fulfilled' && actionsRes.value.ok) {
        const d = await actionsRes.value.json()
        setActions(Array.isArray(d.actions) ? d.actions : [])
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

      setDataTimestamp(nextDataTimestamp)
      setLastUpdated(new Date())
    } catch (err) {
      setError('Veri alınamadı: ' + err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchActionEvents = useCallback(async (actionId) => {
    const id = String(actionId || '').trim()
    if (!id) return
    if (actionEvents[id]) return
    try {
      const res = await apiFetch(`${DEFI_API}/autopilot/actions/${encodeURIComponent(id)}/events?limit=400`)
      if (!res.ok) return
      const d = await res.json()
      setActionEvents(prev => ({ ...prev, [id]: Array.isArray(d.events) ? d.events : [] }))
    } catch {
      /* ignore */
    }
  }, [actionEvents])

  const handleToggleEvents = async (actionId) => {
    const id = String(actionId || '').trim()
    if (!id) return
    setExpandedActionId(prev => (prev === id ? null : id))
    if (!actionEvents[id]) {
      await fetchActionEvents(id)
    }
  }

  const canApproveLive = Boolean(autopilot?.config?.execute && !autopilot?.config?.simulateOnly)
  const handleApprove = async (action) => {
    const id = String(action?.id || '').trim()
    if (!id || approvingId) return

    const fromV = action?.fromVaultId || '—'
    const toV = action?.toVaultId || '—'
    const ok = window.confirm(`Bu aksiyonu LIVE olarak çalıştırmak istiyor musun?\n\nAction: ${id}\nFrom: ${fromV}\nTo: ${toV}`)
    if (!ok) return

    try {
      setApprovingId(id)
      const res = await apiFetch(`${DEFI_API}/autopilot/approve/${encodeURIComponent(id)}`, { method: 'POST' })
      const payload = await res.json().catch(() => ({}))
      if (!res.ok) {
        const reason = payload?.reason || payload?.message || payload?.error || 'unknown'
        setError(`Approve başarısız: ${reason}`)
        return
      }
      setError(null)
      await fetchAll()
      setActionEvents(prev => {
        const copy = { ...prev }
        delete copy[id]
        return copy
      })
      await fetchActionEvents(id)
      setExpandedActionId(id)
    } catch (err) {
      setError(`Approve hata: ${err.message}`)
    } finally {
      setApprovingId(null)
    }
  }

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
  const pendingApprovals = actions.filter(a => String(a.status || '').toUpperCase() === 'PROPOSED').length
  const summary = buildSystemSummary({
    error,
    isDataStale,
    criticalCount: criticalAlerts.length,
    warnCount: warnAlerts.length,
    portfolioUsd,
    canReadPortfolio: Boolean(portfolio?.canRead),
    currentVault,
    pendingApprovals,
    lastReason,
    potentialPoolsCount: potentialPools.length,
  })
  const nextActions = buildNextActions({
    criticalCount: criticalAlerts.length,
    warnCount: warnAlerts.length,
    lastReason,
    currentVault,
    potentialPoolsCount: potentialPools.length,
    canReadPortfolio: Boolean(portfolio?.canRead),
  })

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

      {/* TAB BAR */}
      <div className="flex gap-1 p-1 rounded-xl bg-ax-surface border border-ax-border w-fit">
        <button
          onClick={() => setDefiTab('overview')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            defiTab === 'overview'
              ? 'bg-ax-panel border border-ax-border text-ax-heading shadow-sm'
              : 'text-ax-dim hover:text-ax-text'
          }`}
        >
          <TrendingUp size={13} />
          DeFi APM
        </button>
        <button
          onClick={() => setDefiTab('toppools')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            defiTab === 'toppools'
              ? 'bg-ax-panel border border-ax-border text-ax-heading shadow-sm'
              : 'text-ax-dim hover:text-ax-text'
          }`}
        >
          <Trophy size={13} />
          Top Pools
        </button>
      </div>

      {defiTab === 'toppools' && <TopPools />}

      {defiTab === 'overview' && <>

      {/* Başlık + Durum */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ax-accent/10 border border-ax-accent/25 flex items-center justify-center text-3xl">
              📈
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-black text-ax-heading italic">DeFi APM</h2>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  error ? 'bg-ax-red/10 text-ax-red border-ax-red/20' : 'bg-ax-green/10 text-ax-green border-ax-green/20'
                }`}>
                  {error ? 'DOWN' : 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-ax-dim font-medium">Otonom Portföy Yöneticisi — Faz 2</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`flex items-center justify-end gap-2 text-xs font-bold mb-0.5 ${isDataStale ? 'text-ax-amber' : 'text-ax-green'}`}>
                <div className={`w-2 h-2 rounded-full ${isDataStale ? 'bg-ax-amber animate-pulse' : 'bg-ax-green'}`} />
                {isDataStale ? 'Senkronizasyon Gecikti' : 'Senkronize'}
              </div>
              <p className="text-[10px] text-ax-dim font-mono">
                {dataTimestamp ? `Son Tarama: ${new Date(dataTimestamp).toLocaleTimeString('tr-TR')}` : 'Tarama bilgisi yok'}
              </p>
            </div>
            <button
              onClick={fetchAll}
              className="p-2.5 rounded-xl bg-ax-muted/30 hover:bg-ax-muted transition-colors text-ax-dim border border-ax-border/50"
              title="Yenile"
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
        <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1.3fr_.9fr] gap-3">
          <div className="p-4 rounded-2xl bg-ax-surface border border-ax-border">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck size={15} className="text-ax-cyan" />
              <h3 className="text-sm font-bold text-ax-heading">Bu Ekran Ne Diyor?</h3>
            </div>
            <div className={`inline-flex px-2 py-1 rounded-full border text-[10px] font-bold mb-2 ${summaryToneClass(summary.tone)}`}>
              {summary.title}
            </div>
            <p className="text-xs text-ax-dim leading-relaxed">
              {summary.body}
            </p>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="rounded-xl border border-ax-border bg-ax-panel p-2.5">
                <div className="text-[10px] text-ax-dim uppercase">Mod</div>
                <div className="text-xs font-bold text-ax-heading">{apCfg?.execute && !apCfg?.simulateOnly ? 'LIVE' : 'SIMULASYON'}</div>
              </div>
              <div className="rounded-xl border border-ax-border bg-ax-panel p-2.5">
                <div className="text-[10px] text-ax-dim uppercase">Durum</div>
                <div className="text-xs font-bold text-ax-heading">{lastReason === 'no_candidates' ? 'Aday yok' : (lastReason || 'Normal')}</div>
              </div>
              <div className="rounded-xl border border-ax-border bg-ax-panel p-2.5">
                <div className="text-[10px] text-ax-dim uppercase">Portfoy</div>
                <div className="text-xs font-bold text-ax-heading">{formatUsdCompact(portfolioUsd)}</div>
              </div>
              <div className="rounded-xl border border-ax-border bg-ax-panel p-2.5">
                <div className="text-[10px] text-ax-dim uppercase">Gercek aday</div>
                <div className="text-xs font-bold text-ax-heading">{potentialPools.length}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-ax-surface border border-ax-border">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={15} className="text-ax-amber" />
              <h3 className="text-sm font-bold text-ax-heading">Ne Yapmali?</h3>
            </div>
            <div className="space-y-2">
              {nextActions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-xs text-ax-dim">
                  <span className="mt-1 w-1.5 h-1.5 rounded-full bg-ax-amber shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 p-3 rounded-xl border border-ax-border bg-ax-panel text-[11px] text-ax-subtle leading-relaxed">
              `Beefy Radar` sadece gozlem ekranidir. Buradaki havuzlar autopilot icin otomatik olarak uygun kabul edilmez.
            </div>
          </div>
        </div>

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
            <span className={`px-2 py-1 rounded-full border font-mono ${
              apCfg?.requireApproval
                ? 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber'
                : 'bg-ax-surface border-ax-border text-ax-dim'
            }`}>
              Approval: {apCfg?.requireApproval ? 'REQUIRED' : 'OFF'}
            </span>
            <span className="px-2 py-1 rounded-full border bg-ax-surface border-ax-border text-ax-dim font-mono">
              Vault: {shownVault}
            </span>
            {lastAp && (
              <span className={`px-2 py-1 rounded-full border font-mono ${statusTone(lastAp.status)}`}>
                Last: {lastAp.status}/{lastAp.action}{lastReason ? ` (${lastReason})` : ''}
              </span>
            )}
            {pendingApprovals > 0 && (
              <span className="px-2 py-1 rounded-full border font-mono bg-ax-amber/10 border-ax-amber/25 text-ax-amber">
                Pending: {pendingApprovals}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Autopilot Aksiyonları */}
      {actions.length > 0 && (
        <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <Activity size={16} className="text-ax-cyan" />
            <h2 className="text-ax-heading text-sm font-bold">Autopilot Aksiyonları</h2>
            <span className="ml-auto text-[10px] text-ax-dim">{actions.length} kayıt</span>
          </div>

          <div className="mb-3 p-3 rounded-xl bg-ax-surface border border-ax-border text-[11px] text-ax-dim">
            Bu liste sistemin ne denedigini gosterir. `SKIPPED / NONE / no_candidates` hata degil; kurallara uyan aday bulunamadigi anlamina gelir.
          </div>

          {!canApproveLive && (
            <div className="mb-3 p-3 rounded-xl bg-ax-surface border border-ax-border text-[11px] text-ax-dim">
              LIVE approve için `execute=1` ve `simulateOnly=0` gerekli.
            </div>
          )}

          <div className="space-y-2">
            {actions.slice(0, 12).map((a) => {
              const id = String(a.id || '')
              const st = String(a.status || '').toUpperCase()
              const isProposed = st === 'PROPOSED'
              const isExpanded = expandedActionId === id
              const reason = a?.details?.reason || a?.details?.decision?.reason || null
              return (
                <div key={id} className="rounded-xl bg-ax-surface border border-ax-border overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <button
                      onClick={() => handleToggleEvents(id)}
                      className="shrink-0 w-7 h-7 rounded-lg border border-ax-border bg-ax-panel hover:bg-ax-muted/60 transition-colors text-ax-dim text-xs font-mono"
                      title="Events"
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                    <span className={`shrink-0 px-2 py-1 rounded-full border text-[10px] font-mono ${statusTone(st)}`}>
                      {st || '—'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-ax-heading font-mono">{id}</span>
                        <span className="text-[10px] text-ax-dim font-mono">{formatDateTime(a.timestamp)}</span>
                        {a.action && <span className="text-[10px] text-ax-dim uppercase tracking-wider">{a.action}</span>}
                        {reason && (
                          <span className="text-[10px] text-ax-subtle">
                            {reason}
                          </span>
                        )}
                      </div>
                      <div className="mt-0.5 text-[10px] text-ax-dim font-mono truncate">
                        {a.fromVaultId ? `from ${a.fromVaultId}` : 'from —'} → {a.toVaultId ? `to ${a.toVaultId}` : 'to —'}
                        {a.txHash ? ` · tx ${shortHash(a.txHash)}` : ''}
                      </div>
                    </div>
                    {isProposed && (
                      <button
                        onClick={() => handleApprove(a)}
                        disabled={!canApproveLive || approvingId === id}
                        className={`shrink-0 px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
                          !canApproveLive
                            ? 'bg-ax-muted border-ax-border text-ax-dim cursor-not-allowed'
                            : 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber hover:bg-ax-amber/20'
                        }`}
                        title={!canApproveLive ? 'execute/simulateOnly ayarlarını kontrol et' : 'Manuel onay (LIVE)'}
                      >
                        {approvingId === id ? 'Onay…' : 'Approve'}
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-ax-border/60 bg-ax-panel px-3 py-2">
                      {(actionEvents[id] || []).length === 0 ? (
                        <div className="text-[11px] text-ax-dim">Event yok (veya yüklenemedi).</div>
                      ) : (
                        <div className="space-y-1">
                          {(actionEvents[id] || []).slice(-30).map((ev) => (
                            <div key={ev.id} className="flex items-start gap-2 text-[11px]">
                              <span className={`mt-0.5 w-1.5 h-1.5 rounded-full shrink-0 ${levelDot(ev.status === 'FAILED' ? 'CRITICAL' : ev.status === 'PROPOSED' ? 'WARN' : 'INFO')}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono ${statusTone(ev.status)}`}>
                                    {String(ev.status || '').toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-ax-subtle font-mono">{formatDateTime(ev.timestamp)}</span>
                                  {ev.details?.reason && <span className="text-[10px] text-ax-dim">{ev.details.reason}</span>}
                                </div>
                                {ev.details && typeof ev.details === 'object' && (ev.details.message || ev.details.error) && (
                                  <div className="text-[10px] text-ax-dim font-mono truncate">
                                    {ev.details.message || ev.details.error}
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

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

      {/* Yüksek APY Radar */}
      {highApyPools.length > 0 && (
        <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-ax-amber" />
            <h2 className="text-ax-heading text-sm font-bold">Beefy Radar</h2>
            <span className="ml-auto text-[10px] text-ax-dim">(scope: Beefy)</span>
          </div>
          <div className="mb-3 p-3 rounded-xl bg-ax-surface border border-ax-border text-[11px] text-ax-dim">
            Burasi gozlem ekranidir. Liste Beefy ile sinirli olsa da, execution karari icin guardrail ve autopilot kurallari ayrica gecer.
          </div>
          <div>
            {highApyPools.slice(0, 10).map((pool, i) => (
              <PoolRow key={`high-apy-${pool.poolId || pool.id || i}`} pool={pool} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* En İyi Havuzlar */}
      {pools.length > 0 && (
        <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={16} className="text-ax-cyan" />
            <h2 className="text-ax-heading text-sm font-bold">Beefy Havuzlari</h2>
            <span className="ml-auto text-[10px] text-ax-dim">(scope icinde APY sirasi)</span>
          </div>
          <div className="mb-3 p-3 rounded-xl bg-ax-surface border border-ax-border text-[11px] text-ax-dim">
            Bu liste artik genel piyasa degil, yalnizca Beefy evrenidir. Yine de "en iyi" ifadesi execution uygunlugu degil, ham APY sirasi anlamina gelir.
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
            <h2 className="text-ax-heading text-sm font-bold">Beefy Execution Universe</h2>
            <span className="ml-auto text-[10px] text-ax-dim">($1000 bazında günlük)</span>
          </div>
          <div className="mb-3 p-3 rounded-xl bg-ax-green/5 border border-ax-green/15 text-[11px] text-ax-dim">
            Yoruma en yakin liste burasi. Su anki Base + Beefy zap-aday mantigina en yakin ekran bu bolumdur.
          </div>
          <div>
            {potentialPools.slice(0, 8).map((pool, i) => (
              <PotentialPoolRow key={`potential-${pool.poolId || pool.id || i}`} pool={pool} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Alpha Sniper Board */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Activity size={16} className="text-ax-red" />
          <h2 className="text-ax-heading text-sm font-bold">Alpha Sniper Board</h2>
          <span className="ml-auto text-[10px] text-ax-dim">mode: {alphaMode}</span>
        </div>
        <div className="mb-3 p-3 rounded-xl bg-ax-red/5 border border-ax-red/15 text-[11px] text-ax-dim">
          Bu board artik varsayilan olarak sadece on-chain event ile yakalanan adaylari gosterir. Scan kaynakli mevcut havuzlar burada yeni havuz gibi sunulmaz.
        </div>
        {alphaCandidates.length > 0 ? (
          <div>
            {alphaCandidates.slice(0, 10).map((candidate, i) => (
              <AlphaCandidateRow key={candidate.candidateId || i} candidate={candidate} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-ax-dim text-xs">
            Henuz event-backed yeni havuz adayi yok. Board bos olabilir; bu, scan verisinin gizlendigi ve sadece gercek on-chain kesiflerin beklendigi anlamina gelir.
          </div>
        )}
      </div>

      {/* On-Chain Discovery Events */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <RefreshCw size={16} className="text-ax-cyan" />
          <h2 className="text-ax-heading text-sm font-bold">On-Chain Discovery Events</h2>
          <span className="ml-auto text-[10px] text-ax-dim">{alphaEvents.length} event</span>
        </div>
        <div className="mb-3 p-3 rounded-xl bg-ax-surface border border-ax-border text-[11px] text-ax-dim">
          Bu akis factory seviyesinde yeni `PoolCreated` olaylarini gosterir. Liste bossa sistem bozuk degil; o pencerede yeni havuz olayi gelmemis olabilir.
        </div>
        {alphaEvents.length > 0 ? (
          <div>
            {alphaEvents.slice(0, 10).map((event, i) => (
              <AlphaEventRow key={event.eventId || i} event={event} rank={i + 1} />
            ))}
          </div>
        ) : (
          <div className="text-center py-6 text-ax-dim text-xs">
            Son polling penceresinde yeni pool creation olayi yakalanmadi.
          </div>
        )}
      </div>

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

      </>}{/* /defiTab overview */}
    </div>
  )
}
