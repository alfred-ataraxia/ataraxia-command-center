# OpenClaw Telegram Latency Stabilization Plan

**Created:** 2026-04-29 22:40 +03  
**Last updated:** 2026-04-30 15:30 +03  
**Owner:** Codex  
**Scope:** OpenClaw native Telegram channel, Alfred agent model routing, gateway load, cron interference.

## 2026-04-30 Current Status

This plan was created before the plugin-isolation, heartbeat, `memory-core dreaming`, and `alfred-task-runner` policy work. Current state is different from the original diagnosis.

### Confirmed Fixed / Improved

- Legacy Python Telegram bot conflict is not currently visible.
  - `telegram-bot.service` is not found as an active systemd unit.
  - No separate `telegram_bot.py` process is visible.
- Gateway HTTP health is fast.
  - Five consecutive `18789 /health` checks returned 200 in about 2–10 ms.
- Browser/device/phone/talk plugin isolation is active.
  - `18791` browser sidecar is not listening.
  - Active gateway port remains `18789`.
- `alfred-task-runner` is disabled.
  - This prevents repeated 2–5 minute `NO_TASK` LLM runs.
  - Policy documented in `docs/alfred-task-runner-policy.md`.

### Still Open

- Gateway process is still non-trivial for a Raspberry Pi 400.
  - Current sample: about 765 MB RSS and around 21% CPU.
- `memory-core dreaming` was active during normal hours; A/B test was attempted and rolled back after failing targets.
  - T-088 measured heavy dreaming activity and timeouts.
  - Decision package and implementation log: `docs/openclaw-memory-core-dreaming-decision.md`.
- A new log issue exists in cron/tool execution:
  - `cron-failure-alert.sh` attempted `exec host=sandbox`.
  - OpenClaw logged: `exec host=sandbox requires a sandbox runtime for this session`.
  - This is not a Telegram polling failure, but it can create noisy cron failures and should be handled as a separate follow-up.
- Real Telegram end-to-end latency still needs manual confirmation from the Telegram client.

### Current Risk Assessment

The original primary suspects were legacy bot conflict, model fallback, oversized sessions, and cron LLM runs. After recent fixes, the remaining high-probability latency contributors are:

1. `memory-core dreaming` competing with Telegram/model runs before the A/B test.
2. Provider/model latency during full agent responses.
3. Cron/tool jobs failing or retrying through unsupported sandbox host settings.
4. Lack of local fast path for common status intents.

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

1. ✅ Apply model routing cleanup.
2. ✅ Stop no-task LLM polling by keeping `alfred-task-runner` disabled; policy is documented.
3. ✅ Plugin isolation and heartbeat stabilization were applied before this update.
4. ✅ Start and rollback the `memory-core dreaming` A/B test after failed early result.
5. ⏳ Test `/status`, `/models`, and `durum raporu ver` from Telegram.
6. ⏳ Fix or isolate cron/tool `host=sandbox` failures if they continue.
7. ⏳ Implement local fast status path if native Telegram responses still exceed target.
8. ⏳ Add latency telemetry after the runtime is stable enough to measure cleanly.
9. ⏳ Review p95 latency after 24 hours.

## Manual Telegram Test Checklist

Run these from Telegram and record approximate response times:

| Test | Target | Pass/Fail |
|---|---:|---|
| `/status` | <3 sec | Fail — measured ~11 sec |
| `/models` | <3 sec | Fail — measured ~7 sec |
| `orada mısın` | <10 sec | Fail — typing ~10 sec, answer ~20 sec, total ~30 sec |
| `durum raporu ver` | <10 sec for local summary, <30 sec if LLM | Fail — typing ~9 sec, answer starts ~35 sec |
| `ne hatırlıyorsun` | <30 sec unless deep memory query | Pending |

If any test exceeds 45 seconds, the next engineering step should be either local fast path or the approved `memory-core dreaming` A/B test.

## 2026-04-30 Manual Test Result

Telegram is responsive enough to show typing, but not fast enough for the target UX.

Interpretation:

- Native commands are still too slow for a command surface.
- Short conversational messages are near or above the acceptable upper bound.
- Local status intent is being treated too much like a normal agent/model response.
- Since gateway HTTP health is fast and legacy bot conflict is gone, the next useful test is to reduce background agent load or bypass LLM for local status.

Next recommended action:

1. Implement a Telegram local fast path for `/status`, `/models`, `orada mısın`, and `durum raporu ver`.
2. Investigate Telegram transport/polling stall and main lane wait.

The `memory-core dreaming` A/B test was attempted and did not resolve the issue. Current engineering focus should move to Telegram fast path, transport health, and lane blocking.

## 2026-04-30 A/B Test Started

Master Sefa approved the `memory-core dreaming` A/B test.

| Field | Value |
|---|---|
| Start | 2026-04-30 16:03 Europe/Istanbul |
| Planned end | 2026-05-01 16:03 Europe/Istanbul |
| Change | `memory-core.config.dreaming.enabled=false` |
| Backup | `~/.openclaw/openclaw.json.bak-memory-core-dreaming-20260430-160233` |
| Gateway health after restart | 200, about 2–9 ms |
| Current CPU after stabilization | about 0–1% in `top` sample |
| Current RSS after stabilization | about 630 MB |

Repeat Telegram tests during this window:

| Test | Before A/B | Target |
|---|---:|---:|
| `/status` | 11 sec | <3 sec |
| `/models` | 7 sec | <3 sec |
| `orada mısın` | 30 sec total | <10 sec local/simple |
| `durum raporu ver` | answer starts ~35 sec | <10 sec local summary |

If the values improve materially, keep `dreaming` disabled until a lower-frequency/scheduled memory consolidation design is prepared. If values do not improve, rollback and prioritize Telegram fast path/model routing.

## 2026-04-30 A/B Test Early Result And Rollback

First manual test after disabling `memory-core dreaming` did not meet the target and one message failed to complete.

| Test | Before A/B | During A/B | Result |
|---|---:|---:|---|
| `/status` | 11 sec | 7 sec | Improved but still fail |
| `/models` | 7 sec | 19 sec | Worse |
| `orada mısın` | 30 sec total | typing ~11 sec, then 1.5min+ without final answer | Worse/fail |

Action taken:

- Rolled back from `~/.openclaw/openclaw.json.bak-memory-core-dreaming-20260430-160233`.
- `memory-core.config.dreaming.enabled=true` again.
- Gateway restarted and returned live.

Important log evidence during the failed A/B window:

- `lane wait exceeded: lane=main waitedMs=202586 queueAhead=0`
- `Polling stall detected (no completed getUpdates for 225.08s); forcing restart`
- `Polling runner stop timed out after 15s`
- `telegram sendMessage failed: Network request for 'sendMessage' failed!`
- `telegram final reply failed`
- `answerCallbackQuery failed: query is too old`

Updated interpretation:

- `memory-core dreaming` contributes load, but it is not the sole root cause.
- The stronger current suspects are Telegram transport/polling stall, delayed `sendMessage`, main agent lane blocking, and lack of local fast path.
- Next engineering work should focus on Telegram fast path + transport health, not more memory-core toggling.

## Rollback

- Revert only model routing changes in `~/.openclaw/openclaw.json`.
- Restore previous cron schedule from `~/.openclaw/cron/jobs.json` backup if needed.
- Keep legacy `telegram_bot.py` disabled unless native Telegram is confirmed broken.
