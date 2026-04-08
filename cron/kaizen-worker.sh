#!/bin/bash
# Kaizen Remote Worker — SSH üzerinden ağır görevleri ana bilgisayara (Kaizen) yönlendirir
# Pi'deki task-worker.sh tarafından 'heavy' tag'li görevler için çağrılır
#
# Gereksinimler:
#   - SSH key auth: ssh kaizen (alias ~/.ssh/config'de tanımlı)
#   - Kaizen'de claude CLI kurulu ve PATH'te
#   - Kaizen'de workspace sync: rsync veya git pull

WORKSPACE="/home/sefa/.openclaw/workspace"
TASKS_FILE="$WORKSPACE/TASKS.json"
LOG_DIR="$HOME/openclaw/logs"
KAIZEN_HOST="${KAIZEN_HOST:-kaizen}"
KAIZEN_WORKSPACE="${KAIZEN_WORKSPACE:-/home/sefa/.openclaw/workspace}"
REMOTE_TIMEOUT="${REMOTE_TIMEOUT:-600}"

TASK_ID="$1"
TASK_TITLE="$2"
TASK_DESC="$3"
MODEL="$4"
LOG="$5"

if [ -z "$TASK_ID" ]; then
  echo "Usage: kaizen-worker.sh <task_id> <title> <desc> <model> <logfile>" >&2
  exit 1
fi

echo "=== Kaizen Remote Dispatch: $TASK_ID ===" >> "$LOG"
echo "Host: $KAIZEN_HOST | Model: $MODEL" >> "$LOG"

# Step 1: Check Kaizen reachability (5s timeout)
if ! ssh -o ConnectTimeout=5 -o BatchMode=yes "$KAIZEN_HOST" "echo ok" >/dev/null 2>&1; then
  echo "ERROR: Kaizen unreachable via SSH. Falling back to local." >> "$LOG"
  exit 1  # Caller (task-worker.sh) will fall back to local execution
fi

echo "Kaizen SSH connection OK." >> "$LOG"

# Step 2: Sync workspace to Kaizen
echo "Syncing workspace to Kaizen..." >> "$LOG"
rsync -az --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs' \
  "$WORKSPACE/" "$KAIZEN_HOST:$KAIZEN_WORKSPACE/" >> "$LOG" 2>&1

if [ $? -ne 0 ]; then
  echo "ERROR: Workspace sync failed. Falling back to local." >> "$LOG"
  exit 1
fi

echo "Workspace synced." >> "$LOG"

# Step 3: Build prompt and dispatch to Kaizen
PROMPT="Görev: $TASK_ID $TASK_TITLE
$TASK_DESC
Workspace: $KAIZEN_WORKSPACE
Kural: Görevi tamamla, TASKS.json status=done yap, gereksiz açıklama yapma."

echo "Dispatching to Kaizen (timeout: ${REMOTE_TIMEOUT}s)..." >> "$LOG"

ssh -o ConnectTimeout=10 "$KAIZEN_HOST" \
  "cd $KAIZEN_WORKSPACE && timeout $REMOTE_TIMEOUT claude --dangerously-skip-permissions --model $MODEL --print '$PROMPT'" >> "$LOG" 2>&1
REMOTE_EXIT=$?

if [ $REMOTE_EXIT -eq 124 ]; then
  echo "WARNING: Kaizen task timed out after ${REMOTE_TIMEOUT}s." >> "$LOG"
elif [ $REMOTE_EXIT -ne 0 ]; then
  echo "WARNING: Kaizen claude exited with code $REMOTE_EXIT." >> "$LOG"
fi

# Step 4: Sync results back from Kaizen
echo "Syncing results back from Kaizen..." >> "$LOG"
rsync -az \
  --include 'TASKS.json' \
  --include '*.sh' \
  --include '*.js' \
  --include '*.jsx' \
  --include '*.cjs' \
  --include '*.json' \
  --include '*.md' \
  --include '*/' \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'logs' \
  "$KAIZEN_HOST:$KAIZEN_WORKSPACE/" "$WORKSPACE/" >> "$LOG" 2>&1

SYNC_EXIT=$?
if [ $SYNC_EXIT -ne 0 ]; then
  echo "WARNING: Result sync failed (exit $SYNC_EXIT). TASKS.json may be stale." >> "$LOG"
fi

echo "=== Kaizen Remote Done (exit: $REMOTE_EXIT, sync: $SYNC_EXIT) ===" >> "$LOG"
exit $REMOTE_EXIT
