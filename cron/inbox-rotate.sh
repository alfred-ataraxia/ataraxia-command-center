#!/bin/bash
# Inbox Rotation Script

INBOX_DIR="/home/sefa/.openclaw/workspace/memory/inbox"
ARCHIVE_DIR="${INBOX_DIR}/archive"
LOG="${INBOX_DIR}/inbox-rotate.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

mkdir -p "$ARCHIVE_DIR"
echo "[${TIMESTAMP}] Starting: Inbox Rotation..." >> "$LOG"

# Find files older than 7 days and move them to archive
find "$INBOX_DIR" -maxdepth 1 -type f -mtime +7 -print0 | while IFS= read -r -d $'\0' FILE; do
    FILENAME=$(basename "$FILE")
    mv "$FILE" "$ARCHIVE_DIR/"
    echo "[${TIMESTAMP}] Moved $FILENAME to archive." >> "$LOG"
done

echo "[${TIMESTAMP}] Inbox Rotation finished." >> "$LOG"
