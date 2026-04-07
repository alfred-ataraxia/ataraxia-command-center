#!/bin/bash
# Görev işçisi — TASKS.json'da in_progress olan EN ÖNCELİKLİ TEK görevi Claude Code ile çalıştırır
# Cron: */15 * * * * (15 dakikada bir)
# Kurallar:
#   - Aynı anda max 1 görev çalışır (Pi 4GB RAM koruması)
#   - Öncelik sırası: high > medium > low, aynıysa eski olan önce
#   - Görev bitince otomatik done olur, sıradaki in_progress başlar

export PATH="/home/sefa/.npm-global/bin:/home/sefa/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/home/sefa"

WORKSPACE="/home/sefa/.openclaw/workspace"
TASKS_FILE="$WORKSPACE/TASKS.json"
LOG_DIR="$HOME/openclaw/logs"
LOCK_FILE="/tmp/task-worker.lock"
mkdir -p "$LOG_DIR"

LOG="$LOG_DIR/task-worker-$(date +%Y%m%d-%H%M).log"

echo "=== Task Worker $(date) ===" >> "$LOG"

# Prevent overlapping runs
if [ -f "$LOCK_FILE" ]; then
  PID=$(cat "$LOCK_FILE")
  if kill -0 "$PID" 2>/dev/null; then
    echo "Already running (PID $PID), skipping." >> "$LOG"
    exit 0
  fi
  echo "Stale lock found (PID $PID dead), removing." >> "$LOG"
  rm -f "$LOCK_FILE"
fi
echo $$ > "$LOCK_FILE"
trap "rm -f $LOCK_FILE" EXIT

# Aggressive cleanup: Kill stale processes and reclaim memory
pkill -f "claude.*--session" --older 30m 2>/dev/null || true
pkill -f "acpx.*--cwd" --older 20m 2>/dev/null || true
sleep 1

# Check RAM before starting — abort if less than 400MB free
FREE_MB=$(free -m | awk '/^Mem:/{print $7}')
if [ "$FREE_MB" -lt 400 ]; then
  echo "Low memory: ${FREE_MB}MB available, need 400MB. Skipping." >> "$LOG"
  exit 0
fi

# Find the single highest-priority in_progress task
TASK_INFO=$(python3 -c "
import json
PRIORITY_ORDER = {'high': 0, 'medium': 1, 'low': 2}

with open('$TASKS_FILE') as f:
    data = json.load(f)

tasks = [t for t in data['tasks'] if t['status'] == 'in_progress']
if not tasks:
    exit(0)

# Sort: high > medium > low, then by created_at (oldest first)
tasks.sort(key=lambda t: (PRIORITY_ORDER.get(t.get('priority','medium'), 1), t.get('created_at','')))

t = tasks[0]
print(f\"{t['id']}|{t['title']}|{t.get('description','')}\")
" 2>/dev/null)

if [ -z "$TASK_INFO" ]; then
  echo "No in_progress tasks found." >> "$LOG"
  exit 0
fi

TASK_ID=$(echo "$TASK_INFO" | cut -d'|' -f1)
TASK_TITLE=$(echo "$TASK_INFO" | cut -d'|' -f2)
TASK_DESC=$(echo "$TASK_INFO" | cut -d'|' -f3)

echo "Working on: $TASK_ID — $TASK_TITLE" >> "$LOG"
echo "Description: $TASK_DESC" >> "$LOG"
echo "" >> "$LOG"

# Build the prompt for Claude Code (lightweight for memory efficiency)
PROMPT="Ataraxia Command Center: Görev $TASK_ID — $TASK_TITLE

Açıklama: $TASK_DESC

Çalışma alanı: $WORKSPACE
Dashboard: $WORKSPACE/dashboard/

Yapılacaklar:
1. Görevi tamamla
2. Derle varsa
3. TASKS.json'da status → done
4. Kısa çalış"

cd "$WORKSPACE"
# Run with 5 minute timeout to prevent SIGTERM + memory exhaustion
timeout 300 claude --dangerously-skip-permissions --print "$PROMPT" >> "$LOG" 2>&1
EXIT_CODE=$?

echo "" >> "$LOG"
if [ $EXIT_CODE -eq 124 ]; then
  echo "WARNING: Task timed out after 5 minutes." >> "$LOG"
elif [ $EXIT_CODE -eq 143 ] || [ $EXIT_CODE -eq 15 ]; then
  echo "WARNING: Claude Code terminated by signal (SIGTERM/SIGKILL) - memory pressure." >> "$LOG"
elif [ $EXIT_CODE -ne 0 ]; then
  echo "WARNING: Claude Code exited with code $EXIT_CODE." >> "$LOG"
fi

# Check if task was marked done
TASK_STATUS=$(python3 -c "
import json
with open('$TASKS_FILE') as f:
    data = json.load(f)
t = next((t for t in data['tasks'] if t['id'] == '$TASK_ID'), None)
print(t['status'] if t else 'unknown')
" 2>/dev/null)

echo "Task $TASK_ID final status: $TASK_STATUS" >> "$LOG"

# Count remaining in_progress tasks
REMAINING=$(python3 -c "
import json
with open('$TASKS_FILE') as f:
    data = json.load(f)
print(len([t for t in data['tasks'] if t['status'] == 'in_progress']))
" 2>/dev/null)

echo "Remaining in_progress: $REMAINING" >> "$LOG"

# Cleanup: Kill stale processes after task completion to free memory
pkill -f "claude.*--session" --older 20m 2>/dev/null || true
pkill -f "acpx.*--cwd" --older 10m 2>/dev/null || true

echo "=== Task Worker Done $(date) ===" >> "$LOG"

# Deliver summary
openclaw agent --deliver "Task Worker: $TASK_ID ($TASK_TITLE) → $TASK_STATUS. Kalan: $REMAINING görev." 2>/dev/null
