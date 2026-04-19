#!/bin/bash
set -euo pipefail

LOG_ROOTS=(
  "${OPENCLAW_LOG_DIR:-/home/sefa/.openclaw/logs}"
  "/home/sefa/openclaw/logs"
  "/home/sefa/alfred-hub/logs"
  "/home/sefa/alfred-hub/command-center/dashboard/logs"
)

sanitize_file() {
  local file="$1"
  python3 - "$file" <<'PY'
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
try:
    content = path.read_text(encoding="utf-8")
except UnicodeDecodeError:
    content = path.read_text(encoding="utf-8", errors="ignore")

patterns = [
    (re.compile(r'(Bearer\s+)[A-Za-z0-9._\-+/=]+'), r'\1[REDACTED]'),
    (re.compile(r'(bot\d+:)[A-Za-z0-9_-]+'), r'\1[REDACTED]'),
    (re.compile(r'((?:token|secret|key|password)=)[^\s]+', re.IGNORECASE), r'\1[REDACTED]'),
    (re.compile(r'("(?:token|secret|key|password|authorization)"\s*:\s*")[^"]+(")', re.IGNORECASE), r'\1[REDACTED]\2'),
    (re.compile(r'\bgh[pousr]_[A-Za-z0-9]{20,}\b'), '[REDACTED_GITHUB_TOKEN]'),
    (re.compile(r'\bsk-[A-Za-z0-9_-]{12,}\b'), '[REDACTED_API_KEY]'),
    (re.compile(r'\beyJ[A-Za-z0-9._-]{20,}\b'), '[REDACTED_JWT]'),
]

sanitized = content
for pattern, replacement in patterns:
    sanitized = pattern.sub(replacement, sanitized)

if sanitized != content:
    path.write_text(sanitized, encoding="utf-8")
PY
}

for root in "${LOG_ROOTS[@]}"; do
  [ -d "$root" ] || continue

  while IFS= read -r -d '' file; do
    sanitize_file "$file"
  done < <(find "$root" -type f \( -name '*.log' -o -name '*.jsonl' \) -print0)

  find "$root" -type f \( -name '*.log' -o -name '*.jsonl' -o -name '*.out' \) -mtime +30 -delete
done
