#!/usr/bin/env bash
# shared-notes-ingest.sh — shared-notes.md'den sadece Master Sefa notlarını vault'a taşır.
# Makine logları (DeFi tarama, incident, vault-sağlık) vault'a GİTMEZ — OpenClaw'da kalır.
set -euo pipefail

MEMORY_INBOX="/home/sefa/.openclaw/workspace/memory/inbox"
VAULT="/home/sefa/ikinci-beyin"
SRC_NOTES="$MEMORY_INBOX/shared-notes.md"
DEST_QUICK="$VAULT/notlar/hizli-notlar.md"

log() { echo "[$(date -Iseconds)] $1"; }

ensure_dest() {
  mkdir -p "$VAULT/notlar"
  if [ ! -f "$DEST_QUICK" ]; then
    cat > "$DEST_QUICK" <<'EOF'
---
type: quicklog
status: active
tags: [hizli-not, yakalama]
created: 2026-04-27
updated: 2026-04-27
---

# Hızlı Notlar

Sefa'nın hızlı yakalamalar ve kısa kararlar defteri.

EOF
  fi
}

ingest_sefa_notes() {
  [ -f "$SRC_NOTES" ] || return 0

  python3 - "$SRC_NOTES" "$DEST_QUICK" <<'PY'
import sys, re
from datetime import datetime

src, dest = sys.argv[1], sys.argv[2]
content = open(src, encoding='utf-8', errors='replace').read()

# Sadece "| Master Sefa" veya "| alfred" (Sefa taahhütleri) kayıtları
SEFA_AGENTS = {'master sefa', 'sefa', 'alfred'}

sections = re.split(r'^(## .+)$', content, flags=re.MULTILINE)
entries = []
i = 1
while i < len(sections) - 1:
    header = sections[i].strip()
    body   = sections[i+1].strip() if i+1 < len(sections) else ''
    i += 2

    m = re.match(r'^## (.+?) \| (.+)$', header)
    if not m:
        continue
    ts_raw, agent = m.group(1).strip(), m.group(2).strip().lower()
    if agent not in SEFA_AGENTS:
        continue

    # Not satırını çıkar
    note_m = re.search(r'- Not:\s*(.+)', body)
    if not note_m:
        continue
    note = note_m.group(1).strip()
    if not note or note == '—':
        continue

    # Tarih formatla
    try:
        dt = datetime.fromisoformat(ts_raw.replace('Z', '+00:00'))
        day = dt.strftime('%Y-%m-%d')
    except Exception:
        day = ts_raw[:10]

    entries.append((day, note))

if not entries:
    sys.exit(0)

# Mevcut içeriği oku, zaten yazılmış notları filtrele
existing = open(dest, encoding='utf-8', errors='replace').read()
new_lines = []
for day, note in entries:
    if note[:40] not in existing:
        new_lines.append(f'\n**{day}** — {note}')

if new_lines:
    with open(dest, 'a', encoding='utf-8') as f:
        f.write('\n'.join(new_lines) + '\n')
    print(f'{len(new_lines)} yeni not eklendi')
PY
}

run_ingest() {
  ensure_dest
  ingest_sefa_notes
}

case "${1:-}" in
  --rebuild|--ingest|"")
    run_ingest
    ;;
  *)
    run_ingest
    ;;
esac
