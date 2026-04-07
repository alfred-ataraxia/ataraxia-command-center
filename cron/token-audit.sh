#!/bin/bash
# Haftalık token kullanım denetimi
# Cron: 0 18 * * 0 (Pazar 18:00)
# TOKEN_STRATEGY.md: Haftalık 35,000 token bütçe

export PATH="/home/sefa/.npm-global/bin:/home/sefa/.local/bin:/usr/local/bin:/usr/bin:/bin:$PATH"
export HOME="/home/sefa"

WORKSPACE="/home/sefa/.openclaw/workspace"
LOG_DIR="$HOME/openclaw/logs"
mkdir -p "$LOG_DIR"

LOG="$LOG_DIR/token-audit-$(date +%Y%m%d).log"
AUDIT_FILE="$WORKSPACE/TOKEN_AUDIT.json"

echo "=== Token Audit $(date) ===" >> "$LOG"

# Estimate tokens from logs
# Based on: avg 100 tokens/task for Haiku, 600 for Sonnet, 2500 for Opus
python3 << 'PYTHON_EOF'
import json
import os
from datetime import datetime, timedelta

LOG_DIR = os.path.expanduser("~/openclaw/logs")
WORKSPACE = "/home/sefa/.openclaw/workspace"
AUDIT_FILE = os.path.join(WORKSPACE, "TOKEN_AUDIT.json")

# Token averages (conservative estimates)
TOKEN_ESTIMATES = {
    'haiku': 100,
    'sonnet': 600,
    'opus': 2500
}

# Load existing audit or create new
if os.path.exists(AUDIT_FILE):
    with open(AUDIT_FILE) as f:
        audit = json.load(f)
else:
    audit = {
        'weeks': [],
        'current_week_start': None,
        'budget_per_week': 35000,
        'monthly_limit': 50000
    }

# Get this week's task-worker logs (last 7 days)
week_start = datetime.now() - timedelta(days=7)
total_tokens = 0
task_count_by_model = {'haiku': 0, 'sonnet': 0, 'opus': 0}

# Scan recent logs for model selection output
if os.path.exists(LOG_DIR):
    for log_file in os.listdir(LOG_DIR):
        if 'task-worker' in log_file:
            try:
                with open(os.path.join(LOG_DIR, log_file)) as f:
                    content = f.read()
                    if 'OPUS' in content:
                        task_count_by_model['opus'] += content.count('OPUS')
                    if 'SONNET' in content:
                        task_count_by_model['sonnet'] += content.count('SONNET')
                    if 'HAIKU' in content:
                        task_count_by_model['haiku'] += content.count('HAIKU')
            except:
                pass

# Calculate token usage
estimated_tokens = (
    task_count_by_model['haiku'] * TOKEN_ESTIMATES['haiku'] +
    task_count_by_model['sonnet'] * TOKEN_ESTIMATES['sonnet'] +
    task_count_by_model['opus'] * TOKEN_ESTIMATES['opus']
)

# Create this week's report
week_report = {
    'week_of': datetime.now().strftime('%Y-%m-%d'),
    'tasks_by_model': task_count_by_model,
    'estimated_tokens': estimated_tokens,
    'budget_remaining': 35000 - estimated_tokens,
    'usage_percent': round((estimated_tokens / 35000) * 100, 1)
}

audit['weeks'].append(week_report)
audit['current_week_start'] = datetime.now().strftime('%Y-%m-%d')

# Keep only last 12 weeks
audit['weeks'] = audit['weeks'][-12:]

# Save audit
with open(AUDIT_FILE, 'w') as f:
    json.dump(audit, f, indent=2)

# Print summary
print(f"Token Audit Summary:")
print(f"  Haiku tasks: {task_count_by_model['haiku']}")
print(f"  Sonnet tasks: {task_count_by_model['sonnet']}")
print(f"  Opus tasks: {task_count_by_model['opus']}")
print(f"  Estimated tokens: {estimated_tokens}")
print(f"  Budget remaining: {week_report['budget_remaining']}")
print(f"  Usage: {week_report['usage_percent']}%")

# Alert if approaching limit
if estimated_tokens > 28000:  # 80% of budget
    print(f"⚠️  WARNING: Token usage at {week_report['usage_percent']}% of weekly budget!")
PYTHON_EOF

echo "" >> "$LOG"
echo "=== Audit Complete ===" >> "$LOG"
