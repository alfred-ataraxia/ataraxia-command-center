# Sprint 04

**Hedef:** Sistem sağlamlaştırma — güvenlik, otomasyon kalitesi, session/memory yönetimi
**Tarih:** 2026-04-19 (Cumartesi) → 2026-04-26 (Cumartesi)
**Durum:** Aktif

---

## Sprint Hedefleri

1. Güvenlik açıklarını kapat (token rotation tamamla)
2. Cron kalitesini artır (boş-run oranını düşür)
3. Session/memory kirliliğini yönet
4. Dashboard UX sorunlarını düzelt (rate limit, auth)

---

## Sprint Backlog

| # | Görev | Puan | Durum | Atanan | Notlar |
|---|-------|------|-------|--------|--------|
| S4-01 | Telegram bot token rotate (BotFather) | 2 | ⏳ Bekliyor | Sefa | Dış erişim gerekli |
| S4-02 | OpenClaw runtime token rotation (auth-profiles, models, exec-approvals, paired) | 3 | ⏳ Bekliyor | Koordineli | Secret Rotation Runbook'a bak |
| S4-03 | `gateway.controlUi.allowInsecureAuth=true` policy kararı | 1 | ⏳ Bekliyor | Sefa | Güvenlik riski; LAN-only ise kabul edilebilir |
| S4-04 | TASKS.json DeFi alarm analizi | 2 | ✅ Done | Claude | 45 DEFI-* → archived (2026-04-19); Alfred pending: 0 |
| S4-05 | Memory doc overlap konsolidasyonu | 2 | ⏳ Bekliyor | Gemini | Tek kaynak için duplikasyon temizliği |
| S4-06 | Session retention cron aktifleştirme | 1 | ⏳ Bekliyor | Claude/Codex | `session-retention.sh` OpenClaw job'a eklenecek |
| S4-07 | Empty-run sessiz çıkış + kök neden analizi | 3 | ✅ Done | Claude | NO_TASK → sessiz; kök neden: Alfred pending task yok (beklenen) |
| S4-08 | GUARDRAILS $2 vs $5 budget çelişkisi çözümü | 1 | ⏳ Bekliyor | Sefa | Kanonik değer seçilip iki dosyada sync |
| S4-09 | Sprint-04 backlog temizliği (B-003..B-008) | 2 | ⏳ Bekliyor | Claude | Backlog.md'deki bekleyen item'lar sprint'e çekilecek mi? |
| S4-10 | WireGuard belge tutarlılığı | 1 | ⏳ Bekliyor | MiniMax | |

**Toplam:** 18 puan
**Kapasite:** ~20 puan (5 gün × 4 puan/gün)

---

## Tamamlananlar (Bu Sprint'te Yapıldı)

| Tarih | Görev | Kim |
|-------|-------|-----|
| 2026-04-19 | GUARDRAILS.md scope ayrımı + çelişki flag | Claude |
| 2026-04-19 | Session tombstone temizliği (20 MB serbest) | Claude |
| 2026-04-19 | ALFRED_PROJECT_STATE.md → çalışma formatına getirildi | Claude |
| 2026-04-19 | dashboard/.env git history temizliği (filter-repo) | Claude |
| 2026-04-19 | HA_TOKEN + Dashboard token rotation | Claude |
| 2026-04-19 | Dashboard auth: LAN-only, DASHBOARD_TOKEN kaldırıldı | Claude |
| 2026-04-19 | Morning-briefing curl+jq Telegram delivery | Claude |
| 2026-04-19 | Hourly-report python3 urllib rewrite | Claude |
| 2026-04-19 | ataraxia-task-runner.timer disabled | Claude |
| 2026-04-19 | Docs refresh — WP-6 commit `a25dadf` | Claude |

---

## Sprint Notları

### 2026-04-19 (Sprint açılış)

- Sprint-01 CLOSED durumundaydı; sprint-02 ve sprint-03 belgesi hiç oluşturulmamış. Sprint-04 doğrudan 2026-04-19 itibarıyla açıldı.
- Sprint açılışında 9 kritik güvenlik ve altyapı işi tamamlandı (WP-1 / WP-2 / WP-4 / WP-6).
- Kalan en kritik iş: Telegram + OpenClaw runtime token rotation (dış erişim gerektiriyor, Sefa koordineli yapacak).

---

## Tanımlar

- **1p**: <15 dk, tek adım
- **2p**: 15-60 dk, birkaç adım
- **3p**: 1-4 saat, plan gerektirir
- **5p**: Yarım gün+, bölünmeli
