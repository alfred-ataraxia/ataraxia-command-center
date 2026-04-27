import { useState } from 'react'
import { MessageSquare, Send, CheckCircle2, XCircle } from 'lucide-react'
import apiFetch from '../services/apiFetch'

export default function AlfredChat() {
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [result, setResult] = useState(null) // { ok, message }

  const submit = async () => {
    const t = text.trim()
    if (!t) return
    setSubmitting(true)
    setResult(null)
    try {
      const res = await apiFetch('/api/alfred/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t }),
      })
      const ct = (res.headers.get('content-type') || '').toLowerCase()
      if (!ct.includes('application/json')) {
        setResult({ ok: false, message: 'API yaniti JSON degil (dashboard servisi restart gerekebilir)' })
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setResult({ ok: false, message: data.error || 'Gonderilemedi' })
        return
      }
      setResult({ ok: true, message: 'Gonderildi' })
      setText('')
    } catch (e) {
      setResult({ ok: false, message: e?.message || 'Ag hatasi' })
    } finally {
      setSubmitting(false)
    }
  }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <div className="rounded-xl ax-glass p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-1.5 rounded-md bg-ax-purple/10"><MessageSquare size={14} className="text-ax-purple" /></div>
        <h2 className="text-xs font-bold uppercase text-ax-heading">Alfred</h2>
        {result && (
          <span className={`ml-auto text-[10px] font-mono px-2 py-1 rounded-lg border ${
            result.ok ? 'bg-ax-green/10 border-ax-green/20 text-ax-green' : 'bg-ax-red/10 border-ax-red/20 text-ax-red'
          }`}>
            {result.ok ? <CheckCircle2 size={12} className="inline -mt-0.5 mr-1" /> : <XCircle size={12} className="inline -mt-0.5 mr-1" />}
            {result.message}
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Alfred'e mesaj..."
          disabled={submitting}
          className="flex-1 px-3 py-2 rounded-xl bg-ax-surface border border-ax-border text-sm text-ax-text placeholder:text-ax-subtle focus:outline-none focus:ring-2 focus:ring-ax-accent/40 disabled:opacity-60"
        />
        <button
          onClick={submit}
          disabled={submitting || !text.trim()}
          className="w-10 h-10 rounded-xl bg-ax-purple text-white flex items-center justify-center hover:brightness-110 disabled:opacity-50 disabled:hover:brightness-100 transition"
          title="Gonder"
        >
          <Send size={16} className={submitting ? 'opacity-60' : ''} />
        </button>
      </div>
    </div>
  )
}
