#!/bin/bash
# Morning Briefing Cron Job
# Runs at 07:00 Istanbul time (GMT+3)
# Sends to Telegram

WORKSPACE="/home/sefa/.openclaw/workspace"
LOG="${WORKSPACE}/cron/morning-briefing.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

BOT_TOKEN=$(grep '^OPENCLAW_TELEGRAM_BOT_TOKEN=' ~/.openclaw/.env | cut -d= -f2-)
CHAT_ID=963702150

echo "[${TIMESTAMP}] Starting morning briefing..." >> "$LOG"

BRIEFING=""

# 1. Calendar events for today
CALENDAR=$(gog calendar today 2>/dev/null | head -5 || echo "")
[ -n "$CALENDAR" ] && BRIEFING+="📅 Today's Schedule\n${CALENDAR}\n\n"

# 2. Urgent unread messages
URGENT=$(himalaya list --limit 5 2>/dev/null | grep -i "urgent\|important" || echo "")
[ -n "$URGENT" ] && BRIEFING+="🔴 Urgent Messages\n${URGENT}\n\n"

# 3. Weather for Istanbul
WEATHER=$(curl -s "https://wttr.in/Istanbul?format=3" 2>/dev/null || echo "")
[ -n "$WEATHER" ] && BRIEFING+="🌤️ Weather: ${WEATHER}\n\n"

# 4. Top 3 priorities from yesterday's notes
YESTERDAY=$(date -d "yesterday" '+%Y-%m-%d')
if [ -f "${WORKSPACE}/memory/${YESTERDAY}.md" ]; then
  PRIORITIES=$(grep -i "priority\|top 3\|focus" "${WORKSPACE}/memory/${YESTERDAY}.md" 2>/dev/null | head -3 || echo "")
  [ -n "$PRIORITIES" ] && BRIEFING+="⚡ Top Priorities\n${PRIORITIES}\n"
fi

BRIEFING=$(echo -e "$BRIEFING" | head -c 1200)

if [ -n "$BRIEFING" ]; then
  HEADER="☀️ Morning Briefing — $(date '+%A, %d %B')\n\n"
  FINAL_MSG=$(echo -e "${HEADER}${BRIEFING}")

  PAYLOAD=$(jq -n \
    --arg chat_id "$CHAT_ID" \
    --arg text "$FINAL_MSG" \
    '{chat_id: ($chat_id | tonumber), text: $text}')

  HTTP_STATUS=$(curl -s -o /tmp/mb-response.json -w "%{http_code}" \
    -X POST "https://api.telegram.org/bot${BOT_TOKEN}/sendMessage" \
    -H "Content-Type: application/json" \
    -d "$PAYLOAD")

  if [ "$HTTP_STATUS" = "200" ]; then
    echo "[${TIMESTAMP}] Briefing sent (HTTP $HTTP_STATUS)." >> "$LOG"
  else
    echo "[${TIMESTAMP}] Telegram error HTTP $HTTP_STATUS: $(cat /tmp/mb-response.json)" >> "$LOG"
  fi
else
  echo "[${TIMESTAMP}] No briefing content, skipping." >> "$LOG"
fi
