---
name: Ataraxia Dashboard Durumu
description: Dashboard mimarisi, son değişiklikler ve bilinen sorunlar
type: project
originSessionId: c794e88a-932c-49ca-8850-95ea9e5e6b67
---
Dashboard `/home/sefa/alfred-hub/command-center/dashboard/` altında. Systemd servisi `ataraxia-dashboard.service`, port 4173.

**Son değişiklikler (2026-04-09):**
- `/api/agents` → Wayne Ağı (Alfred/Lucius/Netrunner/Robin) gösteriyor, Docker/systemd servisleri `/api/services`'e taşındı
- `TASKS.json` → Eski pending görevler temizlendi, sprint-01 + backlog ile senkronize edildi (T-078..T-086)
- Activity endpoint → openclaw log bağımlılığı kaldırıldı, journalctl tabanlı

**Why:** Dashboard Docker servis listesi gösteriyordu, Wayne Ağı ajanları görünmüyordu. Görevler bayatlamıştı.

**How to apply:** Yeni sprint başlangıçlarında TASKS.json'u scrum dosyalarıyla senkronize et. Agents endpoint'i Wayne Ağı tabanlı tut.
