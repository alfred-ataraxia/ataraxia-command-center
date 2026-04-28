import { useState, useEffect, useRef } from 'react'
import { Send, MessageSquare, Trash2, Bot, User, Loader2 } from 'lucide-react'
import apiFetch from '../services/apiFetch'

const STORAGE_KEY = 'alfred-chat-v2'
const MAX_STORED = 24

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}
function saveHistory(msgs) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-MAX_STORED))) } catch {}
}

export default function AlfredChat({ compact = false }) {
  const [messages, setMessages] = useState(loadHistory)
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const submit = async () => {
    const t = text.trim()
    if (!t || loading) return

    const userMsg = { role: 'user', content: t, ts: Date.now() }
    const updated = [...messages, userMsg]
    setMessages(updated)
    saveHistory(updated)
    setText('')
    setLoading(true)
    setError(null)

    try {
      const ctx = updated.slice(-9, -1).map(m => ({ role: m.role, content: m.content }))
      const res = await apiFetch('/api/alfred/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: t, messages: ctx }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok || !data.reply) throw new Error(data.error || 'Yanıt alınamadı')

      const botMsg = { role: 'assistant', content: data.reply, ts: Date.now() }
      const final = [...updated, botMsg]
      setMessages(final)
      saveHistory(final)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  const clear = () => { setMessages([]); saveHistory([]); setError(null) }

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit() }
  }

  const displayed = messages.slice(compact ? -4 : -10)

  return (
    <div className={`rounded-xl ax-glass flex flex-col overflow-hidden ${compact ? 'h-72' : 'h-96'}`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-ax-border/50 shrink-0">
        <div className="w-1.5 h-1.5 rounded-full bg-ax-green animate-pulse" />
        <div className="p-1 rounded bg-ax-accent/10">
          <MessageSquare size={12} className="text-ax-accent" />
        </div>
        <span className="text-xs font-semibold text-ax-heading flex-1">Alfred</span>
        {messages.length > 0 && (
          <button onClick={clear} className="p-1 rounded hover:bg-ax-muted transition-colors text-ax-subtle hover:text-ax-red" title="Temizle">
            <Trash2 size={11} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2.5 min-h-0">
        {displayed.length === 0 && !loading && (
          <p className="text-ax-subtle text-[11px] font-mono text-center py-6 leading-relaxed">
            Ne söylemek istersin, efendim?
          </p>
        )}

        {displayed.map((msg, i) => (
          <div key={i} className={`flex gap-2 items-start ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
              msg.role === 'user' ? 'bg-ax-accent/20' : 'bg-ax-accent/10'
            }`}>
              {msg.role === 'user'
                ? <User size={9} className="text-ax-heading" />
                : <Bot size={9} className="text-ax-accent" />}
            </div>
            <div className={`max-w-[82%] px-3 py-2 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap ${
              msg.role === 'user'
                ? 'bg-ax-accent/12 border border-ax-accent/20 text-ax-text rounded-tr-sm'
                : 'bg-ax-surface border border-ax-border text-ax-text rounded-tl-sm'
            }`}>
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2 items-start">
            <div className="w-5 h-5 rounded-full bg-ax-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <Bot size={9} className="text-ax-accent" />
            </div>
            <div className="px-3 py-2 rounded-xl rounded-tl-sm bg-ax-surface border border-ax-border">
              <div className="flex gap-1 items-center">
                <div className="w-1 h-1 rounded-full bg-ax-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-ax-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 rounded-full bg-ax-accent animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        {error && (
          <p className="text-[10px] text-ax-red font-mono px-1">{error}</p>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t border-ax-border/50 shrink-0">
        <input
          ref={inputRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Soru veya komut..."
          disabled={loading}
          className="flex-1 px-3 py-1.5 rounded-lg bg-ax-surface border border-ax-border text-xs text-ax-text placeholder:text-ax-subtle focus:outline-none focus:ring-1 focus:ring-ax-accent/40 disabled:opacity-60 transition"
        />
        <button
          onClick={submit}
          disabled={loading || !text.trim()}
          className="w-7 h-7 rounded-lg bg-ax-accent text-white flex items-center justify-center hover:brightness-110 disabled:opacity-40 transition shrink-0"
          title="Gönder (Enter)"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
        </button>
      </div>
    </div>
  )
}
