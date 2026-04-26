#!/bin/bash
# System Monitor — eşik aşılınca Telegram uyarısı
# Spam önlemi: aynı metrik için 2 saat içinde tekrar uyarmaz

set -euo pipefail

LOCK_FILE="/tmp/system-monitor.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then
    exit 0
fi

source /home/sefa/.openclaw/.env
TOKEN="${OPENCLAW_TELEGRAM_BOT_TOKEN}"
CHAT_ID="963702150"
STATE_DIR="/tmp/system-monitor-state"
mkdir -p "$STATE_DIR"

DISK_THRESHOLD=85
CPU_THRESHOLD=3.5
MEM_THRESHOLD=88
COOLDOWN=7200  # 2 saat

alert() {
    local metric="$1" msg="$2"
    local state_file="$STATE_DIR/${metric}.last"
    local now; now=$(date +%s)
    local last=0
    [ -f "$state_file" ] && last=$(cat "$state_file")
    if (( now - last < COOLDOWN )); then
        return
    fi
    echo "$now" > "$state_file"
    curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
        -d chat_id="$CHAT_ID" \
        --data-urlencode text="🚨 ataraxia — $msg" \
        >/dev/null 2>&1 || true
    echo "[$(date '+%H:%M:%S')] ALERT: $msg"
}

# Disk
DISK=$(df / | tail -1 | awk '{print $5}' | sed 's/%//')
if (( DISK > DISK_THRESHOLD )); then
    DISK_TOTAL=$(df -h / | tail -1 | awk '{print $2}')
    alert "disk" "Disk %${DISK} (eşik: %${DISK_THRESHOLD}, toplam: ${DISK_TOTAL})"
fi

# CPU Load
CPU_LOAD=$(uptime | awk -F'load average:' '{print $2}' | cut -d, -f1 | awk '{printf "%.2f\n", $1}')
if awk "BEGIN {exit !(${CPU_LOAD} > ${CPU_THRESHOLD})}"; then
    alert "cpu" "CPU yük ${CPU_LOAD} (eşik: ${CPU_THRESHOLD}, $(nproc) çekirdek)"
fi

# RAM
MEM=$(free | awk '/^Mem:/ {printf "%.0f\n", $3/$2 * 100}')
if (( MEM > MEM_THRESHOLD )); then
    MEM_USED=$(free -h | awk '/^Mem:/ {print $3}')
    MEM_TOTAL=$(free -h | awk '/^Mem:/ {print $2}')
    alert "mem" "RAM %${MEM} — ${MEM_USED}/${MEM_TOTAL} (eşik: %${MEM_THRESHOLD})"
fi

echo "[$(date '+%H:%M:%S')] system-monitor OK (disk:${DISK}% cpu:${CPU_LOAD} mem:${MEM}%)"
