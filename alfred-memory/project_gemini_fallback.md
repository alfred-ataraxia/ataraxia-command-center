---
name: Gemini CLI Fallback Sistemi
description: Claude token limiti dolunca Gemini CLI'ya geçiş planı — yarım kaldı, sistem çöktü
type: project
originSessionId: 1cf708bd-2ced-4a58-8ca8-4b61012e4efb
---
## Durum
Token limiti dolduğunda Gemini CLI'ya geçiş yapan fallback sistemi kurulmaya çalışıldı. Session ortasında RPi çöktü, çalışma kayboldu.

**Why:** Claude Code'un token limiti dolunca iş durmaması için Gemini Free Tier (veya mevcut quota) devreye girecekti.

**How to apply:** Konuya dönüldüğünde — Gemini CLI kurulu (`/usr/bin/gemini` v0.37.0), OAuth ayarlı (`~/.gemini/oauth_creds.json`). Kaldığımız yerden devam et.

## OpenClaw Durumu
OpenClaw **komple rafa kalktı** (eski konuşmada karar verildi). Sprint 1'deki S1-02/03/04/05 görevleri bu yüzden "Durduruldu" — sadece dashboard ayakta tutuluyor.

## Çöküş Analizi
Claude Code (~500MB) + Gemini CLI + Home Assistant (~431MB) aynı anda çalıştırınca RPi 400 (4GB RAM) OOM'a düştü. Kernel log'da iz kalmamış ama bellek baskısı açık.

## Önlem
- Claude Code aktifken Gemini CLI **aynı anda** başlatma
- Fallback sistemi: önce Claude'u kapat, sonra Gemini başlat (token swap, eş zamanlı değil)
