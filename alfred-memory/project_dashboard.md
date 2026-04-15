---
name: Ataraxia Dashboard Durumu
description: Dashboard mimarisi, son degisiklikler, port bilgileri
type: project
originSessionId: 0049017d-6ed7-43f2-a198-08736dd887ac
updated: 2026-04-14
---
Dashboard `/home/sefa/alfred-hub/command-center/dashboard/` altinda. Repo: `alfred-ataraxia/ataraxia-command-center`. Systemd servisi `ataraxia-dashboard.service`, port **4173**.

**Auth:** Okuma endpoint'leri (`/api/*` GET) public, yazmalar Bearer token korumali. Frontend `window.__DASHBOARD_TOKEN` inject ile token aliyor.

**Son degisiklikler (2026-04-13):**
- T-105: TaskQueue mobil responsive tamamlandi
- T-109: Dashboard gece modu (23:00-07:00) eklendi
- T-114: Dashboard performans optimizasyonu (refresh 30s → 60s)
- Kokpit/Overview: Cron sayacı, sistem metrikleri
- 3 view kaldi: Kokpit, Gorevler, Logs

**Acik goremler:** T-016 ve sonrasi (yeni sistem)

**Why:** Onceki surumde eski görev referanslari (T-087..T-092) yanilticiydi.

**How to apply:** Port 4173'ten eris. Sprint baslangiclarinda TASKS.json'u scrum dosyalariyla senkronize et.