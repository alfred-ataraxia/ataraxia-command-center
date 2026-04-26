import { useState, useCallback } from 'react'
import ErrorToast from './ErrorToast'
import { ToastContext } from './useToast'

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'error', duration = 10000, onRetry = null) => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, type, duration, onRetry }])
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast, removeToast }}>
      {children}
      <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
        {toasts.map(toast => (
          <ErrorToast
            key={toast.id}
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onRetry={toast.onRetry}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </div>
    </ToastContext.Provider>
  )
}
