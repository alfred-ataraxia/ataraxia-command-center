/**
 * Centralized fetch helper.
 *
 * Dashboard artık LAN-only ve `DASHBOARD_TOKEN` kaldırıldığı için
 * token inject/login akışı kaldırıldı. Gerekirse ilgili endpoint'ler
 * backend tarafında yeniden korunabilir.
 */

export default async function apiFetch(url, options = {}) {
  return fetch(url, options)
}
