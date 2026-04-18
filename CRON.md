# CRON.md — Scheduled Tasks

**Son güncelleme:** 2026-04-19
**Scheduler:** OpenClaw cron runner (`~/.openclaw/cron/jobs.json`)
**Not:** `ataraxia-task-runner.timer` (systemd) 2026-04-19 disable edildi — OpenClaw tek scheduler.

---

## Morning Briefing
- **Zaman:** 07:00 Istanbul (GMT+3)
- **Script:** `cron/morning-briefing.sh`
- **Delivery:** Telegram — `curl` + `jq` ile direkt API (2026-04-19 güncellendi)
- **İçerik:**
  1. Takvim etkinlikleri (bugün)
  2. Acil okunmamış mesajlar
  3. İstanbul hava durumu
  4. Dünkü notlardan top 3 öncelik
- **Limit:** <1200 karakter, boş bölümler atlanır
- **Durum:** ✅ Aktif

## Hourly Report
- **Zaman:** Her saat :17'de (17 * * * *)
- **Script:** `cron/hourly-report.sh`
- **Delivery:** Telegram — `python3 urllib` ile (2026-04-19 yeniden yazıldı)
- **İçerik:**
  - CPU / RAM / Disk
  - Uptime
  - Dashboard (4173) sağlık
  - Gateway sağlık
  - Son morning-briefing zamanı
  - Cron empty-run oranı (son 1 saat)
- **Durum:** ✅ Aktif

## Weekly Backup
- **Zaman:** Pazar 02:00 Istanbul (GMT+3)
- **Script:** `cron/weekly-backup.sh`
- **Çıktı:** `/home/sefa/.openclaw/backups/`
- **Saklama:** Son 8 hafta
- **Durum:** ✅ Aktif

## Build Me Something Wonderful
- **Zaman:** 23:00 Istanbul (GMT+3) — her gece
- **Script:** `cron/wonderful.sh`
- **Çıktı:** `~/wonderful/[date]-[name]`
- **İçerik:** Araştırma özetleri, otomasyon scriptleri, stratejik çerçeveler, seçilmiş kaynaklar
- **Telegram:** 23:00'da tek satır teaser
- **Kural:** Tekrar yok, bir mükemmel şey > beş vasat şey
- **Durum:** ✅ Aktif

---

## Devre Dışı Bırakılanlar

| Script/Timer | Sebep | Tarih |
|-------------|-------|-------|
| `ataraxia-task-runner.timer` (systemd) | OpenClaw cron ile çakışıyordu, broken | 2026-04-19 |
