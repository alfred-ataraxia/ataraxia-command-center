#!/bin/bash
# Saatlik durum raporu — Claude Code ile çalıştırılır
# Cron: 17 * * * *

export PATH="/home/sefa/.npm-global/bin:/home/sefa/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/home/sefa"

WORKSPACE="/home/sefa/.openclaw/workspace"
LOG_DIR="$HOME/openclaw/logs"
mkdir -p "$LOG_DIR"

REPORT_FILE="$LOG_DIR/hourly-report-$(date +%H%M).log"

# Sistem verileri
STATS=$(curl -s http://localhost:4175/api/stats 2>/dev/null)
CPU=$(echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('cpuPercent','?'))" 2>/dev/null || echo "?")
MEM=$(echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('memPercent','?'))" 2>/dev/null || echo "?")
DISK=$(echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('diskPercent','?'))" 2>/dev/null || echo "?")
UPTIME=$(echo "$STATS" | python3 -c "import sys,json; print(json.load(sys.stdin).get('uptimeHuman','?'))" 2>/dev/null || echo "?")

# Dashboard
DASH_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:4173/ 2>/dev/null)
DASH_STATUS="❌"
[ "$DASH_CODE" = "200" ] && DASH_STATUS="✅"

# Gateway
GW_STATUS="❌"
openclaw gateway status 2>&1 | grep -q "RPC probe: ok" && GW_STATUS="✅"

# Aktif görevler
TASKS=$(openclaw tasks list --status running 2>&1 | grep -E "acp|cli|subagent|cron" | grep -c "running" || echo "0")

# Son 1 saat git değişiklikleri
cd "$WORKSPACE"
CHANGES=$(git log --oneline --since="1 hour ago" 2>/dev/null)
[ -z "$CHANGES" ] && CHANGES="yok"

# Raporu oluştur
HOUR=$(date +%H:%M)
REPORT="**Saatlik Rapor — ${HOUR}**
- Sistem: CPU ${CPU}%, RAM ${MEM}%, Disk ${DISK}%
- Uptime: ${UPTIME}
- Dashboard: ${DASH_STATUS}
- Gateway: ${GW_STATUS}
- Aktif görevler: ${TASKS}
- Son 1 saat: ${CHANGES}
"

echo "$REPORT" > "$REPORT_FILE"

# Telegram'a gönder
openclaw agent --deliver "$REPORT" 2>/dev/null || echo "$REPORT"
