import { useState, useEffect, useRef, useCallback } from 'react'
import { ScrollText, RefreshCw, FileText, Clock, Radio, PauseCircle, PlayCircle, Trash2 } from 'lucide-react'
import apiFetch from '../services/apiFetch'

function formatSize(bytes) {
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

function formatTime(iso) {
  try {
    const d = new Date(iso)
    return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
  } catch { return '' }
}

function classifyLine(line) {
  const l = line.toLowerCase()
  if (l.includes('error') || l.includes('hata') || l.includes('fail') || l.includes('killed')) return 'text-ax-red'
  if (l.includes('warn') || l.includes('skip') || l.includes('uyarı')) return 'text-ax-amber'
  if (l.includes('ok') || l.includes('done') || l.includes('success') || l.includes('tamamlandı')) return 'text-ax-green'
  if (l.includes('[') && l.includes(']')) return 'text-ax-cyan'
  return 'text-ax-dim'
}

export default function LogsView() {
  const [files, setFiles]       = useState([])
  const [selected, setSelected] = useState(null)
  const [lines, setLines]       = useState([])
  const [live, setLive]         = useState(true)
  const [connected, setConnected] = useState(false)
  const [loading, setLoading]   = useState(true)
  const esRef    = useRef(null)
  const bottomRef = useRef(null)
  const liveRef   = useRef(live)
  liveRef.current = live

  // Fetch file list
  async function fetchFiles() {
    setLoading(true)
    try {
      const res = await apiFetch('/api/logs')
      if (res.ok) {
        const data = await res.json()
        const list = data.logs || []
        setFiles(list)
        if (list.length > 0 && !selected) setSelected(list[0].name)
      }
    } catch {}
    setLoading(false)
  }

  useEffect(() => { fetchFiles() }, [])

  // Connect SSE when file selected
  useEffect(() => {
    if (!selected) return

    // Close previous
    if (esRef.current) { esRef.current.close(); esRef.current = null }
    setLines([])
    setConnected(false)

    const es = new EventSource(`/api/logs/stream?file=${encodeURIComponent(selected)}`)
    esRef.current = es

    es.onopen = () => setConnected(true)

    es.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data)
        if (msg.type === 'init') {
          const newLines = msg.content.split('\n').filter(Boolean)
          setLines(newLines)
        } else if (msg.type === 'append') {
          const newLines = msg.content.split('\n').filter(Boolean)
          setLines(prev => [...prev, ...newLines])
        }
      } catch {}
    }

    es.onerror = () => setConnected(false)

    return () => { es.close(); setConnected(false) }
  }, [selected])

  // Auto-scroll when live mode on
  useEffect(() => {
    if (live && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [lines, live])

  const clearLog = useCallback(() => setLines([]), [])

  return (
    <div className="flex flex-col h-full p-4 sm:p-6 gap-4 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScrollText size={18} className="text-ax-cyan" />
          <h1 className="text-ax-heading text-xl font-bold">Canlı Kayıtlar</h1>
          <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] font-medium ${
            connected
              ? 'bg-ax-green/10 border-ax-green/30 text-ax-green'
              : 'bg-ax-red/10 border-ax-red/30 text-ax-red'
          }`}>
            <Radio size={8} className={connected ? 'animate-pulse' : ''} />
            {connected ? 'CANLI' : 'KESİLDİ'}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLive(v => !v)}
            title={live ? 'Takibi durdur' : 'Takip et'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-ax-panel border border-ax-border text-ax-dim text-xs hover:bg-ax-muted transition-colors"
          >
            {live ? <PauseCircle size={13} /> : <PlayCircle size={13} />}
            {live ? 'Durdur' : 'Takip Et'}
          </button>
          <button
            onClick={clearLog}
            title="Ekranı temizle"
            className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors"
          >
            <Trash2 size={13} className="text-ax-dim" />
          </button>
          <button
            onClick={fetchFiles}
            className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors"
          >
            <RefreshCw size={13} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 flex-1 min-h-0">
        {/* File list */}
        <div className="w-52 shrink-0 space-y-1 overflow-y-auto">
          {files.length === 0 && !loading && (
            <p className="text-ax-subtle text-xs px-2">Log dosyası yok.</p>
          )}
          {files.map(f => (
            <button
              key={f.name}
              onClick={() => setSelected(f.name)}
              className={[
                'w-full text-left px-3 py-2 rounded-lg border text-xs transition-colors',
                selected === f.name
                  ? 'bg-ax-accent/15 border-ax-accent/40 text-ax-accent'
                  : 'bg-ax-panel border-ax-border text-ax-dim hover:bg-ax-muted hover:text-ax-text',
              ].join(' ')}
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <FileText size={10} />
                <span className="font-medium truncate">{f.name}</span>
              </div>
              <div className="flex items-center justify-between text-[10px] text-ax-subtle">
                <span>{formatSize(f.size)}</span>
                <span>{formatTime(f.mtime)}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Terminal */}
        <div className="flex-1 bg-ax-surface border border-ax-border rounded-xl overflow-hidden flex flex-col min-h-0">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-ax-border bg-ax-panel">
            <span className="text-ax-subtle text-[10px] font-mono">{selected || '— dosya seç —'}</span>
            <span className="text-ax-subtle text-[10px]">{lines.length} satır</span>
          </div>
          <pre className="flex-1 overflow-y-auto p-3 font-mono text-[11px] leading-5 space-y-px">
            {lines.length === 0 && (
              <span className="text-ax-subtle">Bekleniyor...</span>
            )}
            {lines.map((line, i) => (
              <div key={i} className={classifyLine(line)}>
                {line}
              </div>
            ))}
            <div ref={bottomRef} />
          </pre>
        </div>
      </div>
    </div>
  )
}
