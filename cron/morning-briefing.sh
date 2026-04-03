#!/bin/bash
# Morning Briefing Cron Job
# Runs at 07:00 Istanbul time (GMT+3)
# Sends to Telegram

WORKSPACE="/home/sefa/.openclaw/workspace"
LOG="${WORKSPACE}/cron/morning-briefing.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
OPENCLAW=~/.npm-global/bin/openclaw

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
  MSG="${HEADER}${BRIEFING}"
  $OPENCLAW agent --channel telegram --reply-to "telegram:963702150" --deliver --message "$(echo -e "$MSG")" >> "$LOG" 2>&1
  echo "[${TIMESTAMP}] Briefing sent." >> "$LOG"
else
  echo "[${TIMESTAMP}] No briefing content." >> "$LOG"
fi
