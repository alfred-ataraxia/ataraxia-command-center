// Shared utility functions

export function classifyLine(line) {
  const l = line.toLowerCase()
  if (l.includes('error') || l.includes('hata') || l.includes('fail') || l.includes('killed')) return 'text-ax-red'
  if (l.includes('warn') || l.includes('skip') || l.includes('uyarı')) return 'text-ax-amber'
  if (l.includes('ok') || l.includes('done') || l.includes('success') || l.includes('tamamlandı')) return 'text-ax-green'
  if (l.includes('[') && l.includes(']')) return 'text-ax-cyan'
  return 'text-ax-dim'
}

export function timeAgo(iso) {
  if (!iso) return '—'
  const diff = Date.now() - new Date(iso).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'şimdi'
  if (m < 60) return `${m}dk`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}sa`
  return `${Math.floor(h / 24)}g`
}

export function formatTime(iso) {
  try {
    return new Date(iso).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

export function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}
