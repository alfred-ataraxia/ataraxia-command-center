import { useState } from 'react'
import { setToken } from '../services/apiFetch'

export default function LoginModal({ onLogin }) {
  const [token, setTokenInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!token.trim()) {
      setError('Token boş olamaz')
      return
    }
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/health', {
        headers: { Authorization: `Bearer ${token.trim()}` },
      })
      if (res.ok) {
        setToken(token.trim())
        onLogin()
      } else {
        setError('Geçersiz token. Tekrar deneyin.')
      }
    } catch {
      setError('Sunucuya bağlanılamadı.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
      <div className="bg-ax-panel border border-ax-border rounded-xl p-8 w-full max-w-sm shadow-2xl">
        <h2 className="text-xl font-bold text-ax-text mb-2">Ataraxia Dashboard</h2>
        <p className="text-ax-muted text-sm mb-6">Erişim için Bearer token giriniz.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Token..."
            value={token}
            onChange={e => setTokenInput(e.target.value)}
            className="w-full px-4 py-2 bg-ax-bg border border-ax-border rounded-lg text-ax-text placeholder-ax-muted focus:outline-none focus:border-ax-accent text-sm font-mono"
            autoFocus
          />
          {error && <p className="text-red-400 text-xs">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-ax-accent text-black font-semibold rounded-lg hover:opacity-90 disabled:opacity-50 text-sm"
          >
            {loading ? 'Doğrulanıyor...' : 'Giriş'}
          </button>
        </form>
      </div>
    </div>
  )
}
