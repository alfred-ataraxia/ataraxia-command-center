#!/bin/bash
# Weekly Summary Report — Her Pazartesi 09:00 Istanbul
# Tamamlanan görevler, bekleyen görevler, sistem metrikleri, cron sağlık durumu

WORKSPACE="/home/sefa/.openclaw/workspace"
REPORTS_DIR="${WORKSPACE}/reports"
LOG="${WORKSPACE}/cron/weekly-report.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
DATE_TAG=$(date +%Y-%m-%d)
WEEK_START=$(date -d "7 days ago" +%Y-%m-%d)
OPENCLAW=~/.npm-global/bin/openclaw

mkdir -p "$REPORTS_DIR"

echo "[${TIMESTAMP}] Starting weekly report..." >> "$LOG"

# 1. Görev istatistikleri
TASKS_JSON="${WORKSPACE}/TASKS.json"
if [ -f "$TASKS_JSON" ]; then
  TOTAL=$(grep -c '"id"' "$TASKS_JSON" 2>/dev/null || echo 0)
  COMPLETED=$(grep -c '"status": "done"' "$TASKS_JSON" 2>/dev/null || echo 0)
  PENDING=$(grep -c '"status": "pending"' "$TASKS_JSON" 2>/dev/null || echo 0)
  IN_PROGRESS=$(grep -c '"status": "in_progress"' "$TASKS_JSON" 2>/dev/null || echo 0)
else
  TOTAL=0
  COMPLETED=0
  PENDING=0
  IN_PROGRESS=0
fi

# Tamamlanma yüzdesi
if [ "$TOTAL" -gt 0 ]; then
  COMPLETION_PCT=$((COMPLETED * 100 / TOTAL))
else
  COMPLETION_PCT=0
fi

# 2. Sistem metrikleri
CPU="N/A"
RAM="N/A"
DISK="N/A"
UPTIME="N/A"

# Fallback: direkt sistem komutları
if command -v top >/dev/null 2>&1; then
  CPU=$(top -bn1 2>/dev/null | grep "Cpu(s)" | awk '{printf("%.1f%%", 100-$8)}' || echo "N/A")
fi
if command -v free >/dev/null 2>&1; then
  RAM=$(free 2>/dev/null | grep Mem | awk '{printf("%.0f%%", ($3/$2)*100)}' || echo "N/A")
fi
if command -v df >/dev/null 2>&1; then
  DISK=$(df / 2>/dev/null | tail -1 | awk '{print $5}' || echo "N/A")
fi
if command -v uptime >/dev/null 2>&1; then
  UPTIME=$(uptime -p 2>/dev/null || uptime | awk '{print $(NF-2)" "$(NF-1)" "$(NF)}' || echo "N/A")
fi

# 3. Cron sağlık durumu (log dosyaları)
CRON_HEALTH="✅ Sağlıklı"
CRON_ERRORS=$(find "${WORKSPACE}/cron" -name "*.log" -type f -mtime -1 -exec grep -c "FATAL\|CRITICAL\|panic\|crash" {} \; 2>/dev/null | awk '{sum+=$1} END {print sum+0}')

if [ "$CRON_ERRORS" -gt 0 ]; then
  CRON_HEALTH="⚠️ ${CRON_ERRORS} kritik hatası var"
fi

# Cron job sayısı
CRON_COUNT=$(crontab -l 2>/dev/null | grep -c "^[^#]" || echo "0")

# 4. Rapor oluştur
REPORT_CONTENT="📊 Haftalık Özet Raporu
📅 ${DATE_TAG} (${WEEK_START} - ${DATE_TAG})

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ GÖREV İSTATİSTİKLERİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📈 Toplam Görevler: ${TOTAL}
  ✓ Tamamlanan: ${COMPLETED} (${COMPLETION_PCT}%)
  ⏳ Bekleyen: ${PENDING}
  🔄 Devam Ediyor: ${IN_PROGRESS}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⚙️ SİSTEM METRİKLERİ
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔴 CPU: ${CPU}
🟢 RAM: ${RAM}
🟡 Disk: ${DISK}
⏰ Uptime: ${UPTIME}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🕐 CRON SAĞLIK DURUMU
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Durumu: ${CRON_HEALTH}
Aktif Jobs: ${CRON_COUNT}
Log Dizini: ${WORKSPACE}/cron/

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Generated: ${TIMESTAMP}
"

# 5. Raporu dosyaya kaydet
REPORT_FILE="${REPORTS_DIR}/weekly-${DATE_TAG}.txt"
echo "$REPORT_CONTENT" > "$REPORT_FILE"
REPORT_SIZE=$(du -h "$REPORT_FILE" | cut -f1)
echo "[${TIMESTAMP}] Report saved: ${REPORT_FILE} (${REPORT_SIZE})" >> "$LOG"

# 6. Telegram'a gönder
MSG="${REPORT_CONTENT}"
$OPENCLAW agent \
  --channel telegram \
  --reply-to "telegram:963702150" \
  --deliver \
  --message "$(echo -e "$MSG")" >> "$LOG" 2>&1

echo "[${TIMESTAMP}] Report sent to Telegram." >> "$LOG"
echo "[${TIMESTAMP}] Weekly report complete." >> "$LOG"
