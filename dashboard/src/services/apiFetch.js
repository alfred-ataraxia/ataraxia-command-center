/**
 * Centralized fetch helper that injects the dashboard Bearer token
 * from localStorage and dispatches 'auth:unauthorized' on 401.
 */

export const TOKEN_KEY = 'dashboard_token'

export function getToken() {
  const stored = localStorage.getItem(TOKEN_KEY)
  if (stored) return stored
  // Server'ın HTML'e inject ettiği token (window.__DASHBOARD_TOKEN)
  const injected = (typeof window !== 'undefined' && window.__DASHBOARD_TOKEN) ? window.__DASHBOARD_TOKEN : ''
  if (injected) setToken(injected)
  return injected
}

export function setToken(token) {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY)
}

export default async function apiFetch(url, options = {}) {
  const token = getToken()
  const headers = {
    ...(options.headers || {}),
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const res = await fetch(url, { ...options, headers })

  if (res.status === 401) {
    clearToken()
    window.dispatchEvent(new CustomEvent('auth:unauthorized'))
  }

  return res
}
