import { useState, useEffect, useRef } from 'react'
import { Timer, ListChecks, ScrollText, Zap, RefreshCw, Clock, CheckCircle2, Circle, AlertCircle, ChevronRight } from 'lucide-react'
import apiFetch from '../services/apiFetch'

function classifyLine(line) {
  const l = line.toLowerCase()
  if (l.includes('error') || l.includes('hata') || l.includes('fail') || l.includes('killed')) return 'text-ax-red'
  if (l.includes('warn') || l.includes('skip') || l.includes('uyarı')) return 'text-ax-amber'
  if (l.includes('done') || l.includes('tamamlandı') || l.includes('success')) return 'text-ax-green'
  if (l.includes('başladı') || l.includes('başlatılıyor') || l.includes('alındı')) return 'text-ax-cyan'
  return 'text-ax-dim'
}

function statusIcon(status) {
  if (status === 'done') return <CheckCircle2 size={13} className="text-ax-green shrink-0" />
  if (status === 'in_progress') return <Zap size={13} className="text-ax-amber shrink-0 animate-pulse" />
  if (status === 'error') return <AlertCircle size={13} className="text-ax-red shrink-0" />
  return <Circle size={13} className="text-ax-dim shrink-0" />
}

function Countdown({ targetTime }) {
  const [remaining, setRemaining] = useState('')

  useEffect(() => {
    function calc() {
      const diff = new Date(targetTime) - Date.now()
      if (diff <= 0) { setRemaining('Şimdi!'); return }
      const h = Math.floor(diff / 3_600_000)
      const m = Math.floor((diff % 3_600_000) / 60_000)
      const s = Math.floor((diff % 60_000) / 1_000)
      setRemaining(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`)
    }
    calc()
    const id = setInterval(calc, 1_000)
    return () => clearInterval(id)
  }, [targetTime])

  return <span className="font-mono text-ax-accent2 tabular-nums">{remaining}</span>
}

function parseCronHuman(schedule) {
  // e.g. "0 9,21 * * *" -> "Her gün 09:00 ve 21:00"
  // e.g. "0 3 * * *" -> "Her gün 03:00"
  const parts = schedule.trim().split(/\s+/)
  if (parts.length < 5) return schedule
  const [min, hour, dom, month, dow] = parts
  if (dom === '*' && month === '*' && dow === '*') {
    const hours = hour.split(',').map(h => `${String(h).padStart(2, '0')}:${String(min).padStart(2, '0')}`)
    return `Her gün ${hours.join(' ve ')}`
  }
  return schedule
}

export default function AutomationView() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const logBottomRef = useRef(null)

  async function fetchData() {
    setLoading(true)
    setError(null)
    try {
      const res = await apiFetch('/api/automation')
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const json = await res.json()
      setData(json)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  useEffect(() => {
    if (logBottomRef.current) {
      logBottomRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [data?.logLines])

  return (
    <div className="p-4 sm:p-6 max-w-6xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Timer size={18} className="text-ax-accent" />
          <h1 className="text-ax-heading text-xl font-bold">Otomasyon Merkezi</h1>
        </div>
        <button
          onClick={fetchData}
          className="p-2 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted transition-colors"
        >
          <RefreshCw size={13} className={`text-ax-dim ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-3 rounded-lg bg-ax-red/10 border border-ax-red/30 text-ax-red text-sm">
          Veri alınamadı: {error}
        </div>
      )}

      {/* Next run countdown */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {(data?.nextRuns ?? []).map((run, i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3 rounded-xl bg-ax-panel border border-ax-border">
            <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-ax-accent/15 border border-ax-accent/30">
              <Clock size={16} className="text-ax-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-ax-dim mb-0.5">{run.label})</p>
              <p className="text-[11px] text-ax-subtle truncate">
                {new Date(run.time).toLocaleString('tr-TR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-[10px] text-ax-subtle mb-0.5">Kalan</p>
              <Countdown targetTime={run.time} />
            </div>
          </div>
        ))}
        {!data && !error && loading && (
          <div className="col-span-2 h-16 rounded-xl bg-ax-panel border border-ax-border animate-pulse" />
        )}
      </section>

      {/* Cron schedules table */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight size={14} className="text-ax-accent" />
          <h2 className="text-sm font-semibold text-ax-heading">Cron Zamanlamaları</h2>
          <span className="text-[10px] text-ax-subtle px-1.5 py-0.5 rounded bg-ax-muted border border-ax-border">
            {data?.cronSchedules?.length ?? '—'}
          </span>
        </div>
        <div className="rounded-xl border border-ax-border overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-ax-panel border-b border-ax-border">
                <th className="text-left px-3 py-2 text-ax-subtle font-medium">Zamanlama</th>
                <th className="text-left px-3 py-2 text-ax-subtle font-medium hidden sm:table-cell">Açıklama</th>
                <th className="text-left px-3 py-2 text-ax-subtle font-medium">Komut</th>
              </tr>
            </thead>
            <tbody>
              {(data?.cronSchedules ?? []).length === 0 && (
                <tr>
                  <td colSpan={3} className="px-3 py-4 text-ax-subtle text-center">
                    {loading ? 'Yükleniyor...' : 'Cron kaydı yok'}
                  </td>
                </tr>
              )}
              {(data?.cronSchedules ?? []).map((cron, i) => (
                <tr key={i} className="border-b border-ax-border/50 hover:bg-ax-muted/40 transition-colors">
                  <td className="px-3 py-2.5 font-mono text-ax-accent/80 whitespace-nowrap">{cron.schedule}</td>
                  <td className="px-3 py-2.5 text-ax-dim hidden sm:table-cell">{parseCronHuman(cron.schedule)}</td>
                  <td className="px-3 py-2.5 text-ax-text truncate max-w-[200px] sm:max-w-xs font-mono">
                    <span title={cron.command}>{cron.command.replace('/home/sefa/', '~/')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Auto tasks list */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight size={14} className="text-ax-accent" />
          <h2 className="text-sm font-semibold text-ax-heading">Otomatik Görevler</h2>
          <span className="text-[10px] text-ax-subtle px-1.5 py-0.5 rounded bg-ax-muted border border-ax-border">
            {data?.autoTasks?.length ?? '—'} auto:true
          </span>
        </div>
        <div className="space-y-1.5">
          {(data?.autoTasks ?? []).length === 0 && (
            <p className="text-ax-subtle text-xs px-2">{loading ? 'Yükleniyor...' : 'Otomatik görev yok'}</p>
          )}
          {(data?.autoTasks ?? []).map(task => (
            <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-ax-panel border border-ax-border hover:bg-ax-muted/40 transition-colors">
              {statusIcon(task.status)}
              <span className="text-[10px] font-mono text-ax-subtle shrink-0 w-14">{task.id}</span>
              <span className="flex-1 text-xs text-ax-text truncate">{task.title}</span>
              <span className="text-[10px] text-ax-subtle shrink-0">{task.assignee}</span>
              <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${
                task.status === 'done'
                  ? 'bg-ax-green/10 border-ax-green/30 text-ax-green'
                  : task.status === 'in_progress'
                  ? 'bg-ax-amber/10 border-ax-amber/30 text-ax-amber'
                  : 'bg-ax-panel border-ax-border text-ax-subtle'
              }`}>
                {task.status}
              </span>
              <span className="text-[10px] text-ax-subtle shrink-0">{task.points}p</span>
            </div>
          ))}
        </div>
      </section>

      {/* Task-runner log */}
      <section>
        <div className="flex items-center gap-2 mb-3">
          <ChevronRight size={14} className="text-ax-accent" />
          <h2 className="text-sm font-semibold text-ax-heading">Task Runner Log</h2>
          <span className="text-[10px] text-ax-subtle px-1.5 py-0.5 rounded bg-ax-muted border border-ax-border">
            son {data?.logLines?.length ?? 0} satır
          </span>
        </div>
        <div className="rounded-xl border border-ax-border bg-ax-surface overflow-hidden">
          <div className="flex items-center justify-between px-3 py-1.5 border-b border-ax-border bg-ax-panel">
            <div className="flex items-center gap-1.5">
              <ScrollText size={11} className="text-ax-cyan" />
              <span className="text-[10px] text-ax-subtle font-mono">~/alfred-hub/logs/task-runner.log</span>
            </div>
            <span className="text-[10px] text-ax-subtle">{data?.generatedAt ? new Date(data.generatedAt).toLocaleString('tr-TR', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
          </div>
          <pre className="p-3 overflow-y-auto max-h-64 font-mono text-[11px] leading-5 space-y-px">
            {!data && loading && <span className="text-ax-subtle">Yükleniyor...</span>}
            {data?.logLines?.length === 0 && <span className="text-ax-subtle">Log boş</span>}
            {(data?.logLines ?? []).map((line, i) => (
              <div key={i} className={classifyLine(line)}>{line}</div>
            ))}
            <div ref={logBottomRef} />
          </pre>
        </div>
      </section>
    </div>
  )
}
