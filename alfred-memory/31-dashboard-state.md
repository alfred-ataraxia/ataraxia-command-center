# Dashboard State

**Son güncelleme:** 2026-04-29 · Claude Sonnet 4.6

---

## Konum ve Çalışma Modu

- Yol: `/home/sefa/alfred-hub/command-center/dashboard`
- Port: `4173` — ✅ aktif (HTTP 200)
- Çalışma modu: **`ataraxia-dashboard.service` (systemd) — AKTİF ve çalışıyor**
- Build: Vite production build, `dist/` klasörü, server.cjs statik dosyaları servis ediyor

## Mimari Özeti

- **Frontend:** React 19 + Vite 8, TanStack Query, Recharts
- **Backend:** `server.cjs` (~2600+ satır Node.js)
- **Görev kaynağı:** `TASKS.json`
- **21 React component:** Overview, AutomationView, DefiView, LogsView, MemoryView, OrchestrationView, TaskQueue, AlfredChat, StatsChart, vb. (AgentStatus silindi — dead code)

## UI Durumu (2026-04-28, S7-06 + Redesign)

- **Tasarım sistemi:** Territory Studio + Fathom HUD aesthetic
  - Dot-grid background, scan-line texture (desktop), hairline borders, corner accent (`ax-hud`)
  - Renk paleti: `ax-bg`, `ax-accent` (#6870D4), `ax-accent2` (#D46891)
  - View transition animasyonu — navigate'de `viewKey` ile tetikleniyor
- **Overview:** Command Station layout — StatusStrip (sticky vitals) + 3 kolon (Alfred | Work | Signals) + GitBar
- **AlfredChat:** Gerçek conversation history, localStorage kalıcılığı, `/api/alfred/ask` sync endpoint
- **Alfred XML bug fix:** `cleanReply()` + system prompt "ASLA tool_call üretme" koruması — commit `8ca2268`

## Erişim ve Auth (2026-04-19 güncel)

- **Auth:** Kaldırıldı — LAN-only, DASHBOARD_TOKEN boş → bypass
- GET endpoint'leri: public
- POST/PATCH/PUT: hâlâ Bearer token zorunlu (task mutation)
- HA proxy: `/api/ha/states/:entityId` — token frontend'e sızmıyor
- **⚠ Not:** Public internete açılırsa auth tekrar eklenmeli

## Güvenlik Düzeltmeleri (2026-04-19)

| Fix | Durum |
|-----|-------|
| Shell injection (commitTasksFile) | ✅ execFileSync + sanitize |
| VITE_HA_TOKEN browser bundle | ✅ Proxy üzerinden |
| Unauthenticated task mutation | ✅ Bearer zorunlu |
| injectToken XSS | ✅ Kaldırıldı |
| ?token= query param | ✅ Kaldırıldı |
| dashboard/.env git history | ✅ filter-repo + force-push |

## Alfred API Endpoint'leri

| Endpoint | Açıklama |
|----------|----------|
| `POST /api/alfred/ask` | Sync yanıt — `{text, messages}` → `{ok, reply}` — AlfredChat kullanıyor |
| `POST /api/alfred/message` | Async — Telegram'a iletir |
| `GET /api/sprint` | Aktif sprint özeti |
| `GET /api/tasks` | TASKS.json |
| `GET /api/daily-summary` | CoinGecko canlı fiyat |
| `GET /api/defi/*` | Proxy → 4180 |

## Açık Konular

- S7-07 OpenViking pilot — planlandı, henüz uygulanmadı
- Telegram bot service name: `telegram-bot` (doğrulama gerekli)
- `TOKEN_AUDIT.json` ve `logs/alfred-backup.log` uncommitted (auto-backup, minor)
