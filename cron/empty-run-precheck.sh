#!/bin/bash
set -euo pipefail

TASKS_FILE="${TASKS_FILE:-/home/sefa/alfred-hub/command-center/TASKS.json}"
ASSIGNEE="${ASSIGNEE:-alfred}"
ACTIONABLE_STATUSES="${ACTIONABLE_STATUSES:-in_progress}"

if [ ! -f "$TASKS_FILE" ]; then
  echo "TASKS.json not found: $TASKS_FILE" >&2
  exit 1
fi

COUNTS=$(python3 - "$TASKS_FILE" "$ASSIGNEE" "$ACTIONABLE_STATUSES" <<'PY'
import json
import sys

tasks_path, assignee, statuses = sys.argv[1:4]
allowed_statuses = {item.strip().lower() for item in statuses.split(",") if item.strip()}

with open(tasks_path, "r", encoding="utf-8") as handle:
    payload = json.load(handle)

tasks = payload["tasks"] if isinstance(payload, dict) else payload
actionable = 0
pending = 0
for task in tasks:
    task_assignee = str(task.get("assignee", "")).strip().lower()
    status = str(task.get("status", "")).strip().lower()
    if task_assignee != assignee:
        continue
    if status in allowed_statuses:
        actionable += 1
    if status == "pending":
        pending += 1

print(f"{actionable}|{pending}")
PY
)

ACTIONABLE_COUNT="${COUNTS%%|*}"
PENDING_COUNT="${COUNTS##*|}"

if [ "$ACTIONABLE_COUNT" -eq 0 ]; then
  echo "SKIP no actionable ${ASSIGNEE} tasks (pending=${PENDING_COUNT})"
  exit 0
fi

echo "RUN actionable=${ACTIONABLE_COUNT} pending=${PENDING_COUNT}"

if [ "$#" -gt 0 ]; then
  exec "$@"
fi
