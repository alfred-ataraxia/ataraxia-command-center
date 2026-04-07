# HEARTBEAT.md - Periodic Checks (Cost-Optimized)

## Configuration
- **Interval:** Every 60 minutes (3600000ms)
- **Model:** gemini-2.5-flash-lite (ultra-cheap, keeps cache warm)
- **Target:** "last" (use last session context)
- **Status:** ✅ ENABLED (openclaw system heartbeat enable)
- **Daemon:** OpenClaw native heartbeat (replaces 4 cron jobs)

## Heartbeat Tasks (Rotating)

**Every check:**
- [ ] Unread messages (urgent scan)
- [ ] System alerts & errors
- [ ] Cache warm (token efficiency)
- [ ] HA Offline Buffer kontrolü: `~/openclaw/buffer/ha-queue.json` doluysa ve HA erişilebilirse (192.168.1.91:8123) kuyruğu boşalt.

**Daily (rotate through):**
- **Morning (07:00):** Calendar (24-48h), weather, top 3 priorities → Telegram
- **Evening (23:00):** Cost check (daily spend), backup status, task review
- **Weekly (Pazar 02:00):** Archive logs, memory compaction, system health

## Notes
- Heartbeat replaces individual cron jobs (wonderful.sh, cost-daily-check.sh, etc.)
- Tüm ajan çıktıları önce `~/openclaw/logs/team-log.md` dosyasına yazılır.
- Telegram'a bildirim sadece Heartbeat döngüsünün sonunda, tek ve toplu mesaj olarak gönderilir.
- Ara raporlar, kısmi sonuçlar veya "çalışıyorum" bildirimleri Telegram'a gönderilmez.
- Bildirim formatı: Başlık + Özet + Eylem Maddeleri. Maksimum 10 satır.
- HA Dayanıklılığı: HA'ya yazılacak veriler ulaşılamazsa `~/openclaw/buffer/ha-queue.json` dosyasına yazılır.
- Cost-optimized: batch operations, cache reuse
