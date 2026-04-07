#!/bin/bash
# PM2 Zombie Process Cleaner
# Her task-worker çalıştırılmadan önce çalışır
# Orphan Node.js ve Vite süreçlerini temizler (30+ dakika eski)

export PATH="/home/sefa/.npm-global/bin:/home/sefa/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"

LOG_DIR="/home/sefa/openclaw/logs"
mkdir -p "$LOG_DIR"
LOG="$LOG_DIR/cleanup-orphans-$(date +%Y%m%d-%H%M).log"

echo "=== Orphan Process Cleanup $(date) ===" >> "$LOG"

# Zaman eşiği: 30 dakika
THRESHOLD=$((30 * 60))

# Boot time'ı al (saniye cinsinden)
BOOT_TIME=$(awk '{print $1}' /proc/uptime | cut -d. -f1)
NOW=$(date +%s)
REFERENCE=$((NOW - BOOT_TIME))

# Node.js ve Vite süreçlerini tara (/proc doğrudan, ps aux yok)
for PID in /proc/[0-9]*/stat; do
  PID_NUM="${PID%/stat}"
  PID_NUM="${PID_NUM##*/}"

  # Yalnızca node/vite/claude süreçleri kontrol et
  if [ -f "/proc/$PID_NUM/comm" ]; then
    COMM=$(cat "/proc/$PID_NUM/comm" 2>/dev/null)
    if ! echo "$COMM" | grep -qE "node|vite|python"; then
      continue
    fi

    # İşlem başlangıç zamanını al
    if [ -f "/proc/$PID_NUM/stat" ]; then
      START_JIFFIES=$(awk '{print $22}' "/proc/$PID_NUM/stat" 2>/dev/null)
      if [ -z "$START_JIFFIES" ]; then continue; fi

      START_TIME=$((REFERENCE + START_JIFFIES / 100))
      ELAPSED=$((NOW - START_TIME))

      # 30 dakikadan eski mi?
      if [ "$ELAPSED" -gt "$THRESHOLD" ]; then
        echo "Killing PID $PID_NUM (${ELAPSED}s old): $COMM" >> "$LOG" 2>/dev/null
        kill -9 "$PID_NUM" 2>/dev/null || true
      fi
    fi
  fi
done

# PM2 zombie proseslerini temizle
pm2 list 2>/dev/null | grep -i "stopped\|errored" | awk '{print $2}' | while read -r app_id; do
  if [ ! -z "$app_id" ] && [ "$app_id" != "id" ]; then
    echo "Removing PM2 zombie: $app_id" >> "$LOG"
    pm2 delete "$app_id" 2>/dev/null || true
  fi
done

echo "=== Cleanup complete ===" >> "$LOG"
