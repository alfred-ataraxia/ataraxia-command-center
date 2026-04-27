#!/bin/bash
# Weekly Backup — Her Pazar 02:00 Istanbul
# Son 4 yedek tutulur (count-based)

BACKUP_DIR="/home/sefa/.openclaw/backups"
LOG="${BACKUP_DIR}/backup.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE_TAG=$(date +%Y-%m-%d)
OPENCLAW=~/.npm-global/bin/openclaw

mkdir -p "$BACKUP_DIR"

echo "[${TIMESTAMP}] Starting weekly backup..." >> "$LOG"

# 1. Workspace backup (workspace/ dizini, node_modules hariç)
WS_BACKUP="${BACKUP_DIR}/workspace-${DATE_TAG}.tar.gz"
tar -czf "$WS_BACKUP" \
  --exclude='workspace/dashboard/node_modules' \
  --exclude='workspace/dashboard/dist' \
  -C /home/sefa/.openclaw workspace/ 2>&1 >> "$LOG"
WS_SIZE=$(du -h "$WS_BACKUP" | cut -f1)

# 2. TASKS.json ayrı yedek
cp /home/sefa/.openclaw/workspace/TASKS.json \
   "${BACKUP_DIR}/tasks-${DATE_TAG}.json" 2>/dev/null
echo "[${TIMESTAMP}] TASKS.json backed up." >> "$LOG"

# 3. Dashboard config yedek (package.json, vite.config.js, server.cjs)
DASH_BACKUP="${BACKUP_DIR}/dashboard-config-${DATE_TAG}.tar.gz"
tar -czf "$DASH_BACKUP" \
  -C /home/sefa/.openclaw/workspace/dashboard \
  package.json vite.config.js server.cjs stats-server.cjs 2>/dev/null
echo "[${TIMESTAMP}] Dashboard config backed up." >> "$LOG"

# Son 4 yedek tut (count-based)
keep_last_4() {
  local pattern="$1"
  # En yeni 4'ü tut, gerisini sil
  ls -t ${BACKUP_DIR}/${pattern} 2>/dev/null | tail -n +5 | xargs -r rm -f
}
keep_last_4 "workspace-*.tar.gz"
keep_last_4 "tasks-*.json"
keep_last_4 "dashboard-config-*.tar.gz"

# Eski session .reset dosyalarını temizle (30 günden eski)
find /home/sefa/.openclaw/agents/main/sessions/ -name "*.reset.*" -mtime +30 -delete 2>/dev/null && \
  echo "[${TIMESTAMP}] Old session reset files cleaned." >> "$LOG"

echo "[${TIMESTAMP}] Backup complete: workspace (${WS_SIZE})" >> "$LOG"

$OPENCLAW agent \
  --channel telegram \
  --reply-to "telegram:963702150" \
  --deliver \
  --message "✅ Haftalık yedek tamamlandı: workspace (${WS_SIZE})" >> "$LOG" 2>&1
