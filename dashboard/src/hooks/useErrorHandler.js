import { useToast } from '../components/useToast'

export function useErrorHandler() {
  const { addToast } = useToast()

  const handleError = (error, defaultMessage = 'Bir hata oluştu') => {
    let message = defaultMessage

    if (error instanceof Error) {
      message = error.message
    } else if (typeof error === 'object' && error !== null) {
      message = error.error || error.message || defaultMessage
    } else if (typeof error === 'string') {
      message = error
    }

    addToast(message, 'error')
    console.error('Error:', error)
  }

  const handleFetchError = async (response, defaultMessage = 'API isteği başarısız') => {
    if (!response.ok) {
      let errorData
      try {
        errorData = await response.json()
      } catch {
        errorData = { error: `HTTP ${response.status}` }
      }

      const message = errorData.error || errorData.message || defaultMessage
      addToast(message, 'error')
      throw new Error(message)
    }
    return response
  }

  return { handleError, handleFetchError }
}
