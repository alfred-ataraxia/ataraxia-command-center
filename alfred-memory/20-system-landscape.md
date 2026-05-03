# System Landscape

**Son güncelleme:** 2026-04-30 · Alfred

## Ana Sistem

- Hostname: `ataraxia`
- Platform: Debian Trixie, aarch64
- Donanım: RPi 400, 4 GB RAM
- IP: `192.168.1.91`
- Swap: 4 GB swapfile, swappiness=10

## Çalışan Docker Servisleri (6 container)

| Container | Port | Amaç |
|-----------|------|------|
| `homeassistant` | 8123 | Akıllı ev (host network) |
| `homepage` | 3000 | LAN dashboard |
| `wireguard` | 51820/udp | VPN sunucusu |
| `nginx-proxy-manager-app-1` | 80, 81, 443 | Reverse proxy |
| `portainer` | 8000, 9443 | Docker yönetim UI |
| `duckdns` | — | Dinamik DNS |

## Systemd Servisleri

| Servis | Durum | Not |
|--------|-------|-----|
| `pihole-FTL.service` | ✅ running | DNS :53, unbound :5335 |
| `unbound.service` | ✅ running | DNS resolver |
| `docker.service` | ✅ running | Container runtime |
| `defi-apm.service` (system) | ✅ running | Port 4180 |
| `ataraxia-dashboard.service` (system) | ✅ running | Port 4173 |
| `openclaw-gateway.service` (user) | ✅ running | Port 18789 |
| `ataraxia-task-runner.timer` (user) | ⛔ disabled | OpenClaw cron tek scheduler |

## Araç Servisleri (non-Docker)

| Servis | Port | Durum |
|--------|------|-------|
| OpenViking server | 1933 | 🧪 Pilot aktif |
| OpenViking embedding | 1934 | 🧪 Pilot aktif |
| Pi-hole FTL | 53 | ✅ running |

## Otomasyon (OpenClaw Cron — 22 aktif job)

| Schedule | Job | Delivery | Not |
|----------|-----|----------|-----|
| `2,32 * * * *` | alfred-task-runner | none | ⛔ Disabled |
| `0 3 * * *` | Memory Dreaming Promotion | system | |
| `30 7 * * 1-5` | morning-briefing | **none** | Script kendi Telegram'ına gönderir |
| `0 12 * * 6,0` | morning-briefing-weekend | **none** | Script kendi Telegram'ına gönderir |
| `0 23 * * *` | evening-report | **none** | Script kendi Telegram'ına gönderir |
| `0 2 * * *` | alfred-backup | none | |
| `0 9 * * 3` | radar-weekly | none | |
| `30 2 * * 0` | memory-architect-archive | none | |
| `12,42 * * * *` | mercer-email-check | none | ⛔ Disabled |
| `36 21 * * *` | mait-daily-query | none | |
| `0 18 * * 0` | mait-weekly-query | none | |
| `0 8 * * 1` | mait-weekly-report | none | |
| `0 16 * * 5` | mait-weekly-review | none | |
| `15 23 * * *` | vault-sync-daily | none | |
| `0 22 * * 0` | vault-sync-weekly | none | |
| `0 21 * * 0` | alfred-weekly-summary | announce | Pazar özet |
| `0 20 * * *` | mercer-wallet-check | none | BudgetBakers |
| `30 4 * * 2` | openclaw-gateway-restart | none | Haftalık Salı |
| `0 */6 * * *` | token-audit | none | |
| `22,52 * * * *` | cron-failure-alert | none | ⛔ **Disabled (2026-04-30)** |
| `5 0 * * 1` | shared-notes-rotate | none | |
| `0 4 * * *` | session-retention-cleanup | none | |

## Archive Edilen Scriptler (2026-04-30)

Aşağıdaki scriptler hiçbir cron tarafından çağrılmıyordu, `~/archive/cron-scripts-2026-04-30/` altına taşındı:
- `hourly-report.sh` — saatlik rapor
- `cost-daily-check.sh` — günlük maliyet kontrolü
- `monday-review-trigger.sh` — Pazartesi review trigger
- `inbox-rotate.sh` — inbox rotasyonu (OpenClaw kendi `shared-notes-rotate` cron'unu kullanıyor)

## API Entegrasyonları

- **Telegram:** @blocksefa (ID: 963702150) — token `~/.openclaw/.env`'de
- **Home Assistant:** localhost:8123 — token dashboard `.env`'de
- **Pi-hole:** localhost:80/api (port 8080 admin)
- **CoinGecko:** fiyat API (morning briefing)
- **wttr.in:** hava durumu JSON API
- **BudgetBakers Wallet:** MCP server, JWT token (2026-05-29'da dolacak)

## Operasyonel Notlar

- Kaynak kısıtlı — RAM ~%73, swap 1.5-1.6GB kullanımda
- Gateway RSS ~560-790MB, CPU %14-30 arası
- Ağır işler sırayla çalışmalı, eşzamanlı değil
- Dashboard LAN-only, auth kapalı
- `cron-failure-alert` 2026-04-30'da disabled edildi (LLM yükü çok yüksek)