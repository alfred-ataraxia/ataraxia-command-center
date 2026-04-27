#!/bin/bash
# Daily Cost Check — 23:00 Istanbul
# Heartbeat already handles light checks; this does hard CSV-based accounting.

LOGS_DIR="/home/sefa/openclaw-logs"
MONTH=$(date '+%Y-%m')
COST_FILE="${LOGS_DIR}/costs-${MONTH}.csv"
LOG="${LOGS_DIR}/cost-check.log"
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
TODAY=$(date '+%Y-%m-%d')
OPENCLAW=~/.npm-global/bin/openclaw

mkdir -p "$LOGS_DIR"
[ ! -f "$COST_FILE" ] && echo "date,task_description,model_used,estimated_tokens,estimated_cost" > "$COST_FILE"

DAILY_TOTAL=$(awk -F',' -v today="$TODAY" '$1 == today { sum += $NF } END { printf "%.4f", sum+0 }' "$COST_FILE")
MONTHLY_TOTAL=$(awk -F',' '{ sum += $NF } END { printf "%.4f", sum+0 }' "$COST_FILE")

echo "[${TIMESTAMP}] Daily: \$$DAILY_TOTAL | Monthly: \$$MONTHLY_TOTAL" >> "$LOG"

ALERT=""
(( $(echo "$DAILY_TOTAL > 6.00"   | bc -l) )) && ALERT="🔴 Günlük harcama \$$DAILY_TOTAL — hard limit aşıldı!"
(( $(echo "$DAILY_TOTAL > 5.00"   | bc -l) )) && [ -z "$ALERT" ] && ALERT="🟡 Günlük harcama \$$DAILY_TOTAL — limite yakın."
(( $(echo "$MONTHLY_TOTAL > 50.00" | bc -l) )) && ALERT="🛑 Aylık limit aşıldı: \$$MONTHLY_TOTAL"
(( $(echo "$MONTHLY_TOTAL > 25.00" | bc -l) )) && [ -z "$ALERT" ] && ALERT="🟡 Aylık harcama \$$MONTHLY_TOTAL — uyarı eşiği."

if [ -n "$ALERT" ]; then
  echo "[${TIMESTAMP}] ALERT: $ALERT" >> "$LOG"
  $OPENCLAW agent \
    --channel telegram \
    --reply-to "telegram:963702150" \
    --deliver \
    --message "$ALERT" >> "$LOG" 2>&1
else
  echo "[${TIMESTAMP}] Maliyet normal." >> "$LOG"
fi
