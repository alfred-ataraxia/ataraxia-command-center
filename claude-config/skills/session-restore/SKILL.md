---
name: session-restore
description: Önceki Claude Code sessionlarını özetle ve bağlamı geri yükle. "son konuşmayı hatırlıyor musun", "session restore", "önceki konuşma", "son session" gibi ifadelerde tetiklen.
---

# Session Restore — Alfred

Yeni bir session başladığında veya kullanıcı önceki konuşmayı sorduğunda bu skill devreye girer.

## Ne Zaman Kullan

- "son konuşmayı hatırlıyor musun?"
- "önceki sessionda ne yapıyorduk?"
- "kaldığımız yerden devam edelim"
- "session restore"
- "bağlamı yükle"

## Adım 1 — Son Sessionları Listele

```bash
python3 ~/.claude/scripts/session-summary.py 24
```

## Adım 2 — Seçilen Session'ı Yükle

Kullanıcı bir session seçerse, tam içeriğini çıkar:

```bash
python3 - <<'PYEOF'
import json, sys
from pathlib import Path

SESSION_DIR = Path.home() / ".claude" / "projects" / "-home-sefa"

# En son session dosyasını bul
sessions = sorted(SESSION_DIR.glob("*.jsonl"), key=lambda f: f.stat().st_mtime, reverse=True)
if not sessions:
    print("Session bulunamadı.")
    sys.exit(0)

filepath = sessions[0]  # veya kullanıcının seçtiği

print(f"Session: {filepath.name}")
print("=" * 60)

user_msgs = []
tool_uses = []

with open(filepath) as f:
    for line in f:
        try:
            obj = json.loads(line)
            if obj.get("type") == "user":
                content = obj.get("message", {}).get("content", [])
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "text":
                            text = item["text"].strip()
                            if not text.startswith("<") and len(text) > 3:
                                user_msgs.append(text[:200])
            elif obj.get("type") == "assistant":
                content = obj.get("message", {}).get("content", [])
                if isinstance(content, list):
                    for item in content:
                        if isinstance(item, dict) and item.get("type") == "tool_use":
                            name = item.get("name", "")
                            inp = item.get("input", {})
                            fp = inp.get("file_path", inp.get("command", ""))[:80]
                            tool_uses.append(f"{name}: {fp}")
        except Exception:
            continue

print(f"\nKullanıcı Mesajları ({len(user_msgs)} adet):")
for i, m in enumerate(user_msgs, 1):
    print(f"  {i}. {m}")

print(f"\nTool Kullanımı ({len(tool_uses)} adet):")
for t in tool_uses[:20]:
    print(f"  - {t}")
PYEOF
```

## Adım 3 — Git Log ile Çapraz Kontrol

```bash
git -C /home/sefa/alfred-hub log --oneline --since="1 day ago" 2>/dev/null | head -10
```

## Adım 4 — Özet Sunumu

Çıktıyı analiz edip Master Sefa'ya şunu söyle:

```
Son session özeti:

**Ne üzerinde çalışıyorduk:** [user mesajlarından çıkar]
**Hangi dosyalar değişti:** [tool_uses'dan çıkar]  
**Son commit:** [git log'dan]
**Öneri:** [devam noktası]
```

## Notlar

- Session dosyaları: `~/.claude/projects/-home-sefa/*.jsonl`
- En büyük/en yeni dosya genellikle aktif session
- `<command-message>` içeren satırlar sistem mesajıdır, atla
- Hafıza dosyaları (`~/.claude/projects/-home-sefa/memory/`) ayrıca okunabilir
