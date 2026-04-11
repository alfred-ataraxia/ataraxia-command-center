# Sprint 3 — Otonom Çalışma & Dashboard Olgunlaşma

**Hedef:** Dashboard'u gerçek bir komut merkezi yap. Otonom görevleri aktif et, Telegram'ı entegre et, veri görselleştir.
**Tarih:** 2026-04-10 → 2026-04-17
**Durum:** Aktif
**Otonom:** Alfred task-runner sabah 09:00 + gece 21:00 çalışır

---

## Sprint Backlog

| #     | Görev                                        | Puan | Atanan    | Auto | Durum    |
|-------|----------------------------------------------|------|-----------|------|----------|
| S3-01 | Stats history chart (CPU/RAM/Disk 24sa)      | 2p   | Lucius    | —    | Bekliyor |
| S3-02 | Telegram: görev tamamlanınca bildir          | 2p   | Alfred    | —    | Bekliyor |
| S3-03 | Haftalık sistem raporu (Robin → Gemini)      | 2p   | Robin     | ✅   | Bekliyor |
| S3-04 | Pi-hole blocklist güncelleme (T-085)         | 1p   | Netrunner | ✅   | Bekliyor |
| S3-05 | Statusline git+CPU/RAM (T-081)               | 1p   | Lucius    | ✅   | Bekliyor |
| S3-06 | Dashboard: görev ekleme formu               | 2p   | Lucius    | —    | Bekliyor |
| S3-07 | Overview: son aktiviteler (task-runner log)  | 1p   | Lucius    | —    | Bekliyor |

**Toplam:** 11p
**Otonom (task-runner):** S3-03, S3-04, S3-05
**Manuel (Alfred direkt):** S3-01, S3-02, S3-06, S3-07

---

## Uygulama Sırası
1. S3-01 — Chart (hemen, altyapı hazır)
2. S3-02 — Telegram (task-runner'a ekle)
3. S3-07 — Aktiviteler (Overview)
4. S3-06 — Görev ekleme
5. S3-03/04/05 — TASKS.json'a ekle, otonom çalışsın
