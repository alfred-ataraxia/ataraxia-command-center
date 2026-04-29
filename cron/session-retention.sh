#!/bin/bash
set -euo pipefail

# Tüm OpenClaw agent session'larını temizle (main, alfred, mercer, mait)
AGENTS_BASE="/home/sefa/.openclaw/agents"
ARCHIVE_AGE=${ARCHIVE_AGE:-7}   # 7 günden eski → archive
DELETE_AGE=${DELETE_AGE:-14}    # 14 günden eski archive → sil

cleaned=0
freed_kb=0

for agent_dir in "$AGENTS_BASE"/*/sessions; do
  [[ -d "$agent_dir" ]] || continue
  agent=$(basename "$(dirname "$agent_dir")")
  archive_dir="$agent_dir/archive"
  mkdir -p "$archive_dir"

  # sessions.json'daki aktif referansları oku
  active_ids=""
  if [[ -f "$agent_dir/sessions.json" ]]; then
    active_ids=$(python3 -c "
import json
try:
    with open('$agent_dir/sessions.json') as f:
        d=json.load(f)
    ids=set()
    for v in d.values():
        if isinstance(v,dict) and 'sessionId' in v:
            ids.add(v['sessionId'])
    print('\n'.join(ids))
except: pass
" 2>/dev/null)
  fi

  # Eski orphan dosyaları archive'a taşı
  while IFS= read -r -d '' file; do
    fname=$(basename "$file" .jsonl)
    # Aktif referans varsa dokunma
    if echo "$active_ids" | grep -qF "$fname"; then
      continue
    fi
    size=$(du -k "$file" 2>/dev/null | cut -f1)
    mv -f "$file" "$archive_dir/"
    cleaned=$((cleaned+1))
    freed_kb=$((freed_kb+size))
  done < <(find "$agent_dir" -maxdepth 1 -type f -name "*.jsonl" -not -name "sessions.json" -mtime "+$ARCHIVE_AGE" -print0)

  # Archive'dan eski dosyaları sil
  find "$archive_dir" -type f -mtime "+$DELETE_AGE" -delete 2>/dev/null || true

  echo "[$(date '+%H:%M:%S')] $agent: cleaned=$cleaned freed=${freed_kb}KB"
  cleaned=0; freed_kb=0
done
