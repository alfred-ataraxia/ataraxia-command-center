---
name: Claude Code Operasyon Notları
description: Claude Code CLI güncelleme protokolü ve bilinen kısıtlamalar
type: feedback
originSessionId: ab75af13-8e20-4a7a-b1a4-0b6475c0c8e3
---
## Güncelleme protokolü

`sudo npm install -g claude-code@latest` kullan — normal `npm install` EACCES hatası verir çünkü `/usr/lib/node_modules/` root'a aittir.

**Why:** İlk güncelleme denemesinde permission denied hatası alındı. Sudo ile çözüldü.

**How to apply:** Her Claude Code güncelleme isteğinde doğrudan sudo versiyonunu çalıştır.

## Versiyon notları

- Şu anki versiyon: **2.1.97** (2026-04-10 itibarıyla en güncel)
- npm registry'deki `claude-code@1.0.0` farklı bir paket — resmi paket `@anthropic-ai/claude-code` olabilir, `claude-code` değil
- Auto-update native çalışmıyor; manuel sudo güncellemesi gerekli

## /dream komutu

`~/.claude/commands/dream.md` olarak eklendi. `/dream` ile hafıza konsolidasyonu tetiklenir.
Kaynak: Piebald-AI/claude-code-system-prompts — agent-prompt-dream-memory-consolidation.md
