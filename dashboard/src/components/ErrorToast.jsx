import { useEffect } from 'react'

export default function ErrorToast({ message, type = 'error', onClose, duration = 10000, onRetry = null }) {
  useEffect(() => {
    if (!duration) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = type === 'error' ? 'bg-ax-red/10' : type === 'warning' ? 'bg-ax-amber/10' : 'bg-ax-green/10'
  const borderColor = type === 'error' ? 'border-ax-red/30' : type === 'warning' ? 'border-ax-amber/30' : 'border-ax-green/30'
  const textColor = type === 'error' ? 'text-ax-red' : type === 'warning' ? 'text-ax-amber' : 'text-ax-green'

  const iconPath = type === 'error'
    ? 'M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'
    : type === 'warning'
      ? 'M12 9v2m0 4v2m7.07-5.93a9 9 0 11-12.14 0'
      : 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z'

  return (
    <div className={`${bgColor} ${borderColor} border rounded-lg p-4 flex items-start gap-3 ${textColor} shadow-lg animate-in slide-in-from-top`}>
      <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={iconPath} />
      </svg>
      <div className="flex-1">
        <p className="text-sm font-medium">{message}</p>
        {onRetry && (
          <button
            onClick={() => { onRetry(); onClose() }}
            className="mt-1.5 text-xs underline opacity-75 hover:opacity-100 transition"
          >
            Tekrar Dene
          </button>
        )}
      </div>
      <button
        onClick={onClose}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-100 transition"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}
