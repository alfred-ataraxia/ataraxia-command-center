#!/bin/bash
set -euo pipefail
TOKEN=$(cat /home/sefa/.openclaw/workspace/telegram/token.txt 2>/dev/null || echo "")
CHAT_ID=$(cat /home/sefa/.openclaw/workspace/telegram/chat_id.txt 2>/dev/null || echo "")
MSG="${1:-Test mesajı}"
if [[ -z "$TOKEN" || -z "$CHAT_ID" ]]; then
  echo "Missing credentials" >&2
  exit 3
fi
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" -d chat_id="$CHAT_ID" -d text="$MSG")
echo "HTTP $CODE" 
