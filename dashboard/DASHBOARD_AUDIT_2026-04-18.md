# DASHBOARD AUDIT - 2026-04-18

## Scope

- Project root: `P:\alfred-hub\command-center\dashboard`
- Server: `server.cjs`
- Frontend: `src/`
- Runtime/service files: `config.cjs`, `.env.example`, `logs/`, systemd unit usage

## Executive Summary

Dashboard is useful and feature-rich, but the current design is carrying serious security and maintainability debt.

Top-level judgment:

- Product value: high
- Security: poor
- Maintainability: weak
- Test reliability: weak
- Operational portability: weak

Most important conclusion:

This is not just a dashboard. It is a privileged operations console with write actions, shell execution, service restarts, git commits, Home Assistant integration, and proxy behavior. It should be treated like an admin control plane, but parts of it are currently implemented as if they were read-only convenience endpoints.

## Architecture Summary

### Current shape

- Backend is a single large Node server in `server.cjs`.
- Frontend is React/Vite with several large view components.
- Static files and API are served from the same process.
- Dashboard reads and mutates:
  - `TASKS.json`
  - local logs
  - git repositories
  - systemd status
  - docker state
  - OpenClaw cron state
  - memory notes
  - DeFi API proxy
  - Home Assistant

### What is good

- Same-origin deployment is simple.
- Operational visibility is broad.
- Frontend has a usable view split:
  - overview
  - tasks
  - orchestration
  - automation
  - logs
  - memory
  - DeFi
- Server includes:
  - rate limiting
  - startup validation
  - circuit breaker primitives
  - request/slow-query logging

### What is weak

- `server.cjs` is effectively a monolith at ~2575 lines.
- Backend mixes:
  - routing
  - auth
  - metrics
  - file IO
  - process control
  - git operations
  - HA integration
  - DeFi proxying
  - notification delivery
- Frontend contains several oversized view components, especially:
  - `DefiView.jsx` ~53 KB
  - `Overview.jsx` ~20 KB
  - `TaskQueue.jsx` ~17 KB

## Critical Findings

### 1. Unauthenticated task mutation surface

Severity: Critical

Evidence:

- In `server.cjs`, auth skip list includes:
  - `/api/tasks`
  - `/api/tasks/` prefix
- Auth decision is path-based, not method-based.
- That means these task routes are publicly reachable without Bearer auth:
  - `GET /api/tasks`
  - `POST /api/tasks`
  - `PATCH /api/tasks/:id`
  - `PUT /api/tasks/:id`
  - `POST /api/tasks/:id/start`
  - `POST /api/tasks/:id/notes`

Impact:

- Any reachable client on allowed network path can create, edit, start, complete, or annotate tasks.
- This is already too much power for an unauthenticated route.
- Since tasks drive downstream automation, this is an indirect orchestration control surface.

Recommendation:

- Make task mutation endpoints authenticated immediately.
- If read-only task listing must stay public, split GET from write methods explicitly.
- Do not rely on path-only auth rules.

### 2. Shell injection path through git commit helper

Severity: Critical

Evidence:

- `commitTasksFile()` executes:
  - ``git add TASKS.json && git commit -m "${commitMsg}"``
- `commitMsg` includes user-controlled task title.
- Task creation/update APIs accept user-provided titles.
- Those task APIs are currently unauthenticated due the auth skip rule above.

Impact:

- This creates a realistic remote command injection chain:
  - unauthenticated POST to `/api/tasks`
  - malicious title payload
  - shell execution via `execSync(...)`
- This is the single most serious issue in the project.

Recommendation:

- Stop building shell commands with interpolated user input.
- Use `spawn`/`execFile` with argument arrays.
- Sanitize or reject commit message control characters and shell-breaking characters.
- Remove automatic git commit from request lifecycle until secured.

### 3. Home Assistant token exposure risk in frontend bundle

Severity: Critical

Evidence:

- `src/services/haService.js` reads:
  - `import.meta.env.VITE_HA_URL`
  - `import.meta.env.VITE_HA_TOKEN`
- `.env.example` instructs storing HA token in `VITE_HA_TOKEN`.
- `VITE_*` variables are client-exposed by design in Vite.

Impact:

- If used in build/runtime, the HA token is available to the browser bundle.
- That gives frontend users direct API credentials to Home Assistant.
- Even if some functions are currently unused, the pattern itself is unsafe.

Recommendation:

- Never place HA credentials in `VITE_*`.
- Move all HA access server-side only.
- Delete client-side token-based HA request helpers.

### 4. Admin token leakage patterns

Severity: High

Evidence:

- `injectToken()` writes:
  - `window.__DASHBOARD_TOKEN = '...'`
- Protected routes also accept `?token=` query parameter.
- Token is stored in `localStorage` via `apiFetch.js`.

Impact:

- Query token leaks into browser history, logs, referrers, screenshots.
- Injected global token increases XSS blast radius.
- `localStorage` persistence increases token lifetime.

Recommendation:

- Remove `?token=` support.
- Do not inject token into HTML.
- Prefer session-scoped auth flow or same-origin HttpOnly cookie.
- At minimum, keep token header-only and not persisted longer than needed.

## High Severity Findings

### 5. Command execution inside request handlers

Severity: High

Evidence:

- `server.cjs` uses `execSync()` 18 times.
- Examples:
  - `docker ps`
  - `systemctl is-active`
  - `docker restart`
  - `systemctl restart`
  - `git log`
  - `git commit`
  - `crontab -l`
  - `curl` for local health

Impact:

- Slow/blocking requests can freeze the single Node process.
- Fault isolation is weak.
- Any command injection mistake becomes catastrophic because process control is already in-band.

Recommendation:

- Move privileged/slow operations to a service layer or worker process.
- Use async subprocess APIs with tight allowlists.
- For restart actions, map IDs to fixed command arrays, never raw string commands.

### 6. Service restart endpoint trusts string prefixes too much

Severity: High

Evidence:

- `/api/services/restart` accepts `serviceId`.
- For docker/systemd it derives the command target from string replacement and passes it into shell command strings.

Impact:

- Today this route is protected, which reduces exposure.
- But if token leaks, this endpoint becomes a privileged shell surface.

Recommendation:

- Replace string-derived command execution with a hardcoded allowlist:
  - exact service IDs
  - exact argv arrays

### 7. Backend auth model is inconsistent

Severity: High

Evidence:

- Many sensitive read routes are public by design:
  - `/api/agents`
  - `/api/services`
  - `/api/activity`
  - `/api/memory`
  - `/api/automation`
  - `/api/git/repos`
  - `/api/ai-status`
- DeFi GET routes are entirely public.
- Frontend mixes `fetch()` and `apiFetch()`, so auth expectations are already inconsistent in code.

Impact:

- It is hard to reason about what is public and what is admin-only.
- Tightening auth later will break the frontend unless requests are normalized.

Recommendation:

- Classify every route explicitly:
  - public
  - operator-read
  - operator-write
- Use one shared client helper for all API calls.

## Medium Severity Findings

### 8. Test suite does not test the real server

Severity: Medium-High

Evidence:

- `server.test.cjs` is an in-memory stub, not the actual `server.cjs` handler.
- It does not exercise:
  - real auth behavior
  - real file IO
  - real task mutation logic
  - real process-control routes
  - real proxy behavior
- `src/components/TaskQueue.test.jsx` is effectively a placeholder note, not a real test.

Impact:

- Current tests can pass while production code is broken or dangerous.
- The most critical bugs in this audit would not be caught.

Recommendation:

- Add real integration tests around the real server handler.
- Cover:
  - auth enforcement
  - task CRUD
  - route method restrictions
  - token leakage behavior
  - restart/build routes

### 9. Build/test toolchain is not reproducible in current environment

Severity: Medium-High

Evidence:

- `npm run lint` failed: `eslint` not recognized
- `npm test -- --runInBand` failed: `jest` not recognized
- `npm run build` failed: `vite` not recognized
- `node_modules/.bin` exists, but scripts are not resolving in this environment

Impact:

- This project is not reliably runnable from the current dashboard workspace on this machine/session.
- CI/local parity is weak.

Recommendation:

- Standardize runtime:
  - OS
  - shell
  - Node version
  - package manager
- Add a bootstrap check in README:
  - expected environment
  - install command
  - verification command

### 10. Frontend bypasses centralized auth fetch helper

Severity: Medium

Evidence:

- `Overview.jsx` uses raw `fetch('/api/...')` many times instead of `apiFetch(...)`.
- `AutomationView.jsx` also uses mixed calling patterns.
- `apiFetch` exists specifically to attach auth and handle 401.

Impact:

- Auth behavior is fragmented.
- If backend auth tightens, views will fail inconsistently.
- Error handling is uneven across the app.

Recommendation:

- Use `apiFetch` for every internal API call.
- Centralize JSON parsing and error normalization.

### 11. Frontend component complexity is too high

Severity: Medium

Evidence:

- `DefiView.jsx` is ~53 KB and contains presentation + transformation + summary logic together.
- `Overview.jsx`, `TaskQueue.jsx`, `AutomationView.jsx` are also large multi-responsibility views.

Impact:

- Harder to reason about bugs.
- Harder to test isolated behavior.
- Higher regression probability.

Recommendation:

- Split views into:
  - data hooks
  - transformation helpers
  - presentational subcomponents

### 12. Server and dependency model are drifting

Severity: Medium

Evidence:

- `package.json` includes `express`, but `server.cjs` explicitly says "pure Node.js, no Express".
- `react-router-dom` is present, but app routing is just local component switching in `App.jsx`.

Impact:

- Dependency surface is larger than necessary.
- Tooling and ownership boundaries are unclear.

Recommendation:

- Remove unused dependencies.
- Or commit to a framework direction and refactor toward it.

### 13. CORS and public route model are too casual for an admin console

Severity: Medium

Evidence:

- CORS allows:
  - `localhost:4173`
  - `192.168.1.91:4173`
  - `127.0.0.1:4173`
- Several operational read routes are intentionally public.

Impact:

- In a home-lab this may be acceptable for convenience.
- But for an admin console tied to tasks, services, memory, git, and HA, this is still too open.

Recommendation:

- Default to authenticated reads for sensitive operational data.
- Only keep a truly minimal public surface.

## Operational Findings

### 14. Dashboard depends on many external local surfaces

Examples:

- OpenClaw gateway health
- git repositories
- crontab
- docker
- systemd
- Home Assistant
- log files
- TASKS.json
- DeFi API upstream

Assessment:

- This makes the dashboard valuable.
- It also makes it fragile because every missing file/command becomes request-path complexity.

Recommendation:

- Add explicit dependency health reporting per subsystem.
- Avoid hiding failures with too many broad `catch {}` blocks.

### 15. Logging is useful but may retain sensitive operational context

Evidence:

- Rotating application and error logs exist.
- Request logs and slow-query logs are also kept in memory.
- The project already acts on tasks, services, and admin surfaces.

Recommendation:

- Redact sensitive request metadata.
- Avoid storing Bearer tokens, query params, or command payloads in logs.

## UX/Product Findings

### What is working well

- The dashboard is not generic; it is tailored to your actual operating model.
- Feature coverage is strong:
  - operations
  - AI status
  - tasks
  - automation
  - memory
  - DeFi
- UI appears intentionally organized around real workflows rather than demo widgets.

### What is weak

- App state is view-local and request-driven, not normalized.
- No obvious routing/deep-link model.
- Heavy views likely over-fetch and are harder to cache.

## Verification Status

Attempted:

- `npm run lint`
- `npm test -- --runInBand`
- `npm run build`

Result:

- All three failed in this session because `eslint`, `jest`, and `vite` executables were not resolvable from the current environment.
- So code analysis is based on source inspection, not successful local verification.

## Prioritized Action Plan

### P0

1. Lock down task write routes with auth immediately.
2. Remove shell interpolation from `commitTasksFile`.
3. Remove `VITE_HA_TOKEN` pattern completely.
4. Remove `?token=` auth support.
5. Stop injecting dashboard token into HTML.

### P1

1. Extract route modules from `server.cjs`.
2. Move command/process operations behind strict allowlists.
3. Normalize all frontend API calls through `apiFetch`.
4. Add real integration tests for actual server behavior.
5. Restore reproducible lint/test/build workflow.

### P2

1. Split `DefiView`, `Overview`, `TaskQueue`, `AutomationView` into smaller units.
2. Remove unused dependencies.
3. Introduce explicit route access policy documentation.
4. Add subsystem health contracts and typed response shapes.

## Final Assessment

Dashboard is strategically valuable, but today it behaves more like an organically grown admin console than a hardened control plane.

The biggest issue is not style or component size. It is trust boundary design.

Right now:

- some powerful routes are public
- user input reaches shell commands
- frontend patterns can expose backend secrets

Those need to be fixed before any cosmetic or structural cleanup matters.
