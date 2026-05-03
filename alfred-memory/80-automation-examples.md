# Automation Examples

Bu örnekler ortak hafızaya periyodik veya olay bazlı not düşmek için başlangıç şablonudur.

## Manuel Kullanım

```bash
/home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh codex dashboard "lint, test ve build gecti"
```

## Cron Örneği

Her 30 dakikada bir kısa durum notu:

```cron
*/30 * * * * /home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh cron heartbeat "periyodik hafiza yoklamasi"
```

## Ajan Bazlı Örnekler

Codex:

```bash
/home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh codex task "TaskQueue filtre mantigi guncellendi"
```

Claude Code:

```bash
/home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh claude memory "session ozeti kanonik hafizaya islenecek"
```

Gemini:

```bash
/home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh gemini research "arastirma sonucu dashboard otomasyon riskleri not edildi"
```

## Öneri

- Her ajan oturum sonunda en az bir not bırakmalı.
- Sık çalışan job'lar kısa yazmalı; ayrıntı gerekiyorsa kanonik dosya ayrıca güncellenmeli.
- Append-only inbox büyürse periyodik konsolidasyon yapılmalı.

## Hazır Cron Satırları

Her saat başı hafıza heartbeat:

```cron
0 * * * * /home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh cron heartbeat "ortak hafiza heartbeat"
```

Claude oturum kapanışından sonra kısa not:

```cron
5 * * * * /home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh claude session "periyodik session ozeti kontrol edildi"
```

Gün sonu konsolidasyon hatırlatıcısı:

```cron
55 23 * * * /home/sefa/.openclaw/workspace/memory/scripts/append-shared-note.sh system memory "gun sonu konsolidasyon kontrolu"
```
