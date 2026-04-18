# Sprint-04 — DeFi APM Phase 2B & System Maturity

**Süre:** 2026-04-17 → 2026-04-24 (1 hafta)
**Hedef:** DeFi APM Faz 2B (manuel onay) canlıya hazırlık + Sistem/Dashboard carry-over görevleri.
**Durum:** AKTİF

---

## Context

- Faz 1 aktif (port 4180), 446 havuz izleniyor, servis stabil.
- Faz 2A (simulation) + 2B (manual approval) iskeleti hazır.
- Sprint-03'ten sarkan dashboard ve sistem görselleştirme işleri bu sprint'e dahil edildi.

---

## Sprint Backlog

### P0 — DeFi APM (Faz 2B Canlı Hazırlık)

| ID | Görev | Puan | Durum | Not |
|----|-------|------|-------|-----|
| S4-01 | Backtest `no_candidates` kök neden analizi | 3 | ✅ DONE | Bootstrap/Pool Age kısıtı tespit edildi (2026-04-17) |
| S4-02 | Guardrails tam enforce (%50 limit, 24h hold, 6h cooldown) | 3 | Bekliyor | /api/autopilot/simulate üzerinde audit log |
| S4-03 | Executor sağlamlaştırma (gas, slippage, nonce handling) | 5 | Bekliyor | SIM mode'da tam rotasyon doğrulaması |
| S4-04 | Test wallet entegrasyonu & Portfolio USD valuation | 2 | Bekliyor | GET /api/portfolio gerçek bakiye vermeli |
| S4-07 | Havuz yaşı on-chain kontrolü (contract deploy block) | 3 | Bekliyor | `first_seen_at` yerine kalıcı çözüm |

### P1 — Sistem & Dashboard (Carry-over)

| ID | Görev | Puan | Durum | Not |
|----|-------|------|-------|-----|
| S4-05 | Telegram: autopilot `PROPOSED` bildirimi + onay linki | 2 | 🚧 WIP | T-53 in TASKS.json |
| S4-08 | Faz 1 stabilite dashboard card (Overview) | 2 | ✅ DONE | T-49 ile tamamlandı |
| S3-01 | Stats history chart (CPU/RAM/Disk 24sa) | 2 | Bekliyor | Dashboard altyapısı hazır |
| S3-05 | Statusline git + CPU/RAM (T-081) | 1 | Bekliyor | — |
| S3-07 | Overview: son aktiviteler (task-runner log) | 1 | Bekliyor | — |
| S4-09 | Discover/Watchlist tier (S4-01 çıktısı) | 2 | Bekliyor | Tüm Beefy havuzları skorlama |

**Toplam Puan:** 26p
**Tamamlanan:** 5p (%19)

---

## Definition of Done (Sprint)

- [x] Backtest anlamlı karar üretiyor (veya kök neden belgeli)
- [ ] Canlı modda tek test rotasyonu SIM mode'da doğrulanmış
- [ ] Guardrails tek noktada allow/reject veriyor
- [ ] Portfolio USD bazında okunuyor
- [ ] Dashboard'da sistem istatistik grafikleri (24sa) çalışıyor
- [ ] Sprint review: `sprint-04-review.md` güncellenmiş

---

## Risk Kayıt

- **Bootstrap Problemi:** Havuz yaşı (minPoolAgeDays=30) yeni havuzlar için backtest'i engelliyor. S4-07 kritik.
- **Kapasite:** Hem DeFi hem Dashboard işleri yoğun; öncelik DeFi executor sağlamlığında.
