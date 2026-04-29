---
name: Aktif Proje Durumu
description: Mevcut sprint, servisler ve proje durumu — hızlı referans
type: project
originSessionId: da46f33b-dba7-47ba-9f82-a285566adc06
---
## Sprint Durumu (2026-04-29)

- **Sprint-07 AKTİF** (2026-04-27 → 2026-05-10)
- S7-01 ✅, S7-02 ✅, S7-03 ✅, S7-04 ✅, S7-05 ✅, S7-06 ✅
- S7-07 (OpenViking pilot) 🧪 planlandı — henüz başlamadı
- Sprint detayı: `~/alfred-hub/command-center/sprints/sprint-07.md`

## Aktif Servisler

| Servis | Port | Durum |
|--------|------|-------|
| Dashboard | 4173 | ✅ systemd (`ataraxia-dashboard.service`) |
| DeFi APM | 4180 | ✅ systemd aktif, Faz 2 UI + Faz 3 Autopilot (simulateOnly) |
| OpenClaw | 18789 | ✅ Aktif, cron scheduler |
| Telegram Bot | — | ✅ systemd (`telegram-bot.service`) |

## Son Büyük Değişiklik

- Dashboard: Territory Studio + Fathom HUD redesign — commit `8ca2268` (2026-04-28)
- Alfred XML tool-call hallucination düzeltildi — `cleanReply()` + "ASLA tool_call" system prompt
- 18 yeni Claude skill kuruldu: `~/.claude/skills/`
- `AgentStatus.jsx` silindi (dead code)

## Kanonik Kaynak

Detaylı durum: `~/.openclaw/workspace/memory/40-active-work.md`
