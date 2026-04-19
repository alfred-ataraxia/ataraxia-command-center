# Sprint-04 — DeFi APM Phase 2B & System Maturity

**Süre:** 2026-04-18 → 2026-04-25 (1 hafta)
**Hedef:** DeFi APM Faz 2B (manuel onay) canlıya hazırlık + Sistem/Dashboard konsolidasyonu.
**Durum:** AKTİF

---

## Context

- **Carry-over (Sprint-01):** B-001 (OpenClaw temiz kurulum) ve B-002 (Task-runner onarımı).
- **Yeni Odak:** Ataraxia Dashboard güvenliği ve 84 DeFi alarmının konsolidasyonu.

---

## Sprint Backlog

| ID | Görev | Öncelik | Durum | AI Sahibi |
|---|---|---|---|---|
| S4-01 | `task-runner.sh` dosyasının restorasyonu | 🔴 Kritik | Pending | Claude |
| S4-02 | Dashboard Basic Auth (B-015) aktivasyonu | 🟠 Yüksek | Pending | Codex |
| S4-03 | DeFi Alarm Konsolidasyon script çalıştırılması | 🟠 Yüksek | Done | Gemini |
| S4-04 | config.json vs openclaw.json temizliği | 🟡 Orta | Done | Gemini |
| S4-05 | WireGuard referanslarının temizlenmesi | 🔵 Düşük | Pending | Gemini |

---

## Kabul Kriterleri (DoD)

- [ ] Otonom motor (`task-runner.sh`) hatasız çalışıyor.
- [ ] Dashboard login ekranı aktif.
- [ ] `TASKS.json` içinde 5'ten az mükerrer DeFi alarmı var.
- [ ] `openclaw.json` tek yapılandırma kaynağı.

---

*Sprint-01 resmi olarak KAPATILDI. Kalan tüm kalemler S4 backlog'una aktarıldı.*
