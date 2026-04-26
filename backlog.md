# Product Backlog — ataraxia

**Son güncelleme:** 2026-04-25 · Claude Sonnet 4.6 · Sprint-06 aktif (güncellendi)  
**Toplam açık:** 32 görev · **Toplam puan:** ~72p

---

## Açık İşler

### 🔥 Kritik / Yüksek Öncelikli

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-027 | Session cleanup script broken — disk dolma riski | 2 | ✅ DONE 2026-04-25 | Robin analiz (session-retention-cleanup payload.kind mismatch) |
| B-028 | Cron 3AM çakışması — alfred-backup + memory-dreaming aynı dakika | 1 | ✅ DONE 2026-04-25 | Robin analiz |
| B-029 | video-frames SKILL.md Çince spam temizle + guide fix | 1 | ✅ DONE 2026-04-25 | Robin analiz (kırık skill) |
| B-030 | Budget çelişkisi — 10-operating-rules $100 vs GUARDRAILS $50 kanonize et | 1 | ⏳ Bekliyor | Robin analiz |
| B-031 | Morning briefing genişlet — uptime/container status/DeFi alert/pending task ekle | 2 | ⏳ Bekliyor | Robin analiz |
| B-032 | Evening report hata bildirimi — sessiz başarısızlık yerine Telegram uyarısı | 1 | ⏳ Bekliyor | Robin analiz |

### ⚙️ OpenClaw Görev & Otomasyon

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-022 | Cron lock / skip-if-running — görev çakışma önleme (flock) | 1 | ⏳ Bekliyor | Paperclip → atomic task checkout |
| B-023 | Ajan audit log — çalışma geçmişi (kim/ne zaman/sonuç/süre) | 1 | ⏳ Bekliyor | Paperclip → audit trail |
| B-024 | Token / maliyet tracker — ajan başına aylık sayaç + Dashboard widget | 2 | ⏳ Bekliyor | Paperclip → per-agent budget |
| B-025 | Genel approval queue — Dashboard'a genel onay mekanizması | 3 | ⏳ Bekliyor | Paperclip → governance workflow |
| B-033 | Task timeout tanımı + overdue badge Dashboard'da | 2 | ⏳ Bekliyor | Robin analiz |
| B-034 | Delivery mode cleanup — backup/archive/cleanup job'larını sessizleştir | 1 | ✅ DONE 2026-04-25 | Robin analiz (7 job mode:none yapılacak) |
| B-035 | mercer-email-check sıklık azalt — */5 dk → */15 dk | 1 | ✅ DONE 2026-04-25 | Robin analiz (CPU tasarrufu) |
| B-036 | Task Brain entegrasyonu — SQLite-backed unified task ledger | 3 | ⏳ Bekliyor | OpenClaw 2026.3.31 yeni özellik |
| B-037 | Alfred task runner → gerçek ajan çağırma (simülasyon modundan çıkış) | 3 | ⏳ Bekliyor | Robin analiz (task-runner.sh TODO) |
| S6-02 | Sistem geneli backlog oturumu (Alfred/MAIT/HA/Homepage) | 3 | ⏳ Bekliyor — Sefa+Claude | — |

### 📊 Dashboard & Görünürlük

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-033 | DailySummary silent failure → error state + retry butonu | 2 | ⏳ Bekliyor | Robin analiz |
| B-038 | AgentStatus fallback — "cache" badge + manual retry butonu | 1 | ⏳ Bekliyor | Robin analiz |
| B-039 | Toast hata mesajları — 10s süre + "Tekrar Dene" butonu | 1 | ⏳ Bekliyor | Robin analiz |
| B-026 | Market verisi canlı kaynak iyileştirme — CoinGecko rate limit fallback | 1 | ✅ DONE 2026-04-25 | Dashboard health check |

### 🧠 Skill & Hafıza Yönetimi

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-040 | Skill registry INDEX.md oluştur — mevcut 14 skill dizini + bağımlılıklar | 2 | ⏳ Bekliyor | Robin analiz (skill discovery eksik) |
| B-041 | Alfred SOUL.md oluştur — kimlik, hafıza kuralları, rol tanımı | 1 | ✅ DONE 2026-04-25 | Robin analiz (SOUL.md eksik) |
| B-042 | MAIT + Mercer SOUL.md oluştur | 1 | ⏳ Bekliyor | Robin analiz |
| B-043 | shared-notes.md rotation script — 7 günden eski → archive/ (haftalık cron) | 2 | ✅ DONE 2026-04-25 | Robin analiz (216 satır → büyüyor) |
| B-044 | Memory dosya çakışmaları birleştir — 31-dashboard vs 40-active, 20-landscape vs 32-tools | 2 | ⏳ Bekliyor | Robin analiz |
| B-045 | CLAUDE.md / CODEX.md redundancy sil — AGENTS.md canonical kalacak | 1 | ⏳ Bekliyor | Robin analiz |
| B-046 | healthcheck-ready stub sil veya implement et | 1 | ⏳ Bekliyor | Robin analiz (boş scaffold) |

### ⚡ RPi Performans Optimizasyonu

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-047 | memorySearch.local.contextSize: 4096 → 2048 — RAM tasarrufu | 1 | ⏳ Bekliyor | Robin best practice |
| B-048 | NODE_OPTIONS --max-old-space-size=512 — OOM kill önleme | 1 | ✅ DONE 2026-04-25 | Robin best practice |
| B-049 | Model routing stratejisi — rutin job'lar haiku, karmaşık claude-sonnet | 2 | ⏳ Bekliyor | Robin best practice (token maliyet %60 düşer) |
| B-050 | Session yönetimi — retention süresini kıs (14→7 gün), index ekle | 3 | ⏳ Bekliyor | Robin analiz (742MB session dosyaları) |

### 🔌 Yeni Skill Entegrasyonları

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-051 | system-monitor skill — CPU/RAM/disk eşik aşılınca Telegram uyarısı | 1 | ⏳ Bekliyor | Robin best practice |
| B-052 | calendar-sync skill — Google Calendar → morning briefing entegrasyonu | 1 | ⏳ Bekliyor | Robin best practice |
| B-053 | home-assistant-control skill — MAIT için HA entity okuma/yazma | 2 | ⏳ Bekliyor | Robin best practice |
| B-054 | agent-session-memory skill — session sıkıştırma + context kayıpsız devam | 2 | ⏳ Bekliyor | OpenClaw ecosystem |

### 🏦 DeFi APM

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-021 | DeFi APM systemd servisi — otomatik başlatma | 1 | ✅ DONE 2026-04-25 | Sistem analizi |
| B-020 | DeFi APM Faz 3 — Autopilot on-chain execution | 8 | ⏳ Bekliyor — cüzdan + private key setup gerekli | — |

---

## Tamamlananlar (Arşiv)

| # | Öge | Sprint | Tarih |
|---|-----|--------|-------|
| B-001 | OpenClaw temiz kurulum | S1 | 2026-04 |
| B-002 | Telegram bot entegrasyonu | S1 | 2026-04 |
| B-003 | Go workspace temizlik (868 MB freed) | S4 | 2026-04-19 |
| B-004 | HA otomasyon fix: 14/14 aktif | S4 | 2026-04-19 |
| B-005 | WireGuard belge tutarlılığı | S4 | 2026-04-19 |
| B-006 | Sistem yedekleme otomasyonu | S1/S4 | 2026-04-19 |
| B-007 | Homepage: Alfred Dashboard + DeFi APM widget | S4 | 2026-04-19 |
| B-008 | Pi-hole v6.4.1 doğrulama | S4 | 2026-04-19 |
| B-009 | Telegram bot token rotate | S4 | 2026-04-19 |
| B-010 | Gemini token auto-refresh doğrulama | S5 | 2026-04-19 |
| B-011 | gateway insecureAuth → LAN-only kabul | S4 | 2026-04-19 |
| B-012 | Budget çelişkisi çözüldü | S4 | 2026-04-19 |
| B-013 | Dashboard redesign Faz 1-4 | S4/S5 | 2026-04-19 |
| B-014 | Memory doc konsolidasyonu | S4 | 2026-04-19 |
| B-015 | DeFi APM Faz 2 — sekme, detay, watchlist | S5 | 2026-04-19 |
| B-017 | NO_TASK Telegram fix | S4 | 2026-04-19 |
| B-018 | DeFi TVL $500K min threshold | S4 | 2026-04-19 |
| B-019 | Market verisi stale sorunu (CoinGecko canlı) | S5 | 2026-04-19 |
| B-021 | DeFi APM systemd servisi | S6 | 2026-04-25 |
| B-026 | Market verisi CoinGecko live (MARKET_LIVE=1) | S6 | 2026-04-25 |

---

*Yeni öge: tabloya satır ekle, puan ver, sprint'e çekerken sprint-XX.md'de numarala.*
