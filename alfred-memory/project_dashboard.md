---
name: Ataraxia Dashboard Durumu
description: Dashboard mimarisi, son değişiklikler, port bilgisi ve bilinen görevler
type: project
originSessionId: 0049017d-6ed7-43f2-a198-08736dd887ac
---
Dashboard `/home/sefa/alfred-hub/command-center/dashboard/` altında. Repo: `alfred-ataraxia/ataraxia-command-center`. Systemd servisi `ataraxia-dashboard.service`, port **4173** (Vite preview/build, PM2 yok).

**Auth:** Okuma endpoint'leri (`/api/*` GET) public, yazmalar Bearer token korumalı. Frontend `window.__DASHBOARD_TOKEN` inject ile token alıyor.

**Son değişiklikler (2026-04-10):**
- `/api/agents` → Wayne Ağı (Alfred/Lucius/Netrunner/Robin) gösteriyor
- `TASKS.json` → T-078..T-086 backlog/sprint senkronize, T-087 (auto badge) TAMAMLANDI
- `normalizeTask()` → `auto` ve `points` field'larını handle ediyor
- `TaskRow` → `auto:true` görevlere ⚡ rozet; FilterPanel'de toggle switch
- Robin araştırma görevleri → task-runner Gemini 2.5 Pro kullanıyor
- `ataraxia-stats.service` → OpenClaw path düzeltildi, restart döngüsü bitti
- `task-runner` cron → auto filtreli, günde 2x

**Açık görevler:** T-088 (ajan model isimleri), T-089 (Otomasyon Merkezi view), T-090..T-092

**Why:** Dashboard verileri gözükmüyordu, auth engel oluyordu, task-runner token israf ediyordu.

**How to apply:** Port 4173'ten eriş. Sprint başlangıçlarında TASKS.json'u scrum dosyalarıyla senkronize et.
