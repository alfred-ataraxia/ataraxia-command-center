#!/bin/bash
set -euo pipefail

TOKEN=$(cat /home/sefa/.openclaw/workspace/telegram/token.txt 2>/dev/null || echo "")
CHAT_ID=$(cat /home/sefa/.openclaw/workspace/telegram/chat_id.txt 2>/dev/null || echo "")

# Fallback: dashboard/.env (don't print secrets)
if [[ -z "$TOKEN" || -z "$CHAT_ID" ]]; then
  ENV_PATH="/home/sefa/alfred-hub/command-center/dashboard/.env"
  if [[ -f "$ENV_PATH" ]]; then
    TOKEN_FROM_ENV=$(grep -E '^TELEGRAM_BOT_TOKEN=' "$ENV_PATH" | head -n 1 | cut -d= -f2- || true)
    CHAT_FROM_ENV=$(grep -E '^TELEGRAM_CHAT_ID=' "$ENV_PATH" | head -n 1 | cut -d= -f2- || true)
    TOKEN="${TOKEN:-$TOKEN_FROM_ENV}"
    CHAT_ID="${CHAT_ID:-$CHAT_FROM_ENV}"
  fi
fi

MSG="${1:-Test mesajı}"
if [[ -z "$TOKEN" || -z "$CHAT_ID" ]]; then
  echo "Missing credentials" >&2
  exit 3
fi
CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "https://api.telegram.org/bot$TOKEN/sendMessage" -d chat_id="$CHAT_ID" -d text="$MSG")
echo "HTTP $CODE" 
