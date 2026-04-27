#!/bin/bash
# Cron Job Başarısızlık Alerti — son 35 dakikada failed job varsa Telegram'a bildir
# Cron: */30 * * * * (task-runner ile aynı frekansta)
set -euo pipefail

LOCK_FILE="/tmp/cron-failure-alert.lock"
exec 9>"$LOCK_FILE"
if ! flock -n 9; then exit 0; fi

source /home/sefa/.openclaw/.env
TOKEN="${OPENCLAW_TELEGRAM_BOT_TOKEN}"
CHAT_ID="963702150"
DB="/home/sefa/.openclaw/tasks/runs.sqlite"
STATE_FILE="/tmp/cron-failure-alert-seen"

# Son 35 dakikada başarısız olan cron job'ları bul
FAILURES=$(python3 - <<'PY'
import sqlite3, json, time
conn = sqlite3.connect("/home/sefa/.openclaw/tasks/runs.sqlite")
conn.row_factory = sqlite3.Row
cutoff = (time.time() - 35 * 60) * 1000
cur = conn.execute("""
    SELECT label, status, error, run_id,
           datetime(started_at/1000, 'unixepoch', 'localtime') as started
    FROM task_runs
    WHERE runtime = 'cron'
      AND started_at > ?
      AND status IN ('failed', 'error')
    ORDER BY started_at DESC
""", (cutoff,))
rows = [dict(r) for r in cur.fetchall()]
conn.close()
print(json.dumps(rows))
PY
)

COUNT=$(python3 -c "import json,sys; print(len(json.loads(sys.argv[1])))" "$FAILURES" 2>/dev/null || echo 0)

if [ "$COUNT" -eq 0 ]; then
    exit 0
fi

# Daha önce bildirildi mi? (run_id bazlı deduplication)
SEEN_IDS=""
[ -f "$STATE_FILE" ] && SEEN_IDS=$(cat "$STATE_FILE")

NEW_FAILURES=$(python3 - "$FAILURES" "$SEEN_IDS" <<'PY'
import json, sys
failures = json.loads(sys.argv[1])
seen = set(sys.argv[2].split('\n')) if sys.argv[2] else set()
new = [f for f in failures if f.get('run_id','') not in seen]
print(json.dumps(new))
PY
)

NEW_COUNT=$(python3 -c "import json,sys; print(len(json.loads(sys.argv[1])))" "$NEW_FAILURES" 2>/dev/null || echo 0)

if [ "$NEW_COUNT" -eq 0 ]; then
    exit 0
fi

# Mesaj oluştur
MSG=$(python3 - "$NEW_FAILURES" <<'PY'
import json, sys
failures = json.loads(sys.argv[1])
lines = [f"❌ Cron Hata ({len(failures)} job)"]
for f in failures[:5]:
    label = f.get('label') or 'unknown'
    err = f.get('error','')[:60] if f.get('error') else f.get('status','?')
    lines.append(f"• {label}: {err}")
if len(failures) > 5:
    lines.append(f"... ve {len(failures)-5} daha")
print('\n'.join(lines))
PY
)

curl -s -X POST "https://api.telegram.org/bot${TOKEN}/sendMessage" \
    -d chat_id="$CHAT_ID" \
    --data-urlencode text="$MSG" \
    >/dev/null 2>&1 || true

# Bildirilen ID'leri kaydet
python3 -c "
import json, sys
failures = json.loads(sys.argv[1])
print('\n'.join(f.get('run_id','') for f in failures))
" "$NEW_FAILURES" >> "$STATE_FILE"

# State file'ı 200 satırla sınırla
tail -200 "$STATE_FILE" > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"

echo "[$(date '+%H:%M:%S')] ${NEW_COUNT} yeni cron hatası Telegram'a bildirildi"
