---
name: Gemini CLI Entegrasyonu
description: Claude↔Gemini guvenli gecis scripti ve Robin icin Gemini Pro kullanimi
type: project
originSessionId: 0049017d-6ed7-43f2-a198-08736dd887ac
updated: 2026-04-14
---
## ai-switch.sh (2026-04-10 tamamlandi)
`~/ai-switch.sh` — guvenli gecis scripti. Kullanim:
```bash
ai-switch status   # RAM + aktif AI
ai-switch gemini   # Claude'u kapat, Gemini baslat
ai-switch claude   # Gemini'yi kapat, Claude baslat
```

**Durum:** Artik stub/kullanilmiyor. OpenClaw (MiniMax-M2.7) aktif tek AI olarak calisiyor. Claude Code ve Gemini CLI "gelecek faz" olarak planlanmis.

**Why:** Claude + Gemini es zamanli calisinca RPi OOM dusuyordu (Claude ~500MB + Gemini + HA ~431MB).

## Robin → Gemini Pro
**Durum:** Robin henuz kurulamadi. VPS olmadigi icin uzak ajan sistemi "gelecek faz".

## OpenClaw Durumu
OpenClaw **aktif** — Telegram'da calisiyor (MiniMax-M2.7 model). Alfred burada.

## Gemini CLI
Kurulu: `/usr/bin/gemini` v0.37.0, OAuth: `~/.gemini/oauth_creds.json`
**Durum:** Gelecek fazda kullanilabilir.