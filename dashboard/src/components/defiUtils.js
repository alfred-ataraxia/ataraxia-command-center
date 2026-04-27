// DeFi yardımcı fonksiyonlar ve sabitler

export const DEFI_API = '/api/defi'
export const REFRESH_INTERVAL = 60_000
export const SCAN_STALE_MS = 20 * 60 * 1000

export const CHAIN_BADGE = {
  ethereum: 'bg-ax-cyan/10 text-ax-cyan border-ax-cyan/20',
  arbitrum: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  optimism: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  base:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  polygon:  'bg-ax-purple/10 text-ax-purple border-ax-purple/20',
  Ethereum: 'bg-ax-cyan/10 text-ax-cyan border-ax-cyan/20',
  Arbitrum: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  Optimism: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  Base:     'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  Polygon:  'bg-ax-purple/10 text-ax-purple border-ax-purple/20',
}

export function formatUsd(value) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value)
}

export function formatUsdCompact(value) {
  if (value == null || !Number.isFinite(value)) return '—'
  return new Intl.NumberFormat('tr-TR', {
    style: 'currency', currency: 'USD',
    notation: value >= 1000 ? 'compact' : 'standard',
    maximumFractionDigits: value >= 1000 ? 1 : 0,
  }).format(value)
}

export function formatTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })
}

export function formatDateTime(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('tr-TR', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })
}

export function levelColor(level) {
  switch (level) {
    case 'CRITICAL': return 'text-ax-red bg-ax-red/10 border-ax-red/25'
    case 'WARN':     return 'text-ax-amber bg-ax-amber/10 border-ax-amber/25'
    case 'INFO':     return 'text-ax-cyan bg-ax-cyan/10 border-ax-cyan/25'
    default:         return 'text-ax-dim bg-ax-muted border-ax-border'
  }
}

export function levelDot(level) {
  switch (level) {
    case 'CRITICAL': return 'bg-ax-red animate-pulse'
    case 'WARN':     return 'bg-ax-amber'
    case 'INFO':     return 'bg-ax-cyan'
    default:         return 'bg-ax-subtle'
  }
}

export function statusTone(status) {
  const s = String(status || '').toUpperCase()
  if (s === 'FAILED')   return 'bg-ax-red/10 border-ax-red/25 text-ax-red'
  if (s === 'EXECUTED') return 'bg-ax-green/10 border-ax-green/25 text-ax-green'
  if (s === 'APPROVED') return 'bg-ax-cyan/10 border-ax-cyan/25 text-ax-cyan'
  if (s === 'PROPOSED') return 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber'
  return 'bg-ax-surface border-ax-border text-ax-dim'
}

export function shortHash(value) {
  if (!value || typeof value !== 'string') return null
  if (!value.startsWith('0x') || value.length < 12) return value
  return `${value.slice(0, 8)}…${value.slice(-4)}`
}

export function alphaDecisionTone(decision) {
  switch (String(decision || '').toUpperCase()) {
    case 'LIVE_ENTER':  return 'bg-ax-red/10 text-ax-red border-ax-red/25'
    case 'PAPER_ENTER': return 'bg-ax-cyan/10 text-ax-cyan border-ax-cyan/25'
    case 'WATCH':       return 'bg-ax-amber/10 text-ax-amber border-ax-amber/25'
    default:            return 'bg-ax-surface text-ax-dim border-ax-border'
  }
}

export function summaryToneClass(tone) {
  if (tone === 'danger') return 'bg-ax-red/10 border-ax-red/25 text-ax-red'
  if (tone === 'warn')   return 'bg-ax-amber/10 border-ax-amber/25 text-ax-amber'
  if (tone === 'ok')     return 'bg-ax-green/10 border-ax-green/25 text-ax-green'
  return 'bg-ax-surface border-ax-border text-ax-dim'
}
