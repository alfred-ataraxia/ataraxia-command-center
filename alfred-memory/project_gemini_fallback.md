---
name: Gemini CLI Entegrasyonu
description: Claude↔Gemini güvenli geçiş scripti ve Robin için Gemini Pro kullanımı
type: project
originSessionId: 0049017d-6ed7-43f2-a198-08736dd887ac
---
## ai-switch.sh (2026-04-10 tamamlandı)
`~/ai-switch.sh` — güvenli geçiş scripti. Kullanım:
```bash
ai-switch status   # RAM + aktif AI
ai-switch gemini   # Claude'u kapat, Gemini başlat
ai-switch claude   # Gemini'yi kapat, Claude başlat
```

**Why:** Claude + Gemini eş zamanlı çalışınca RPi OOM düşüyordu (Claude ~500MB + Gemini + HA ~431MB). Token swap yaklaşımı: önce kapat, sonra başlat.

**How to apply:** Token limiti yaklaşınca `ai-switch gemini` ile geç. Konuşma bitince `ai-switch claude` ile geri dön.

## Robin → Gemini Pro
`task-runner.sh`'da Robin'e atanan görevler `preferred_model: "gemini"` aldığında Gemini 2.5 Pro ile çalışıyor. Araştırma raporu `/home/sefa/alfred-hub/command-center/reports/` dizinine yazılıyor.

## OpenClaw Durumu
OpenClaw **rafa kalktı** — tüm eski görevler iptal. Dashboard ayakta tutuluyor.

## Gemini CLI
Kurulu: `/usr/bin/gemini` v0.37.0, OAuth: `~/.gemini/oauth_creds.json`
