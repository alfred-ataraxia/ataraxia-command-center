# Secret Rotation Runbook

Date: 2026-04-18
Status: manual follow-up required

## Scope

This runbook covers the secrets that were intentionally not auto-rotated during the hardening pass because rotating them blindly would break active sessions, device pairing, or third-party integrations.

Targets still requiring manual rotation or re-auth:

- `P:\.openclaw\agents\main\agent\auth-profiles.json`
  - OAuth access and refresh tokens for OpenAI, Gemini, and MiniMax portal flows
- `P:\.openclaw\devices\paired.json`
  - operator pairing token for gateway clients
- `P:\alfred-hub\command-center\dashboard\.env`
  - `HA_TOKEN`
  - `TELEGRAM_BOT_TOKEN`

## Order of operations

1. Prepare new credentials in the upstream system first.
2. Update local env/config references.
3. Restart only the component that uses the rotated secret.
4. Verify health before moving to the next secret.
5. Remove old credentials from local files and logs.

Do not rotate every provider at once unless you have a maintenance window.

## Provider-specific steps

### Home Assistant

1. Create a new long-lived access token in Home Assistant.
2. Replace `HA_TOKEN` in `dashboard/.env`.
3. Restart the dashboard service.
4. Verify `GET /api/ha/states` returns `200`.
5. Revoke the old Home Assistant token.

### Telegram bot

1. Rotate the bot token via BotFather.
2. Replace `OPENCLAW_TELEGRAM_BOT_TOKEN` in `P:\.openclaw\.env`.
3. Replace `TELEGRAM_BOT_TOKEN` in `dashboard/.env` if the legacy dashboard notifier still uses it.
4. Restart Telegram-connected services.
5. Send a test message and verify delivery.
6. Remove the old token from any remaining files or logs.

### OAuth profiles in `auth-profiles.json`

1. Log out the affected CLI/provider session.
2. Re-authenticate interactively so the provider writes fresh tokens.
3. Confirm the new profile still works.
4. Redact any old copied tokens from local notes or backups.

Do not hand-edit OAuth refresh tokens unless you are intentionally invalidating the profile.

### Paired device token in `devices/paired.json`

1. Schedule a short pairing window.
2. Unpair the old operator device or revoke the token from the gateway side.
3. Re-pair the client cleanly.
4. Verify operator scopes still work.
5. Remove the old paired token entry if it remains.

## Post-rotation checks

- `python P:\alfred-hub\scripts\redact-config-audit.py --in-place`
- grep for leftover bearer material in local JSON and env files
- verify dashboard auth, HA proxy, Telegram delivery, and gateway pairing

## Exit criteria

- No stale third-party secret remains in `dashboard/.env`
- No stale OAuth or paired-device token remains active
- Services recover cleanly after restart
