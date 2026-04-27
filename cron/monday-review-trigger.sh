#!/bin/bash
# Pazartesi 09:00 stratejik review görevini tetikleme
# Cron: 0 9 * * 1 (Pazartesi 09:00)

export PATH="/home/sefa/.npm-global/bin:/home/sefa/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/home/sefa"

WORKSPACE="/home/sefa/.openclaw/workspace"
TASKS_FILE="$WORKSPACE/TASKS.json"
LOG_DIR="$HOME/openclaw/logs"
mkdir -p "$LOG_DIR"

LOG="$LOG_DIR/monday-review-$(date +%Y%m%d-%H%M).log"

echo "=== Monday Review Trigger $(date) ===" >> "$LOG"

# Set T-074 to in_progress so task-worker picks it up with Opus
python3 << 'PYTHON_EOF'
import json
import sys
from datetime import datetime

try:
    with open('/home/sefa/.openclaw/workspace/TASKS.json') as f:
        data = json.load(f)

    # Find T-074
    task = next((t for t in data['tasks'] if t['id'] == 'T-074'), None)
    if task:
        if task['status'] != 'in_progress':
            task['status'] = 'in_progress'
            with open('/home/sefa/.openclaw/workspace/TASKS.json', 'w') as f:
                json.dump(data, f, indent=2)
            print(f"T-074 set to in_progress", file=sys.stderr)
        else:
            print(f"T-074 already in_progress", file=sys.stderr)
    else:
        print(f"T-074 not found", file=sys.stderr)
except Exception as e:
    print(f"Error: {e}", file=sys.stderr)
PYTHON_EOF

echo "Review task queued for execution." >> "$LOG"
echo "=== Done ===" >> "$LOG"
