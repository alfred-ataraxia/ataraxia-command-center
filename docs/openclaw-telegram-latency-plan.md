# OpenClaw Telegram Latency Stabilization Plan

**Created:** 2026-04-29 22:40 +03  
**Owner:** Codex  
**Scope:** OpenClaw native Telegram channel, Alfred agent model routing, gateway load, cron interference.

## Current Diagnosis

Observed user symptom: normal Telegram text such as `durum raporu ver` can take about 5 minutes.

Live checks show the gateway HTTP health endpoint is fast:

- `http://127.0.0.1:18789/health` returned in about 5 ms.
- Legacy `telegram-bot.service` is no longer present as an active systemd unit.
- Gateway process is still heavy: about 965 MB RSS and sustained CPU load around 50% at the time of diagnosis.

Most likely delay path is not HTTP gateway freeze. It is Telegram message handling entering an embedded agent/model run and waiting on slow model fallback, session locks, or provider limits.

Evidence from `/tmp/openclaw/openclaw-2026-04-29.log`:

- `openai-codex/gpt-5.4` fallback hit ChatGPT usage limit at `22:12:36`.
- Session write lock was held for more than 30 seconds shortly after the failed run.
- Earlier runs show MiniMax timeouts followed by fallback to `openai-codex/gpt-5.4`.
- Telegram menu generation is large enough to trigger payload shortening warnings.
- `huashu-design.symlink.bak` was still scanned as a skill path and generated warnings; it has now been moved out of the active skill root.

## Latency Targets

| Flow | Target |
|---|---:|
| Native command `/status`, `/models` | under 3 seconds |
| Local status intent `durum raporu ver` | under 10 seconds |
| Normal short chat response | under 30 seconds |
| Long reasoning or task execution | immediate acknowledgement under 3 seconds, final response async |

## P0 Fixes

1. Normalize model routing for Alfred.
   - Make `agents.defaults.model.primary`, `agents.list[].alfred.model.primary`, and Telegram session model consistent.
   - Do not let latency-sensitive Telegram flow fall back to `openai-codex/gpt-5.4` while that provider is quota-limited.
   - Prefer fast OpenCode Go or MiniMax models first; keep high-reasoning Codex models opt-in for development tasks only.
   - Status: applied in `~/.openclaw/openclaw.json` at 2026-04-29 22:41. `openai-codex/*` models were removed from latency-sensitive fallbacks; Alfred/MAIT/MERCER primary models were aligned to `opencode-go/kimi-k2.5`.

2. Add a Telegram fast path for status intents.
   - Phrases such as `durum raporu ver`, `sistem durumu`, `orada mısın`, `/status` should not start a full LLM run.
   - Return local health from shell/API checks: gateway, RAM, swap, load, active model, last Telegram error, cron running count.
   - If fast path fails, send a short degraded response and log the failure.

3. Add timeout and acknowledgement policy.
   - Send acknowledgement within 3 seconds for any message that will enter an agent run.
   - If model response exceeds 45 seconds, send `hala çalışıyor` update.
   - If response exceeds 120 seconds, cancel or degrade to local diagnostic summary.

4. Reduce session lock pressure.
   - Rotate or compact oversized Alfred session indexes.
   - Investigate `sessions.json` size growth; current file is about 34 MB.
   - Avoid shared main session for cron jobs and Telegram user chat at the same time.

5. Convert routine cron jobs away from LLM runs.
   - `alfred-task-runner` currently spends minutes even when result is `NO_TASK`.
   - Replace routine no-task polling with a direct script that reads `TASKS.json` and exits without invoking an agent unless a real task exists.
   - Keep LLM agent execution only for actual task payloads.

## P1 Fixes

1. Cron isolation.
   - Keep heavy cron jobs out of Telegram peak windows.
   - Disable missed-job burst after gateway restart if OpenClaw supports it; otherwise add wrapper-level guard.
   - Ensure `alfred-task-runner`, Mercer, MAIT, and failure alerts cannot all wake at the same time.

2. Skill discovery cleanup.
   - Keep active skill roots free of symlinks that resolve outside configured root.
   - Remove backup symlinks from `~/.openclaw/skills`.
   - Cap Telegram command menu output or hide nonessential commands from Telegram.

3. Provider health scoring.
   - Track per-provider last latency, timeout, and quota errors.
   - Temporarily demote providers with quota or repeated timeout errors.
   - Surface this in Dashboard Memory/Agent health.

## P2 Fixes

1. Lightweight Telegram status daemon.
   - If OpenClaw native fast path is hard to patch, create a separate local endpoint that OpenClaw command/action can call.
   - Do not run a second Telegram poller with the same bot token.

2. Observability.
   - Add `telegram-latency.jsonl` with `received_at`, `ack_at`, `agent_start_at`, `model_start_at`, `send_at`, `model`, and `provider`.
   - Add dashboard card for p50/p95 Telegram latency and provider error counts.

3. Pi resource policy.
   - Enforce one heavy AI CLI at a time.
   - Keep OpenViking pilot and dashboard running, but pause noncritical background jobs during active Telegram sessions if needed.

## Execution Order

1. Apply model routing cleanup.
2. Convert no-task cron polling to direct script mode.
3. Restart OpenClaw gateway once, deliberately.
4. Test `/status`, `/models`, and `durum raporu ver` from Telegram.
5. Implement local fast status path.
6. Add latency telemetry.
7. Review p95 latency after 24 hours.

## Rollback

- Revert only model routing changes in `~/.openclaw/openclaw.json`.
- Restore previous cron schedule from `~/.openclaw/cron/jobs.json` backup if needed.
- Keep legacy `telegram_bot.py` disabled unless native Telegram is confirmed broken.
