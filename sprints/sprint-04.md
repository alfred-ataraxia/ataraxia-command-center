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
| S4-01 | Telegram bot token rotate (BotFather) | 2 | ⏸ Ertelendi | Sefa | Risk tolere edildi — LAN-only, bot public'e açık değil |
| S4-02 | OpenClaw runtime token rotation | 3 | ⏸ Kısmi | Claude+Sefa | Analiz yapıldı: Gemini OAuth expired (`gemini auth login` gerekli, ertelendi); MiniMax/Google env-var (güvenli); Codex OAuth auto-refresh |
| S4-03 | `gateway.controlUi.allowInsecureAuth=true` policy kararı | 1 | ✅ Done | Sefa | LAN-only — açık kalacak, kabul edildi |
| S4-04 | TASKS.json DeFi alarm analizi | 2 | ✅ Done | Claude | 45 DEFI-* → archived (2026-04-19); Alfred pending: 0 |
| S4-05 | Memory doc overlap konsolidasyonu | 2 | ✅ Done | Claude | 10/20/31/40 memory güncellendi; stale paths, auth, model, cron düzeltildi |
| S4-06 | Session retention cron aktifleştirme | 1 | ✅ Done | Claude | OpenClaw jobs.json'a eklendi (04:00 her gün) |
| S4-07 | Empty-run sessiz çıkış + kök neden analizi | 3 | ✅ Done | Claude | NO_TASK → sessiz; kök neden: Alfred pending task yok (beklenen) |
| S4-08 | GUARDRAILS budget çelişkisi çözümü | 1 | ✅ Done | Sefa | Sistem şu an ücretli API yok (OpenRouter ücretsiz); MiniMax/Codex/Gemini sabit abonelik |
| S4-09 | Backlog temizliği ve güncelleme | 2 | ✅ Done | Claude | B-001/002/006 arşivlendi, B-009..015 yeni madde eklendi |
| S4-10 | WireGuard belge tutarlılığı | 1 | ✅ Done | Claude | 20-system-landscape.md'e WireGuard (51820/udp, docker) eklendi |

| S4-11 | B-013 Dashboard Faz 1+2+3 (temizlik, sprint widget, grid, tab) | 5 | ✅ Done | Claude | LoginModal kaldırıldı, SprintStatus, 2-kolon grid, TopPools→DeFi tab, React #310 fix |
| S4-12 | B-017 NO_TASK Telegram fix — delivery.mode none + curl explicit | 1 | ✅ Done | Claude | jobs.json güncellendi; OpenClaw artık NO_TASK'ta Telegram'a mesaj göndermez |
| S4-13 | B-018 DeFi TVL alarm eşiği — $500K min abs TVL | 1 | ✅ Done | Claude | config/default.ts + check.ts; mikro havuz ($0.1M) alarmı artık üretilmez |

**Toplam:** 25 puan  
**Kapasite:** ~20 puan (aşıldı — iyi)

---

## Tamamlananlar (Bu Sprint'te Yapıldı)

| Tarih | Görev | Kim |
|-------|-------|-----|
| 2026-04-19 | GUARDRAILS.md scope ayrımı + çelişki flag | Claude |
| 2026-04-19 | Session tombstone temizliği (20 MB serbest) | Claude |
| 2026-04-19 | ALFRED_PROJECT_STATE.md → çalışma formatına getirildi | Claude |
| 2026-04-19 | backlog.md güncellendi (B-009..015 yeni maddeler) | Claude |
| 2026-04-19 | session-retention cron OpenClaw'a eklendi (04:00) | Claude |
| 2026-04-19 | 40-active-work.md senkronize edildi (gerçek sistem durumu) | Claude |
| 2026-04-19 | Memory doc overlap: 10/20/31 güncellendi (stale paths, auth, model) | Claude |
| 2026-04-19 | WireGuard: 20-system-landscape.md'e eklendi (docker, 51820/udp) | Claude |
| 2026-04-19 | B-004 HA otomasyon fix: configuration.yaml'a `automation: !include` eklendi, 14/14 otomasyon aktif | Claude |
| 2026-04-19 | dashboard/.env git history temizliği (filter-repo) | Claude |
| 2026-04-19 | HA_TOKEN + Dashboard token rotation | Claude |
| 2026-04-19 | Dashboard auth: LAN-only, DASHBOARD_TOKEN kaldırıldı | Claude |
| 2026-04-19 | Morning-briefing curl+jq Telegram delivery | Claude |
| 2026-04-19 | Hourly-report python3 urllib rewrite | Claude |
| 2026-04-19 | ataraxia-task-runner.timer disabled | Claude |
| 2026-04-19 | Docs refresh — WP-6 commit `a25dadf` | Claude |
| 2026-04-19 | B-007 Homepage: Alfred Dashboard + DeFi APM widget eklendi (services.yaml) | Claude |
| 2026-04-19 | B-008 Pi-hole: v6.4.1 latest doğrulandı, blocklist sudo gerekiyor (manuel) | Claude |
| 2026-04-19 | B-013 Dashboard redesign raporu hazırlandı (`docs/B013-dashboard-redesign-report.md`) | Claude |
| 2026-04-19 | B-013 Faz 1: LoginModal kaldırıldı, model isimleri dinamik, DeFi alert ayrıldı | Claude |
| 2026-04-19 | B-013 Faz 2: `/api/sprint` endpoint + SprintStatus widget Kokpit'e eklendi | Claude |
| 2026-04-19 | B-013 Faz 3: 2-kolon grid, Top Pools → DeFi tab, sidebar 8→7 | Claude |
| 2026-04-19 | fix: React #310 hook hatası düzeltildi (defiTab useState taşındı) | Claude |

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
