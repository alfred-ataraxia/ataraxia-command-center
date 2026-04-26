#!/bin/bash
# shared-notes.md rotation — 100 satırı aşınca archive'e taşı
set -euo pipefail

NOTES="/home/sefa/.openclaw/workspace/memory/inbox/shared-notes.md"
ARCHIVE_DIR="/home/sefa/.openclaw/workspace/memory/inbox/archive"
THRESHOLD=100

mkdir -p "$ARCHIVE_DIR"

LINE_COUNT=$(wc -l < "$NOTES" 2>/dev/null || echo 0)

if [ "$LINE_COUNT" -gt "$THRESHOLD" ]; then
  STAMP=$(date +%Y-%m-%d)
  DEST="$ARCHIVE_DIR/shared-notes-$STAMP.md"
  cp "$NOTES" "$DEST"
  # Son 20 satırı koru (en güncel notlar)
  tail -20 "$NOTES" > "${NOTES}.tmp" && mv "${NOTES}.tmp" "$NOTES"
  echo "[$(date -Iseconds)] Rotasyon: $LINE_COUNT satır → $DEST (son 20 satır korundu)"
else
  echo "[$(date -Iseconds)] Rotasyon gerekmedi: $LINE_COUNT satır (threshold: $THRESHOLD)"
fi
