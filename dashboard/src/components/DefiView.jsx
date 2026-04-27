import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, AlertTriangle, RefreshCw, DollarSign, Activity, ShieldCheck, ShieldAlert, Trophy, Bot } from 'lucide-react'
import apiFetch from '../services/apiFetch'
import TopPools from './TopPools'
import {
  DEFI_API, REFRESH_INTERVAL, SCAN_STALE_MS, CHAIN_BADGE,
  formatUsd, formatUsdCompact, formatTime, formatDateTime,
  levelColor, levelDot, statusTone, shortHash, alphaDecisionTone, summaryToneClass
} from './defiUtils'

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
            <span className="text-[11px] px-1 bg-ax-green/10 text-ax-green rounded-sm border border-ax-green/20">
              {safetyScore}
            </span>
          )}
          {apyTier === 'crit' && (
            <span className="text-[11px] px-1 bg-ax-red/10 text-ax-red rounded-sm border border-ax-red/20">
              Çok yüksek APY
            </span>
          )}
          {apyTier === 'warn' && (
            <span className="text-[11px] px-1 bg-ax-amber/10 text-ax-amber rounded-sm border border-ax-amber/20">
              Yüksek APY
            </span>
          )}
        </div>
        {/* Chain + TVL + APY Detay */}
        <div className="flex items-center gap-2 flex-wrap">
          {pool.chain && (
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${chainStyle}`}>
              {pool.chain}
            </span>
          )}
          <span className="text-[10px] text-ax-dim">${(tvl / 1e6).toFixed(1)}M TVL</span>
          {hasReward && (
            <span className="text-[11px] text-ax-amber">+{apyReward.toFixed(1)}% ödül</span>
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
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${chainStyle}`}>
              {pool.chain}
            </span>
          )}
          {potentialScore !== null && (
            <span className={`px-1.5 py-0.5 rounded text-[11px] font-black border ${scoreTone}`}>
              Skor {potentialScore.toFixed(1)}
            </span>
          )}
          {warnAlerts24h > 0 && (
            <span className="px-1.5 py-0.5 rounded text-[11px] font-bold border bg-ax-amber/10 text-ax-amber border-ax-amber/25">
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
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${chainStyle}`}>
            {candidate.chain || '—'}
          </span>
          <span className="text-[10px] text-ax-dim uppercase tracking-tighter">{candidate.dex || '—'}</span>
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${sourceTone}`}>
            {eventBacked ? 'EVENT' : (candidate.discoverySource || 'SCAN').toUpperCase()}
          </span>
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-black border ${alphaDecisionTone(candidate.decision)}`}>
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
          <span className={`px-1.5 py-0.5 rounded text-[11px] font-bold border ${chainStyle}`}>
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

function AutopilotPanel({ config, state, actions, actionEvents, expandedActionId, approvingId, canApproveLive, onToggleEvents, onApprove, onToggleEnabled }) {
  const currentVault = state?.current_vault_id || ''
  const proposedVault = state?.proposed_vault_id || ''
  const portfolioAddr = state?.portfolio_address || ''

  return (
    <div className="space-y-4">
      {/* Config Kartı */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-4">
          <Bot size={16} className="text-ax-accent" />
          <h2 className="text-ax-heading text-sm font-bold">Autopilot Konfigürasyonu</h2>
          <button
            onClick={onToggleEnabled}
            className={`ml-auto px-3 py-1.5 rounded-lg border text-[11px] font-bold transition-colors ${
              config?.enabled
                ? 'bg-ax-green/10 border-ax-green/25 text-ax-green hover:bg-ax-red/10 hover:border-ax-red/25 hover:text-ax-red'
                : 'bg-ax-muted border-ax-border text-ax-dim hover:bg-ax-green/10 hover:border-ax-green/25 hover:text-ax-green'
            }`}
          >
            {config?.enabled ? 'Aktif — Kapat' : 'Pasif — Aç'}
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
          {[
            { label: 'Mod', value: config?.execute && !config?.simulateOnly ? '🔴 LIVE' : '🟢 SIM', highlight: config?.execute && !config?.simulateOnly },
            { label: 'Onay', value: config?.requireApproval ? 'Gerekli' : 'Otomatik' },
            { label: 'Max Trade', value: `${config?.maxTradeEth ?? '—'} ETH` },
            { label: 'Cooldown', value: `${config?.cooldownMinutes ?? '—'}dk` },
            { label: 'Min Hold', value: `${config?.minHoldMinutes ?? '—'}dk` },
            { label: 'Min Skor Δ', value: config?.minScoreDelta ?? '—' },
            { label: 'Zincir', value: config?.chain ?? '—' },
            { label: 'Protokol', value: config?.protocol ?? '—' },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="p-2.5 rounded-xl bg-ax-surface border border-ax-border">
              <p className="text-[11px] text-ax-dim mb-1">{label}</p>
              <p className={`text-xs font-mono font-bold ${highlight ? 'text-ax-red' : 'text-ax-text'}`}>{String(value)}</p>
            </div>
          ))}
        </div>

        {portfolioAddr && (
          <div className="pt-3 border-t border-ax-border/50">
            <p className="text-[10px] text-ax-dim mb-1">Portföy Adresi</p>
            <p className="text-[11px] font-mono text-ax-subtle break-all">{portfolioAddr}</p>
          </div>
        )}

        {(currentVault || proposedVault) && (
          <div className="pt-3 border-t border-ax-border/50 grid grid-cols-2 gap-3 mt-3">
            {currentVault && (
              <div>
                <p className="text-[11px] text-ax-dim mb-1">Mevcut Vault</p>
                <p className="text-[11px] font-mono text-ax-green truncate">{currentVault}</p>
              </div>
            )}
            {proposedVault && (
              <div>
                <p className="text-[11px] text-ax-dim mb-1">Önerilen Vault</p>
                <p className="text-[11px] font-mono text-ax-amber truncate">{proposedVault}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Aksiyon Geçmişi */}
      <div className="rounded-2xl bg-ax-panel border border-ax-border p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity size={16} className="text-ax-cyan" />
          <h2 className="text-ax-heading text-sm font-bold">Aksiyon Geçmişi</h2>
          <span className="ml-auto text-[10px] text-ax-dim">{actions.length} kayıt</span>
        </div>

        {!canApproveLive && (
          <div className="mb-3 p-3 rounded-xl bg-ax-surface border border-ax-border text-[11px] text-ax-dim">
            LIVE onay için <span className="font-mono">execute=1</span> ve <span className="font-mono">simulateOnly=0</span> gerekli.
          </div>
        )}

        <div className="space-y-2">
          {actions.length === 0 ? (
            <p className="text-[11px] text-ax-dim py-4 text-center">Henüz aksiyon kaydı yok</p>
          ) : actions.slice(0, 15).map((a) => {
            const id = String(a.id || '')
            const st = String(a.status || '').toUpperCase()
            const isProposed = st === 'PROPOSED'
            const isExpanded = expandedActionId === id
            const reason = a?.details?.reason || a?.details?.decision?.reason || null
            const events = actionEvents[id] || []

            return (
              <div key={id} className="rounded-xl bg-ax-surface border border-ax-border overflow-hidden">
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <button
                    onClick={() => onToggleEvents(id)}
                    className="shrink-0 w-7 h-7 rounded-lg border border-ax-border bg-ax-panel hover:bg-ax-muted/60 transition-colors text-ax-dim text-xs font-mono"
                  >
                    {isExpanded ? '−' : '+'}
                  </button>
                  <span className={`shrink-0 px-2 py-1 rounded-full border text-[10px] font-mono ${statusTone(st)}`}>
                    {st || '—'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-ax-dim">{formatDateTime(a.timestamp)}</span>
                      {a.action && <span className="text-[10px] text-ax-dim">{a.action}</span>}
                      {reason && <span className="text-[10px] text-ax-subtle">{reason}</span>}
                    </div>
                    <div className="mt-0.5 text-[10px] text-ax-dim font-mono truncate">
                      {a.fromVaultId ? `from ${a.fromVaultId}` : 'from —'} → {a.toVaultId ? `to ${a.toVaultId}` : 'to —'}
                    </div>
                  </div>
                  {isProposed && (
                    <button
                      onClick={() => onApprove(a)}
                      disabled={!canApproveLive || approvingId === id}
                      className="shrink-0 px-3 py-1.5 rounded-lg border text-[11px] font-bold bg-ax-amber/10 border-ax-amber/25 text-ax-amber hover:bg-ax-amber/20 disabled:opacity-40 transition-colors"
                    >
                      {approvingId === id ? '...' : 'Onayla'}
                    </button>
                  )}
                </div>
                {isExpanded && events.length > 0 && (
                  <div className="border-t border-ax-border/50 px-3 py-2 space-y-1 max-h-48 overflow-y-auto">
                    {events.map((ev, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px] font-mono text-ax-dim">
                        <span className="text-ax-subtle shrink-0">{formatDateTime(ev.timestamp)}</span>
                        <span className="text-ax-dim">{ev.event}</span>
                        {ev.details && <span className="text-ax-subtle truncate">{typeof ev.details === 'string' ? ev.details : JSON.stringify(ev.details).slice(0, 80)}</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
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
    <div className="p-6 space-y-6 max-w-5xl mx-auto relative">
      {/* Background ambient glow */}
      <div className="fixed top-20 left-1/2 -translate-x-1/2 w-3/4 h-96 bg-ax-cyan/5 blur-[120px] rounded-full pointer-events-none -z-10" />

      {/* Header & TAB BAR */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 relative z-10">
        <div>
          <p className="text-[10px] font-mono font-bold uppercase text-ax-cyan mb-2">DeFi APM</p>
          <h1 className="text-2xl font-bold text-ax-heading tracking-tight">Otonom Portföy</h1>
        </div>
        
        <div className="flex gap-1 p-1.5 rounded-2xl ax-glass border border-ax-border shadow-inner">
          <button
            onClick={() => setDefiTab('overview')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              defiTab === 'overview'
                ? 'bg-ax-cyan/15 border border-ax-cyan/30 text-ax-cyan'
                : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted border border-transparent'
            }`}
          >
            <TrendingUp size={14} />
            APM İzleme
          </button>
          <button
            onClick={() => setDefiTab('toppools')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              defiTab === 'toppools'
                ? 'bg-ax-amber/15 border border-ax-amber/30 text-ax-amber'
                : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted border border-transparent'
            }`}
          >
            <Trophy size={14} />
            Lider Havuzlar
          </button>
          <button
            onClick={() => setDefiTab('autopilot')}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              defiTab === 'autopilot'
                ? 'bg-ax-accent/15 border border-ax-accent/30 text-ax-accent'
                : 'text-ax-dim hover:text-ax-text hover:bg-ax-muted border border-transparent'
            }`}
          >
            <Bot size={14} />
            Otopilot
            {pendingApprovals > 0 && (
              <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-ax-amber text-black animate-pulse">
                {pendingApprovals}
              </span>
            )}
          </button>
        </div>
      </div>

      {defiTab === 'toppools' && <TopPools />}

      {defiTab === 'autopilot' && autopilot && (
        <AutopilotPanel
          config={apCfg}
          state={autopilot?.state}
          actions={actions}
          actionEvents={actionEvents}
          expandedActionId={expandedActionId}
          approvingId={approvingId}
          canApproveLive={canApproveLive}
          onToggleEvents={handleToggleEvents}
          onApprove={handleApprove}
          onToggleEnabled={async () => {
            try {
              await apiFetch(`${DEFI_API}/autopilot/toggle`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !apCfg?.enabled }) })
              await fetchAll()
            } catch {
              /* ignore */
            }
          }}
        />
      )}

      {defiTab === 'overview' && <>

      {/* Başlık + Durum */}
      <div className="rounded-xl ax-glass p-4 relative overflow-hidden group">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-ax-cyan/10 border border-ax-cyan/25 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-500">
              📈
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-black text-ax-heading uppercase tracking-widest">Sistem Durumu</h2>
                <span className={`px-2.5 py-1 rounded-lg text-[11px] font-black border ${
                  error ? 'bg-ax-red/10 text-ax-red border-ax-red/30' : 'bg-ax-green/10 text-ax-green border-ax-green/30'
                }`}>
                  {error ? 'DOWN' : 'ACTIVE'}
                </span>
              </div>
              <p className="text-xs text-ax-dim font-mono">Otonom Portföy Yöneticisi — Faz 2</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className={`flex items-center justify-end gap-2 text-[11px] uppercase tracking-widest font-bold mb-1 ${isDataStale ? 'text-ax-amber' : 'text-ax-green'}`}>
                <div className={`w-2 h-2 rounded-full ${isDataStale ? 'bg-ax-amber animate-pulse' : 'bg-ax-green'}`} />
                {isDataStale ? 'Senkronizasyon Gecikti' : 'Senkronize'}
              </div>
              <p className="text-[10px] text-ax-dim font-mono">
                {dataTimestamp ? `Son Tarama: ${new Date(dataTimestamp).toLocaleTimeString('tr-TR')}` : 'Tarama bilgisi yok'}
              </p>
            </div>
            <button
              onClick={fetchAll}
              className="p-3 rounded-xl bg-ax-surface hover:bg-ax-muted/60 transition-colors text-ax-dim border border-ax-border hover:text-ax-heading"
              title="Yenile"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-ax-red/5 border border-ax-red/20 text-xs text-ax-red">
            {error}
          </div>
        )}

        {/* Özet İstatistikler */}
        <div className="mt-6 grid grid-cols-1 lg:grid-cols-[1.3fr_.9fr] gap-4 relative z-10">
          <div className="p-4 rounded-xl ax-glass border border-ax-border relative overflow-hidden group">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 rounded-xl bg-ax-cyan/10">
                <ShieldCheck size={16} className="text-ax-cyan" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-ax-heading">Bu Ekran Ne Diyor?</h3>
            </div>
            <div className={`inline-flex px-3 py-1.5 rounded-lg border text-[10px] font-black mb-3 relative z-10 ${summaryToneClass(summary.tone)}`}>
              {summary.title}
            </div>
            <p className="text-sm text-ax-dim leading-relaxed font-mono bg-ax-surface p-3 rounded-xl border border-ax-border relative z-10">
              {summary.body}
            </p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3 relative z-10">
              <div className="rounded-2xl border border-ax-border bg-ax-surface p-3 hover:bg-ax-muted transition-colors">
                <div className="text-[11px] text-ax-dim uppercase tracking-widest font-bold mb-1">Mod</div>
                <div className={`text-xs font-black font-mono ${apCfg?.execute && !apCfg?.simulateOnly ? 'text-ax-red' : 'text-ax-heading'}`}>{apCfg?.execute && !apCfg?.simulateOnly ? 'LIVE' : 'SIMULASYON'}</div>
              </div>
              <div className="rounded-2xl border border-ax-border bg-ax-surface p-3 hover:bg-ax-muted transition-colors">
                <div className="text-[11px] text-ax-dim uppercase tracking-widest font-bold mb-1">Durum</div>
                <div className="text-xs font-black font-mono text-ax-heading truncate" title={lastReason === 'no_candidates' ? 'Aday yok' : (lastReason || 'Normal')}>{lastReason === 'no_candidates' ? 'Aday yok' : (lastReason || 'Normal')}</div>
              </div>
              <div className="rounded-2xl border border-ax-border bg-ax-surface p-3 hover:bg-ax-muted transition-colors">
                <div className="text-[11px] text-ax-dim uppercase tracking-widest font-bold mb-1">Portföy</div>
                <div className="text-xs font-black font-mono text-ax-heading">{formatUsdCompact(portfolioUsd)}</div>
              </div>
              <div className="rounded-2xl border border-ax-border bg-ax-surface p-3 hover:bg-ax-muted transition-colors">
                <div className="text-[11px] text-ax-dim uppercase tracking-widest font-bold mb-1">Gerçek aday</div>
                <div className="text-xs font-black font-mono text-ax-cyan">{potentialPools.length}</div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl ax-glass border border-ax-border relative overflow-hidden">
            <div className="flex items-center gap-3 mb-4 relative z-10">
              <div className="p-2 rounded-xl bg-ax-amber/10">
                <AlertTriangle size={16} className="text-ax-amber" />
              </div>
              <h3 className="text-sm font-black uppercase tracking-widest text-ax-heading">Ne Yapmalı?</h3>
            </div>
            <div className="space-y-3 relative z-10">
              {nextActions.map((item, idx) => (
                <div key={idx} className="flex items-start gap-3 text-xs text-ax-dim p-2.5 rounded-xl bg-ax-surface border border-ax-border">
                  <span className="mt-1 w-2 h-2 rounded-full bg-ax-amber shrink-0" />
                  <span className="font-mono">{item}</span>
                </div>
              ))}
            </div>
            <div className="mt-4 p-3 rounded-xl border border-ax-border bg-ax-cyan/5 text-[10px] text-ax-cyan font-mono uppercase tracking-widest leading-relaxed relative z-10 shadow-inner">
              Beefy Radar sadece gözlem ekranıdır. Otomatik uygunluk garantilemez.
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 relative z-10">
          <div className="p-4 rounded-xl ax-glass border border-ax-border text-center group hover:bg-ax-muted transition-colors">
            <div className="text-2xl font-black text-ax-cyan font-mono group-hover:scale-110 transition-transform">{pools.length}</div>
            <div className="text-[10px] text-ax-dim uppercase tracking-widest mt-1 font-bold">Havuz</div>
          </div>
          <div className={`p-4 rounded-xl border text-center group transition-colors ${criticalAlerts.length > 0 ? 'bg-ax-red/5 border-ax-red/20' : 'ax-glass border-ax-border hover:bg-ax-muted'}`}>
            <div className={`text-2xl font-black font-mono transition-transform group-hover:scale-110 ${criticalAlerts.length > 0 ? 'text-ax-red animate-pulse' : 'text-ax-green'}`}>
              {criticalAlerts.length}
            </div>
            <div className="text-[10px] text-ax-dim uppercase tracking-widest mt-1 font-bold">Kritik</div>
          </div>
          <div className={`p-4 rounded-xl border text-center group transition-colors ${warnAlerts.length > 0 ? 'bg-ax-amber/5 border-ax-amber/20' : 'ax-glass border-ax-border hover:bg-ax-muted'}`}>
            <div className={`text-2xl font-black font-mono transition-transform group-hover:scale-110 ${warnAlerts.length > 0 ? 'text-ax-amber' : 'text-ax-heading'}`}>
              {warnAlerts.length}
            </div>
            <div className="text-[10px] text-ax-dim uppercase tracking-widest mt-1 font-bold">Uyarı</div>
          </div>
          <div className={`p-4 rounded-xl border text-center group transition-colors ${
            portfolio && portfolio.canRead ? 'bg-ax-green/5 border-ax-green/15' : 'ax-glass border-ax-border hover:bg-ax-muted'
          }`}>
            <div className={`text-2xl font-black font-mono transition-transform group-hover:scale-110 ${portfolio && portfolio.canRead ? 'text-ax-green' : 'text-ax-dim'}`}>
              {portfolio && portfolio.canRead ? formatUsdCompact(portfolioUsd) : '—'}
            </div>
            <div className="text-[10px] text-ax-dim uppercase tracking-widest mt-1 font-bold">Portföy</div>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-[10px] text-ax-subtle font-mono relative z-10">
          <span>Veri zamanı: {formatTime(dataTimestamp)}</span>
          <span>İstek: {formatTime(lastUpdated)}</span>
        </div>

        {autopilot && (
          <div className="mt-4 flex flex-wrap items-center gap-2 text-[10px] relative z-10">
            <span className="px-3 py-1.5 rounded-lg border bg-ax-surface border-ax-border text-ax-dim font-mono shadow-inner">
              Autopilot: {apCfg?.enabled ? 'ON' : 'OFF'}
            </span>
            <span className={`px-3 py-1.5 rounded-lg border font-mono ${
              apCfg?.execute && !apCfg?.simulateOnly
                ? 'bg-ax-red/10 border-ax-red/25 text-ax-red'
                : 'bg-ax-green/10 border-ax-green/25 text-ax-green'
            }`}>
              Execute: {apCfg?.execute && !apCfg?.simulateOnly ? 'LIVE' : 'SIM'}
            </span>
            <span className={`px-3 py-1.5 rounded-lg border font-mono shadow-inner ${
              apCfg?.requireApproval
                ? 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber'
                : 'bg-ax-surface border-ax-border text-ax-dim'
            }`}>
              Approval: {apCfg?.requireApproval ? 'REQUIRED' : 'OFF'}
            </span>
            <span className="px-3 py-1.5 rounded-lg border bg-ax-surface border-ax-border text-ax-dim font-mono shadow-inner truncate max-w-[200px]">
              Vault: {shownVault}
            </span>
            {lastAp && (
              <span className={`px-3 py-1.5 rounded-lg border font-mono ${statusTone(lastAp.status)}`}>
                Last: {lastAp.status}/{lastAp.action}{lastReason ? ` (${lastReason})` : ''}
              </span>
            )}
            {pendingApprovals > 0 && (
              <span className="px-3 py-1.5 rounded-lg border font-mono bg-ax-amber/20 border-ax-amber/40 text-ax-amber font-black animate-pulse">
                Pending: {pendingApprovals}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Autopilot Aksiyonları */}
      {actions.length > 0 && (
        <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 rounded-xl bg-ax-cyan/10">
              <Activity size={16} className="text-ax-cyan" />
            </div>
            <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Autopilot Aksiyonları</h2>
            <span className="ml-auto px-2 py-1 rounded-lg bg-ax-surface border border-ax-border text-[10px] text-ax-dim font-mono">{actions.length} kayıt</span>
          </div>

          <div className="mb-4 p-3 rounded-xl border border-ax-border bg-ax-surface text-[11px] text-ax-dim font-mono relative z-10 shadow-inner">
            Bu liste sistemin ne denedigini gosterir. `SKIPPED / NONE / no_candidates` hata degil; kurallara uyan aday bulunamadigi anlamina gelir.
          </div>

          {!canApproveLive && (
            <div className="mb-4 p-3 rounded-xl bg-ax-red/5 border border-ax-red/20 text-[11px] text-ax-red font-mono relative z-10">
              LIVE approve için `execute=1` ve `simulateOnly=0` gerekli.
            </div>
          )}

          <div className="space-y-3 relative z-10">
            {actions.slice(0, 12).map((a) => {
              const id = String(a.id || '')
              const st = String(a.status || '').toUpperCase()
              const isProposed = st === 'PROPOSED'
              const isExpanded = expandedActionId === id
              const reason = a?.details?.reason || a?.details?.decision?.reason || null
              return (
                <div key={id} className="rounded-2xl bg-ax-surface border border-ax-border overflow-hidden hover:border-ax-border hover:bg-ax-muted transition-all duration-300">
                  <div className="flex items-center gap-4 px-4 py-3">
                    <button
                      onClick={() => handleToggleEvents(id)}
                      className="shrink-0 w-8 h-8 rounded-xl border border-ax-border bg-ax-surface hover:bg-ax-muted/60 transition-colors text-ax-dim text-lg font-mono flex items-center justify-center shadow-inner"
                      title="Events"
                    >
                      {isExpanded ? '−' : '+'}
                    </button>
                    <span className={`shrink-0 px-2.5 py-1 rounded-lg border text-[10px] font-black ${statusTone(st)}`}>
                      {st || '—'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="text-xs font-black text-ax-heading font-mono">{id}</span>
                        <span className="text-[10px] text-ax-dim font-mono">{formatDateTime(a.timestamp)}</span>
                        {a.action && <span className="text-[10px] px-1.5 py-0.5 rounded border border-ax-border bg-ax-muted text-ax-dim font-bold">{a.action}</span>}
                        {reason && (
                          <span className="text-[10px] text-ax-amber bg-ax-amber/10 px-2 py-0.5 rounded border border-ax-amber/20">
                            {reason}
                          </span>
                        )}
                      </div>
                      <div className="mt-1.5 text-[11px] text-ax-subtle font-mono truncate">
                        {a.fromVaultId ? <span className="text-ax-dim">from {a.fromVaultId}</span> : 'from —'} <span className="text-ax-cyan mx-1">→</span> {a.toVaultId ? <span className="text-ax-text">to {a.toVaultId}</span> : 'to —'}
                        {a.txHash ? ` · tx ${shortHash(a.txHash)}` : ''}
                      </div>
                    </div>
                    {isProposed && (
                      <button
                        onClick={() => handleApprove(a)}
                        disabled={!canApproveLive || approvingId === id}
                        className={`shrink-0 px-4 py-2 rounded-xl border text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                          !canApproveLive
                            ? 'bg-ax-surface border-ax-border text-ax-dim cursor-not-allowed'
                            : 'bg-ax-amber/15 border-ax-amber/30 text-ax-amber hover:bg-ax-amber/80 hover:text-ax-bg'
                        }`}
                        title={!canApproveLive ? 'execute/simulateOnly ayarlarını kontrol et' : 'Manuel onay (LIVE)'}
                      >
                        {approvingId === id ? 'ONAY...' : 'APPROVE'}
                      </button>
                    )}
                  </div>
                  {isExpanded && (
                    <div className="border-t border-ax-border bg-ax-muted px-4 py-3 shadow-inner">
                      {(actionEvents[id] || []).length === 0 ? (
                        <div className="text-[11px] text-ax-dim font-mono p-2">Event yok (veya yüklenemedi).</div>
                      ) : (
                        <div className="space-y-2">
                          {(actionEvents[id] || []).slice(-30).map((ev) => (
                            <div key={ev.id} className="flex items-start gap-3 text-[11px] font-mono">
                              <span className={`mt-1 w-2 h-2 rounded-full shrink-0 ${levelDot(ev.status === 'FAILED' ? 'CRITICAL' : ev.status === 'PROPOSED' ? 'WARN' : 'INFO')}`} />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className={`px-2 py-0.5 rounded-md border text-[11px] font-black ${statusTone(ev.status)}`}>
                                    {String(ev.status || '').toUpperCase()}
                                  </span>
                                  <span className="text-[10px] text-ax-subtle">{formatDateTime(ev.timestamp)}</span>
                                  {ev.details?.reason && <span className="text-[10px] text-ax-amber px-1 border border-ax-amber/20 bg-ax-amber/10 rounded">{ev.details.reason}</span>}
                                </div>
                                {ev.details && typeof ev.details === 'object' && (ev.details.message || ev.details.error) && (
                                  <div className="text-[10px] text-ax-dim bg-ax-muted p-1.5 rounded border border-ax-border truncate">
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
        <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 rounded-xl bg-ax-green/10">
              <DollarSign size={16} className="text-ax-green" />
            </div>
            <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Portföy (Base)</h2>
            <span className="ml-auto px-3 py-1.5 rounded-lg border border-ax-border bg-ax-surface text-[10px] text-ax-text font-mono shadow-inner">
              {ethUsd ? `ETH $${ethUsd.toFixed(0)}` : 'ETH $—'}
            </span>
          </div>

          {!portfolio.canRead ? (
            <div className="p-4 rounded-xl bg-ax-surface border border-ax-border text-[11px] text-ax-dim uppercase tracking-widest font-bold shadow-inner relative z-10">
              Cüzdan okunamadı. Read-only için AUTOPILOT_ADDRESS tanımla.
            </div>
          ) : (
            <div className="space-y-4 relative z-10">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-ax-surface border border-ax-border shadow-inner hover:bg-ax-muted transition-colors">
                  <div className="text-[10px] text-ax-dim uppercase tracking-widest font-bold mb-2">Toplam</div>
                  <div className="text-2xl font-black font-mono text-ax-green">
                    {formatUsd(portfolioUsd)}
                  </div>
                  <div className="text-[11px] text-ax-dim font-mono mt-1">
                    {portfolio.totalBalanceEth ?? '—'} ETH
                  </div>
                </div>
                <div className="p-4 rounded-2xl bg-ax-surface border border-ax-border shadow-inner hover:bg-ax-muted transition-colors">
                  <div className="text-[10px] text-ax-dim uppercase tracking-widest font-bold mb-2">Cüzdan Adresi</div>
                  <div className="text-[11px] text-ax-heading font-mono truncate bg-ax-surface px-2 py-1 rounded border border-ax-border">{portfolio.address}</div>
                  <div className="text-[10px] text-ax-dim font-mono mt-2">
                    ETH: {portfolio.ethBalance ?? '—'} <span className="mx-1 text-ax-subtle">·</span> WETH: {portfolio.wethBalance ?? '—'}
                  </div>
                </div>
              </div>

              {Array.isArray(portfolio.vaultPositions) && portfolio.vaultPositions.length > 0 ? (
                <div className="rounded-2xl bg-ax-surface border border-ax-border overflow-hidden shadow-inner">
                  <div className="px-4 py-3 border-b border-ax-border text-[10px] text-ax-dim uppercase tracking-widest font-black bg-ax-muted">
                    Vault Pozisyonları
                  </div>
                  <div className="divide-y divide-white/5">
                    {portfolio.vaultPositions.slice(0, 6).map((p, idx) => (
                      <div key={p.vaultId || idx} className="flex items-center gap-4 px-4 py-3 hover:bg-ax-muted transition-colors">
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-black text-ax-heading truncate mb-0.5">
                            {p.symbol || p.vaultId || 'Vault'}
                          </div>
                          <div className="text-[10px] text-ax-dim font-mono truncate">
                            {p.underlyingBalance ?? p.shareBalance ?? '—'} {p.underlyingSymbol ?? 'WETH'}
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-black font-mono text-ax-cyan">
                            {typeof p.usdValue === 'number' ? formatUsd(p.usdValue) : '—'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-2xl bg-ax-surface border border-ax-border border-dashed text-[11px] font-bold text-ax-dim uppercase tracking-widest text-center shadow-inner">
                  Aktif vault pozisyonu yok.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Stablecoin Peg Durumu */}
      {stablecoins.length > 0 && (
        <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 rounded-xl bg-ax-green/10">
              <DollarSign size={16} className="text-ax-green" />
            </div>
            <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Stablecoin Peg</h2>
            <span className="ml-auto px-2 py-1 rounded-lg bg-ax-surface border border-ax-border text-[10px] text-ax-dim font-mono shadow-inner">Kaynak: {formatTime(stableTimestamp)}</span>
          </div>
          <div className="flex flex-wrap gap-3 relative z-10">
            {stablecoins.map(sc => (
              <StablecoinBadge key={sc.symbol} symbol={sc.symbol} price={sc.price} />
            ))}
          </div>
        </div>
      )}

      {/* Yüksek APY Radar */}
      {highApyPools.length > 0 && (
        <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 rounded-xl bg-ax-amber/10">
              <TrendingUp size={16} className="text-ax-amber" />
            </div>
            <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Beefy Radar</h2>
            <span className="ml-auto text-[10px] text-ax-dim font-mono bg-ax-surface px-2 py-1 rounded-lg border border-ax-border shadow-inner">(scope: Beefy)</span>
          </div>
          <div className="mb-4 p-3 rounded-xl border border-ax-border bg-ax-surface text-[11px] text-ax-dim font-mono relative z-10 shadow-inner">
            Burasi gozlem ekranidir. Liste Beefy ile sinirli olsa da, execution karari icin guardrail ve autopilot kurallari ayrica gecer.
          </div>
          <div className="relative z-10">
            {highApyPools.slice(0, 10).map((pool, i) => (
              <PoolRow key={`high-apy-${pool.poolId || pool.id || i}`} pool={pool} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* En İyi Havuzlar */}
      {pools.length > 0 && (
        <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 rounded-xl bg-ax-cyan/10">
              <TrendingUp size={16} className="text-ax-cyan" />
            </div>
            <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Beefy Havuzları</h2>
            <span className="ml-auto text-[10px] text-ax-dim font-mono bg-ax-surface px-2 py-1 rounded-lg border border-ax-border shadow-inner">(scope içinde APY sırası)</span>
          </div>
          <div className="mb-4 p-3 rounded-xl border border-ax-border bg-ax-surface text-[11px] text-ax-dim font-mono relative z-10 shadow-inner">
            Bu liste artik genel piyasa degil, yalnizca Beefy evrenidir. Yine de "en iyi" ifadesi execution uygunlugu degil, ham APY sirasi anlamina gelir.
          </div>
          <div className="relative z-10">
            {pools.slice(0, 10).map((pool, i) => (
              <PoolRow key={pool.poolId || pool.id || i} pool={pool} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Günlük Getiri Potansiyeli */}
      {potentialPools.length > 0 && (
        <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-5 relative z-10">
            <div className="p-2 rounded-xl bg-ax-green/10">
              <TrendingUp size={16} className="text-ax-green" />
            </div>
            <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Beefy Execution Universe</h2>
            <span className="ml-auto text-[10px] text-ax-green font-mono bg-ax-green/10 px-2 py-1 rounded-lg border border-ax-green/20 shadow-inner">($1000 bazında günlük)</span>
          </div>
          <div className="mb-4 p-3 rounded-xl border border-ax-green/20 bg-ax-green/10 text-[11px] text-ax-green font-mono relative z-10 shadow-inner">
            Yoruma en yakin liste burasi. Su anki Base + Beefy zap-aday mantigina en yakin ekran bu bolumdur.
          </div>
          <div className="relative z-10">
            {potentialPools.slice(0, 8).map((pool, i) => (
              <PotentialPoolRow key={`potential-${pool.poolId || pool.id || i}`} pool={pool} rank={i + 1} />
            ))}
          </div>
        </div>
      )}

      {/* Alpha Sniper Board */}
      <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="p-2 rounded-xl bg-ax-red/10">
            <Activity size={16} className="text-ax-red" />
          </div>
          <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Alpha Sniper Board</h2>
          <span className="ml-auto text-[10px] text-ax-red font-mono bg-ax-red/10 px-2 py-1 rounded-lg border border-ax-red/20 shadow-inner">mode: {alphaMode}</span>
        </div>
        <div className="mb-4 p-3 rounded-xl border border-ax-red/20 bg-ax-red/5 text-[11px] text-ax-dim font-mono relative z-10 shadow-inner">
          Bu board artik varsayilan olarak sadece on-chain event ile yakalanan adaylari gosterir. Scan kaynakli mevcut havuzlar burada yeni havuz gibi sunulmaz.
        </div>
        <div className="relative z-10">
          {alphaCandidates.length > 0 ? (
            <div>
              {alphaCandidates.slice(0, 10).map((candidate, i) => (
                <AlphaCandidateRow key={candidate.candidateId || i} candidate={candidate} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 rounded-2xl border border-ax-border bg-ax-surface border-dashed text-ax-dim text-[11px] font-mono uppercase tracking-widest">
              Henuz event-backed yeni havuz adayi yok. Board bos olabilir; bu, scan verisinin gizlendigi ve sadece gercek on-chain kesiflerin beklendigi anlamina gelir.
            </div>
          )}
        </div>
      </div>

      {/* On-Chain Discovery Events */}
      <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="p-2 rounded-xl bg-ax-cyan/10">
            <RefreshCw size={16} className="text-ax-cyan" />
          </div>
          <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">On-Chain Discovery Events</h2>
          <span className="ml-auto text-[10px] text-ax-dim font-mono bg-ax-surface px-2 py-1 rounded-lg border border-ax-border shadow-inner">{alphaEvents.length} event</span>
        </div>
        <div className="mb-4 p-3 rounded-xl border border-ax-border bg-ax-surface text-[11px] text-ax-dim font-mono relative z-10 shadow-inner">
          Bu akis factory seviyesinde yeni `PoolCreated` olaylarini gosterir. Liste bossa sistem bozuk degil; o pencerede yeni havuz olayi gelmemis olabilir.
        </div>
        <div className="relative z-10">
          {alphaEvents.length > 0 ? (
            <div>
              {alphaEvents.slice(0, 10).map((event, i) => (
                <AlphaEventRow key={event.eventId || i} event={event} rank={i + 1} />
              ))}
            </div>
          ) : (
            <div className="text-center py-10 rounded-2xl border border-ax-border bg-ax-surface border-dashed text-ax-dim text-[11px] font-mono uppercase tracking-widest">
              Son polling penceresinde yeni pool creation olayi yakalanmadi.
            </div>
          )}
        </div>
      </div>

      {/* Risk Alertleri */}
      <div className="rounded-3xl ax-glass border border-ax-border p-6 relative overflow-hidden group">
        <div className="flex items-center gap-3 mb-5 relative z-10">
          <div className="p-2 rounded-xl bg-ax-amber/10">
            <Activity size={16} className="text-ax-amber" />
          </div>
          <h2 className="text-ax-heading text-sm font-black uppercase tracking-widest">Risk Alertleri</h2>
          <span className="ml-auto text-[10px] text-ax-dim font-mono bg-ax-surface px-2 py-1 rounded-lg border border-ax-border shadow-inner">{alerts.length} toplam</span>
        </div>

        <div className="relative z-10">
          {recentAlerts.length > 0 ? (
            <div className="space-y-3">
              {recentAlerts.map((alert, i) => (
                <div key={alert.id || i} className={`flex items-start gap-3 p-4 rounded-2xl border bg-ax-surface shadow-inner hover:bg-ax-muted transition-colors ${levelColor(alert.level)}`}>
                  <div className={`w-2 h-2 rounded-full shrink-0 mt-1 ${levelDot(alert.level)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[10px] font-black uppercase tracking-widest opacity-80">{alert.level}</span>
                      <span className="text-[10px] font-mono opacity-50">{alert.type}</span>
                    </div>
                    <p className="text-xs leading-relaxed font-mono opacity-90">{alert.message}</p>
                  </div>
                  <span className="text-[10px] font-mono opacity-50 whitespace-nowrap shrink-0">
                    {new Date(alert.timestamp).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 rounded-2xl border border-ax-border bg-ax-surface border-dashed text-ax-dim">
              <ShieldCheck size={32} className="mb-3 text-ax-green" />
              <div className="text-[11px] font-black uppercase tracking-widest font-mono">Aktif alert yok — sistem izleniyor</div>
            </div>
          )}
        </div>
      </div>

      </>}{/* /defiTab overview */}
    </div>
  )
}
