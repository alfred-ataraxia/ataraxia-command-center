export default function ErrorFallback({ error, onReset }) {
  return (
    <div className="flex items-center justify-center min-h-screen bg-ax-bg">
      <div className="bg-ax-card border border-ax-border rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="mb-4">
          <div className="w-12 h-12 bg-red-900 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-6 h-6 text-red-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>

        <h1 className="text-xl font-bold text-ax-text text-center mb-2">Bir Hata Oluştu</h1>
        <p className="text-sm text-ax-text-secondary text-center mb-4">
          Beklenmeyen bir sorun yaşandı. Lütfen sayfayı yenileyin veya başındaki adıma dönün.
        </p>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded p-3 mb-4">
            <p className="text-xs text-red-200 font-mono break-words">
              {error.message || 'Unknown error'}
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={onReset}
            className="flex-1 bg-ax-accent hover:bg-ax-accent-dark text-white font-medium py-2 px-4 rounded transition"
          >
            Yeniden Dene
          </button>
          <button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-ax-card border border-ax-border hover:bg-ax-bg text-ax-text font-medium py-2 px-4 rounded transition"
          >
            Ana Sayfa
          </button>
        </div>
      </div>
    </div>
  )
}
