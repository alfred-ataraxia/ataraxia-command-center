# Sprint 1

**Hedef:** Sistem stabilitesi, Gemini fallback, token kontrolü
**Tarih:** 2026-04-09 → 2026-04-16
**Durum:** Aktif

---

## Sprint Backlog

| # | Gorev | Puan | Durum | Notlar |
|---|-------|------|-------|--------|
| S1-01 | Dashboard systemd service kurulum ve path düzeltme | 1 | Tamamlandi | Port 4173, autostart aktif |
| S1-06 | ataraxia-stats.service path düzelt (openclaw → alfred-hub) | 1 | Tamamlandi | 16K restart döngüsü durduruldu |
| S1-07 | ai-switch.sh — Claude↔Gemini güvenli geçiş scripti | 2 | Tamamlandi | ~/.local/bin/ai-switch |
| S1-08 | Token harcama otomasyonu gözden geçir | 2 | Tamamlandi | task-runner cron durduruldu, auto filtresi düzeltildi |
| S1-10 | Robin dashboard analizi — T-087..T-092 görevleri | 1 | Tamamlandi | 6 görev oluştu, T-087 yapıldı |
| S1-11 | TaskQueue auto badge + filtresi (T-087) | 2 | Tamamlandi | ⚡ rozet, FilterPanel toggle, URL ?auto=true |
| S1-09 | Sprint hedefini OpenClaw'dan sistem stabilitesine çevir | 1 | Tamamlandi | Bu güncelleme |
| S1-02 | OpenClaw Docker image | 3 | Iptal | OpenClaw rafa kalktı |
| S1-03 | Telegram bot entegrasyonu | 2 | Ertelendi | Sprint 2'ye |
| S1-04 | Alfred gateway | 2 | Iptal | OpenClaw ile birlikte |
| S1-05 | SOUL/IDENTITY/AGENTS konfigürasyon | 1 | Ertelendi | Sprint 2'ye |

**Aktif toplam:** 7 puan

---

## Gunluk Notlar

### 2026-04-09 (Carsamba)
- Sistem optimizasyonu tamamlandi (15GB disk, boot iyilestirme)
- Eski OpenClaw artiklari tamamen temizlendi
- CLAUDE.md + Scrum yapisi kuruldu
- Sprint 1 basladi
- ataraxia-stats.service düzeltildi (restart döngüsü kesildi)
- ai-switch.sh yazıldı — Claude↔Gemini güvenli geçiş
- Sprint hedefi gerçeğe uyarlandı

---

## Definition of Done
- [x] Dashboard servisleri çalışıyor (port 4173 + 4175)
- [x] Stats servisi restart döngüsünde değil
- [x] Claude↔Gemini geçiş güvenli (ai-switch.sh)
- [ ] Token otomasyon gözden geçirildi
- [ ] Sistem restart sonrası tüm servisler otomatik başlıyor
