#!/bin/bash
# OOM-Guard & Alerting System
# RAM sınırında SIGKILL alan süreçleri tespit ve Telegram uyarısı gönder
# Cron: */5 * * * * (5 dakikada bir)

export PATH="/home/sefa/.npm-global/bin:/home/sefa/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/home/sefa"

LOG_DIR="/home/sefa/openclaw/logs"
OOM_LOG="$LOG_DIR/oom-events.log"
OOM_LOCK="/tmp/oom-guard.lock"

mkdir -p "$LOG_DIR"

# RAM treshold (800MB)
RAM_THRESHOLD_MB=800

# Get current memory stats
TOTAL_MB=$(free -m | awk '/^Mem:/{print $2}')
AVAILABLE_MB=$(free -m | awk '/^Mem:/{print $7}')
USED_MB=$((TOTAL_MB - AVAILABLE_MB))
USED_PERCENT=$((100 * USED_MB / TOTAL_MB))

# Check if we're near or exceeded the threshold
if [ "$AVAILABLE_MB" -lt "$RAM_THRESHOLD_MB" ]; then
  EVENT_TIME=$(date '+%Y-%m-%d %H:%M:%S')

  # Log event
  EVENT_MSG="[$EVENT_TIME] OOM-EVENT: RAM threshold exceeded. Used: ${USED_MB}MB/${TOTAL_MB}MB (${USED_PERCENT}%), Available: ${AVAILABLE_MB}MB (threshold: ${RAM_THRESHOLD_MB}MB)"
  echo "$EVENT_MSG" >> "$OOM_LOG"

  # Check for recent SIGKILL events in system logs (if available)
  KILLED_PROCS=""
  if command -v journalctl &>/dev/null; then
    KILLED_PROCS=$(journalctl --since="10 minutes ago" 2>/dev/null | grep -i "killed\|sigkill" | tail -5)
  fi

  # Find high-memory consuming processes
  TOP_PROCS=$(ps aux --sort=-%mem | head -6 | tail -5)

  # Build alert message
  ALERT_MSG="🚨 **Kritik: Claude RAM sınırını aştı ve durduruldu**
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏰ Zaman: $EVENT_TIME
💾 RAM Durumu: ${USED_MB}MB / ${TOTAL_MB}MB (${USED_PERCENT}%)
📊 Mevcut: ${AVAILABLE_MB}MB / Limit: ${RAM_THRESHOLD_MB}MB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔝 En Yüksek Kullanıcılar:
\`\`\`
${TOP_PROCS}
\`\`\`"

  if [ -n "$KILLED_PROCS" ]; then
    ALERT_MSG="$ALERT_MSG

💀 İlk Kurban:
\`\`\`
${KILLED_PROCS}
\`\`\`"
  fi

  ALERT_MSG="$ALERT_MSG

✅ Aksiyon: Otomatik bellek temizleme başlatıldı.
📝 Log: /home/sefa/openclaw/logs/oom-events.log"

  # Send Telegram alert
  openclaw agent --deliver "$ALERT_MSG" 2>/dev/null || {
    # Fallback: try direct curl if openclaw not available
    TOKEN=$(cat /home/sefa/.openclaw/workspace/telegram/token.txt 2>/dev/null | sed 's/REPLACE_WITH_REAL_BO.*//')
    CHAT_ID=$(cat /home/sefa/.openclaw/workspace/telegram/chat_id.txt 2>/dev/null)

    if [ -n "$TOKEN" ] && [ -n "$CHAT_ID" ] && [ "${#TOKEN}" -gt 20 ]; then
      curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
        -d "chat_id=${CHAT_ID}&text=${ALERT_MSG}&parse_mode=Markdown" >/dev/null 2>&1
    fi
  }

  # Aggressive cleanup: kill old Claude processes
  echo "[$EVENT_TIME] Cleanup: Killing stale Claude processes..." >> "$OOM_LOG"
  pkill -f "claude.*--session" --older 15m 2>/dev/null || true
  pkill -f "acpx.*--cwd" --older 10m 2>/dev/null || true

  # Clear caches
  sync && echo 3 > /proc/sys/vm/drop_caches 2>/dev/null || true

  echo "[$EVENT_TIME] Cleanup complete." >> "$OOM_LOG"

  # Increment counter in event log
  COUNTER_FILE="$LOG_DIR/.oom-counter"
  if [ -f "$COUNTER_FILE" ]; then
    COUNT=$(($(cat "$COUNTER_FILE") + 1))
  else
    COUNT=1
  fi
  echo "$COUNT" > "$COUNTER_FILE"

  # Append summary
  echo "[$EVENT_TIME] Total OOM events today: $COUNT" >> "$OOM_LOG"
  echo "" >> "$OOM_LOG"
fi
