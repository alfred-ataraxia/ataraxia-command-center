#!/bin/bash
set -euo pipefail

SESSIONS_DIR="${SESSIONS_DIR:-/home/sefa/.openclaw/agents/main/sessions}"
ARCHIVE_DIR="${ARCHIVE_DIR:-$SESSIONS_DIR/archive}"

if [ ! -d "$SESSIONS_DIR" ]; then
  echo "sessions directory missing: $SESSIONS_DIR" >&2
  exit 0
fi

mkdir -p "$ARCHIVE_DIR"

find "$SESSIONS_DIR" -maxdepth 1 -type f -mtime +14 -print0 | while IFS= read -r -d '' file; do
  mv -f "$file" "$ARCHIVE_DIR/"
done

find "$ARCHIVE_DIR" -type f -mtime +30 -delete
