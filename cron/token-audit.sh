#!/bin/bash
# Token Audit — SQLite task_runs → TOKEN_AUDIT.json (Dashboard /api/tokens için)
# Cron: 0 */6 * * * (6 saatte bir güncelle)
set -euo pipefail

OUTPUT="/home/sefa/alfred-hub/command-center/TOKEN_AUDIT.json"
TOKENS_PER_SEC=80  # MiniMax M2.7 kaba tahmin (duration proxy)
BUDGET_PER_WEEK=2000000  # MiniMax M2.7 — ~$0.60/hafta (35K Claude API bütçesi değil)

python3 - "$OUTPUT" "$TOKENS_PER_SEC" "$BUDGET_PER_WEEK" <<'PY'
import json, sqlite3, sys
from datetime import datetime, timedelta, timezone

OUTPUT, TOKENS_PER_SEC, BUDGET_PER_WEEK = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
DB = "/home/sefa/.openclaw/tasks/runs.sqlite"

conn = sqlite3.connect(DB)
conn.row_factory = sqlite3.Row

now = datetime.now(timezone.utc)
week_start = now - timedelta(days=now.weekday())
week_start = week_start.replace(hour=0, minute=0, second=0, microsecond=0)

weeks = []
for w in range(8):
    ws = week_start - timedelta(weeks=w)
    we = ws + timedelta(weeks=1)

    cur = conn.execute("""
        SELECT agent_id, label,
               round((ended_at - started_at) / 1000.0, 1) as duration_s
        FROM task_runs
        WHERE runtime = 'cron'
          AND started_at >= ? AND started_at < ?
          AND ended_at IS NOT NULL
          AND status = 'succeeded'
    """, (int(ws.timestamp() * 1000), int(we.timestamp() * 1000)))

    total_tokens, by_agent, run_count = 0, {}, 0
    # Sabit per-run tahmini (duration bağımsız — MiniMax için gerçekçi)
    LABEL_TOKENS = {
        'morning-briefing': 3000, 'morning-briefing-weekend': 3000,
        'evening-report': 2000, 'alfred-task-runner': 1500,
        'Alfred Task Runner': 1500, 'mercer-email-check': 1200,
        'mait-daily-query': 1000, 'mait-weekly-query': 1500,
        'mait-weekly-report': 2000, 'mait-weekly-review': 2000,
        'radar-weekly': 2500,
    }
    DEFAULT_TOKENS = 800

    for r in cur.fetchall():
        label = r['label'] or ''
        est = LABEL_TOKENS.get(label, DEFAULT_TOKENS)
        total_tokens += est
        agent = r['agent_id'] or 'unknown'
        by_agent[agent] = by_agent.get(agent, 0) + est
        run_count += 1

    weeks.append({
        "week_of": ws.strftime("%Y-%m-%d"),
        "estimated_tokens": total_tokens,
        "tasks_by_model": {
            "minimax": by_agent.get("alfred", 0) + by_agent.get("mait", 0) + by_agent.get("mercer", 0),
            "sonnet": by_agent.get("claude", 0),
            "other": sum(v for k,v in by_agent.items() if k not in ("alfred","mait","mercer","claude"))
        },
        "usage_percent": round(total_tokens / BUDGET_PER_WEEK * 100, 1),
        "run_count": run_count
    })

conn.close()
weeks.reverse()

with open(OUTPUT, 'w') as f:
    json.dump({
        "budget_per_week": BUDGET_PER_WEEK,
        "updated_at": now.isoformat(),
        "weeks": weeks
    }, f, indent=2, ensure_ascii=False)

w = weeks[-1]
print(f"OK — bu hafta: {w['estimated_tokens']} token tahmini (%{w['usage_percent']}), {w['run_count']} run")
PY