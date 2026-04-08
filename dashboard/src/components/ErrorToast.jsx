import { useEffect } from 'react'

export default function ErrorToast({ message, type = 'error', onClose, duration = 5000 }) {
  useEffect(() => {
    if (!duration) return
    const timer = setTimeout(onClose, duration)
    return () => clearTimeout(timer)
  }, [duration, onClose])

  const bgColor = type === 'error' ? 'bg-red-900' : type === 'warning' ? 'bg-yellow-900' : 'bg-green-900'
  const borderColor = type === 'error' ? 'border-red-800' : type === 'warning' ? 'border-yellow-800' : 'border-green-800'
  const textColor = type === 'error' ? 'text-red-200' : type === 'warning' ? 'text-yellow-200' : 'text-green-200'

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
