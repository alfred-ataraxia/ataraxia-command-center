import React from 'react'

export default function LoadingSpinner({ size = 'md', message = null }) {
  const sizeClasses = {
    sm: 'w-4 h-4 border-2',
    md: 'w-6 h-6 border-2',
    lg: 'w-8 h-8 border-3',
  }

  return (
    <div className="flex items-center justify-center gap-2">
      <div className={`${sizeClasses[size]} border-ax-accent/20 border-t-ax-accent rounded-full animate-spin`} />
      {message && <span className="text-ax-dim text-sm">{message}</span>}
    </div>
  )
}
