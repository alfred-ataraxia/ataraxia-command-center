#!/bin/bash
# Session Limiter — Aggressive memory management
# Runs every 5 minutes to prevent RAM exhaustion + OOM killer
# Kills: excess claude, orphaned openclaw-gateway, idle node processes

export PATH="/home/sefa/.npm-global/bin:/home/sefa/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

LOG_FILE="$HOME/.openclaw/logs/session-limiter-$(date +%Y%m%d).log"
mkdir -p "$(dirname "$LOG_FILE")"
LOG_TS="[$(date '+%Y-%m-%d %H:%M:%S')]"

# 1. CLAUDE SESSION LIMITING
SESSIONS=$(ps aux | grep -i "claude" | grep -v "grep" | grep -v "session-limiter" | awk '{print $2}')
SESSION_COUNT=$(echo "$SESSIONS" | grep -c . || echo 0)

echo "$LOG_TS Claude sessions: $SESSION_COUNT" >> "$LOG_FILE"

if [ "$SESSION_COUNT" -gt 1 ]; then
  PIDS=$(echo "$SESSIONS" | sort -n)
  TO_KILL=$(echo "$PIDS" | tail -n +2)
  for PID in $TO_KILL; do
    kill -9 "$PID" 2>/dev/null || true
    echo "$LOG_TS Killed excess claude PID $PID" >> "$LOG_FILE"
  done
fi

# 2. ORPHANED OPENCLAW-GATEWAY CLEANUP
GW_COUNT=$(pgrep -c "openclaw-gateway" 2>/dev/null || echo 0)
if [ "$GW_COUNT" -gt 0 ]; then
  pkill -9 openclaw-gateway 2>/dev/null || true
  echo "$LOG_TS Killed $GW_COUNT orphaned openclaw-gateway process(es)" >> "$LOG_FILE"
fi

# 3. IDLE NODE/NPM PROCESSES (older than 5 minutes)
pkill -f "npm exec\|^node" --older 5m 2>/dev/null || true

# 4. MEMORY PRESSURE RESPONSE
USED_MB=$(free -m | awk 'NR==2 {print $3}')
TOTAL_MB=$(free -m | awk 'NR==2 {print $2}')
AVAIL_MB=$(free -m | awk 'NR==2 {print $7}')
USED_PCT=$((USED_MB * 100 / TOTAL_MB))

echo "$LOG_TS Memory: ${USED_MB}/${TOTAL_MB}MB (${USED_PCT}%)" >> "$LOG_FILE"

# If memory pressure high, kill more aggressively
if [ "$USED_PCT" -gt 85 ]; then
  echo "$LOG_TS 🔴 CRITICAL: ${USED_PCT}% memory — emergency cleanup" >> "$LOG_FILE"

  # Kill all but newest claude
  SESSIONS=$(pgrep -f "claude" | sort -rn | tail -n +2)
  for PID in $SESSIONS; do
    kill -9 "$PID" 2>/dev/null || true
  done

  # Kill python processes (data heavy)
  pkill -9 python3 --older 2m 2>/dev/null || true

elif [ "$USED_PCT" -gt 80 ]; then
  echo "$LOG_TS ⚠️  WARNING: ${USED_PCT}% memory — aggressive cleanup" >> "$LOG_FILE"
  pkill -f "npm\|node\|python" --older 3m 2>/dev/null || true
else
  echo "$LOG_TS ✅ OK: ${USED_PCT}% memory — normal" >> "$LOG_FILE"
fi
