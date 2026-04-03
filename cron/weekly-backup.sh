#!/bin/bash
# Weekly Backup — Her Pazar 02:00 Istanbul

BACKUP_DIR="/home/sefa/.openclaw/backups"
LOG="${BACKUP_DIR}/backup.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
OPENCLAW=~/.npm-global/bin/openclaw

mkdir -p "$BACKUP_DIR"

echo "[${TIMESTAMP}] Starting weekly backup..." >> "$LOG"

# Workspace backup
WS_BACKUP="${BACKUP_DIR}/workspace-$(date +%Y-%m-%d).tar.gz"
tar -czf "$WS_BACKUP" -C /home/sefa/.openclaw workspace/ 2>&1 >> "$LOG"
WS_SIZE=$(du -h "$WS_BACKUP" | cut -f1)

# Auth/config backup
AUTH_BACKUP="${BACKUP_DIR}/auth-$(date +%Y-%m-%d).tar.gz"
tar -czf "$AUTH_BACKUP" -C /home/sefa/.openclaw auth/ config/ 2>/dev/null || true
AUTH_SIZE=$(du -h "$AUTH_BACKUP" 2>/dev/null | cut -f1 || echo "0B")

# Eski session .reset dosyalarını temizle (30 günden eski)
find /home/sefa/.openclaw/agents/main/sessions/ -name "*.reset.*" -mtime +30 -delete 2>/dev/null && \
  echo "[${TIMESTAMP}] Old session reset files cleaned." >> "$LOG"

# Eski backup'ları temizle (8 haftadan eski)
find "$BACKUP_DIR" -name "workspace-*.tar.gz" -mtime +56 -delete 2>/dev/null
find "$BACKUP_DIR" -name "auth-*.tar.gz" -mtime +56 -delete 2>/dev/null

echo "[${TIMESTAMP}] Backup complete: workspace (${WS_SIZE}), auth (${AUTH_SIZE})" >> "$LOG"

$OPENCLAW agent \
  --channel telegram \
  --reply-to "telegram:963702150" \
  --deliver \
  --message "✅ Haftalık yedek tamamlandı: workspace (${WS_SIZE}), auth (${AUTH_SIZE})" >> "$LOG" 2>&1
