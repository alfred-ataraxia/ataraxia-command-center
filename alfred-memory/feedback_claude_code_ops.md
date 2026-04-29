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

## ai-switch.sh silindi (2026-04-17)

`/home/sefa/alfred-hub/scripts/ai-switch.sh` kalıcı olarak silindi.
**Why:** Codex güncellemesini engelliyordu; hiçbir hook/cron referansı yoktu, kullanılmıyordu.
**How to apply:** Bu dosyayı geri oluşturma veya arama — artık yok.

## Kurulu Skill'ler (2026-04-28)

`~/.claude/skills/` altında 18 skill mevcut:
- **Resmi Anthropic:** frontend-design, docx, pdf, pptx, xlsx, algorithmic-art, canvas-design, slack-gif-creator, web-artifacts-builder, mcp-builder, webapp-testing, brand-guidelines, internal-comms, skill-creator
- **3rd party:** ui-ux-pro-max (nextlevelbuilder), frontend-slides (zarazhangrui), huashu-design (alchaincyf)
- **Custom:** session-restore

Skill kurulum: SKILL.md dosyasını `~/.claude/skills/<name>/SKILL.md` olarak yaz. Güvenlik taraması: genel web erişimi yok, shell exec yok, LLM talimatlarını okuma.
