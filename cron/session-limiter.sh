#!/bin/bash
# Session Limiter — Keep max 1 Claude Code session active
# Runs every 5 minutes to prevent RAM exhaustion
# Author: Ataraxia automation

# Find all Claude sessions (excluding grep and this script)
SESSIONS=$(ps aux | grep -i "claude" | grep -v "grep" | grep -v "session-limiter" | awk '{print $2}')
SESSION_COUNT=$(echo "$SESSIONS" | grep -c . || echo 0)

# Log timestamp
LOG_FILE="$HOME/.openclaw/logs/session-limiter-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$LOG_FILE")"

echo "[$(date '+%Y-%m-%d %H:%M:%S')] Sessions detected: $SESSION_COUNT" >> "$LOG_FILE"

# If more than 1 session, keep newest, kill others
if [ "$SESSION_COUNT" -gt 1 ]; then
  # Get all PIDs sorted by time (oldest first)
  PIDS=$(echo "$SESSIONS" | sort -n)

  # Skip first (newest/current) and kill rest
  TO_KILL=$(echo "$PIDS" | tail -n +2)

  if [ -n "$TO_KILL" ]; then
    for PID in $TO_KILL; do
      echo "[$(date '+%Y-%m-%d %H:%M:%S')] Killing excess session PID $PID" >> "$LOG_FILE"
      kill -9 "$PID" 2>/dev/null || true
    done
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] Killed $(echo "$TO_KILL" | wc -w) excess sessions" >> "$LOG_FILE"
  fi
else
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] OK (sessions within limit)" >> "$LOG_FILE"
fi
