import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(() => {
    const saved = localStorage.getItem('ax-theme')
    return saved ? saved === 'dark' : true
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('ax-theme', dark ? 'dark' : 'light')
  }, [dark])

  return (
    <button
      onClick={() => setDark(d => !d)}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ax-muted/50 border border-ax-border hover:bg-ax-muted transition-colors w-full"
      title={dark ? 'Açık tema' : 'Koyu tema'}
    >
      {dark ? <Sun size={14} className="text-ax-amber" /> : <Moon size={14} className="text-ax-accent" />}
      <span className="text-xs text-ax-dim">{dark ? 'Açık Tema' : 'Koyu Tema'}</span>
    </button>
  )
}
