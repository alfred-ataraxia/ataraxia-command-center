import { useState, useEffect } from 'react'
import { Sun, Moon } from 'lucide-react'

export default function ThemeToggle() {
  // false = light (gündüz), true = dark (gece)
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('ax-theme')
    if (saved) return saved === 'dark'
    // Varsayılan: sistem saati ile otomatik
    return autoDarkMode()
  })

  // Otomatik gece modu: 23:00 - 07:00 arası karanlık
  function autoDarkMode() {
    const hour = new Date().getHours()
    return hour >= 23 || hour < 7
  }

  // Her dakika kontrol et
  useEffect(() => {
    const interval = setInterval(() => {
      const shouldBeDark = autoDarkMode()
      const saved = localStorage.getItem('ax-theme')
      const isManual = saved && (saved === 'force-dark' || saved === 'force-light')
      
      // Sadece otomatik moddaysa değiştir
      if (!isManual) {
        setIsDark(shouldBeDark)
        document.documentElement.setAttribute('data-theme', shouldBeDark ? 'dark' : 'light')
      }
    }, 60000) // Her 1 dakika

    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const saved = localStorage.getItem('ax-theme')
    // force-dark veya force-light manuel seçim
    if (saved === 'force-dark' || saved === 'force-light') {
      setIsDark(saved === 'force-dark')
      document.documentElement.setAttribute('data-theme', saved === 'force-dark' ? 'dark' : 'light')
    } else {
      // Otomatik mod
      const shouldBeDark = autoDarkMode()
      document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light')
      localStorage.setItem('ax-theme', isDark ? 'dark' : 'light')
    }
  }, [isDark])

  // Manuel toggle — otomatik modu kapatır
  const handleToggle = () => {
    const newDark = !isDark
    setIsDark(newDark)
    localStorage.setItem('ax-theme', newDark ? 'force-dark' : 'force-light')
  }

  const isAuto = autoDarkMode()
  const label = isAuto 
    ? (isDark ? 'Gece Modu' : 'Gündüz Modu')
    : (isDark ? 'Karanlık (Manuel)' : 'Aydınlık (Manuel)')

  return (
    <button
      onClick={handleToggle}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-ax-muted/50 border border-ax-border hover:bg-ax-muted transition-colors w-full"
      title={label}
    >
      {isDark ? <Sun size={14} className="text-ax-amber" /> : <Moon size={14} className="text-ax-accent" />}
      <span className="text-xs text-ax-dim">{label}</span>
      {isAuto && (
        <span className="ml-auto text-[10px] text-ax-green">auto</span>
      )}
    </button>
  )
}