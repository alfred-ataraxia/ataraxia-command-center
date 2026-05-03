# Automation And Budget Risks

## Canonical Policy

- Budget authority lives in `P:\alfred-hub\command-center\GUARDRAILS.md`.
- This file records risks and operational reminders, not threshold authority.
- Tasks estimated above $1.00 still require explicit approval.

## Core Rule

- `task-runner` must never process tasks with `auto: false`.
- Legacy tasks with missing `auto` may still run until the backlog is normalized.
- Silent model upgrades are not allowed.

## Why

- Previous cron runs without an effective opt-out filter burned tokens unnecessarily.
- If `/reset` or context compaction fails, unattended runs can multiply cost quickly.

## Operational Boundaries

- Cron should stay minimal and observable.
- New automation must be visible from shared memory or the dashboard.
- Silent commit/push remains disallowed.

## Implementation Direction

- Dashboard automation visibility should keep improving.
- Heartbeat and low-value automation should prefer the cheapest safe model.
