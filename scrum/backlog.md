# Product Backlog — ataraxia (Legacy)

**Son guncelleme:** 2026-04-09

> Bu dosya artik kanonik backlog degildir. Guncel operasyon backlog'u:
> `~/alfred-hub/command-center/backlog.md`
>
> Guncel anlik durum:
> `~/.openclaw/workspace/memory/40-active-work.md`

## Oncelik: Yuksek
| # | Oge | Puan | Durum |
|---|-----|------|-------|
| B-001 | OpenClaw temiz kurulum (Docker, Telegram, gateway) | 5 | Sprint 1'de |
| B-002 | Telegram bot entegrasyonu dogrulama | 3 | Sprint 1'de |
| B-009 | Dashboard .env — HA_URL ve Telegram token ekle | 1 | Bekliyor |
| B-010 | /api/agents endpoint — gercek Docker+systemd servis durumu | 2 | Tamamlandi |
| B-011 | TASKS.json guncelle — sprint-01 gorevlerini yansit | 1 | Tamamlandi |
| B-012 | FreeRide → Alfred Oturum Paneli olarak yeniden tasarlandi | 1 | Tamamlandi |

## Oncelik: Orta
| # | Oge | Puan | Durum |
|---|-----|------|-------|
| B-003 | Go workspace inceleme ve temizlik | 2 | Bekliyor |
| B-004 | Home Assistant otomasyon review | 3 | Bekliyor |
| B-005 | WireGuard yapilandirma optimizasyonu | 2 | Bekliyor |
| B-006 | Sistem yedekleme otomasyonu (cron) | 3 | Tamamlandi |
| B-014 | ecosystem.config.cjs path duzeltme (PM2 hazırlığı) | 1 | Bekliyor |
| B-015 | Dashboard basic auth / token koruması | 3 | Bekliyor |
| B-016 | CORS ve security headers | 1 | Tamamlandi |
| B-017 | Stats history kalıcı veri (JSON dosyası) | 3 | Tamamlandi |

## Oncelik: Dusuk
| # | Oge | Puan | Durum |
|---|-----|------|-------|
| B-007 | Homepage dashboard ozellestirme | 1 | Bekliyor |
| B-008 | Pi-hole blocklist guncelleme | 1 | Bekliyor |
| B-018 | Performance metrics toplama | 2 | Bekliyor |
| B-019 | Error rate tracking ve alertler | 2 | Bekliyor |
| B-020 | Uptime SLA widget | 1 | Bekliyor |
| B-021 | Data export (JSON/CSV) | 2 | Bekliyor |
| B-022 | Audit logging | 2 | Bekliyor |

## Yeni Oneriler (awesome-claude-code)
| # | Oge | Puan | Durum |
|---|-----|------|-------|
| N-001 | Parry hook — prompt injection scanner | 1 | Iptal (RPi uyumsuz, false positive riski) |
| N-002 | Dippy — tehlikeli komut auto-approve hook | 2 | Bekliyor |
| N-003 | Linux slash-commands paketi (RPi icin) | 1 | Bekliyor |
| N-004 | Session context restore skill | 2 | Tamamlandi |
| N-005 | Statusline — git branch + CPU/RAM goster | 1 | Bekliyor |
| N-006 | Parry ile tool input/output guvenlik taramasi | 2 | Bekliyor |
| N-007 | Ralph-tarzı otonom gorev dongusu (OpenClaw icin) | 3 | Bekliyor |
| N-008 | Wayne Agi icin Harness meta-skill (ajan takim tasarimcisi) | 3 | Bekliyor |
| N-009 | ccflare/better-ccflare kullanim dashboard (token/maliyet) | 2 | Bekliyor |
| N-010 | cc-tools Go tabanli hook performans iyilestirme | 2 | Bekliyor |

---
*Yeni oge eklemek icin tabloya satir ekle, puanla, durumu "Bekliyor" yap.*

## Alfred Analizi — 2026-04-14

**Genel Değerlendirme:** Sprint 1 işleri B-001 ve B-002 hâlâ "Sprint 1'de" olarak işaretli — bu görevlerin tamamlanıp tamamlanmadığı net değil. İlk adım olarak bu ikisinin durumunun netleştirilmesi gerekiyor.

### Öncelik Sıralaması

**🔥 Kritik (önce yapılmalı)**
- B-009 (.env — HA_URL + Telegram token): 1 puan, bekliyor. Dashboard'un doğru çalışması için bloker. Hemen halledilebilir.
- B-003 (Go workspace temizlik): 2 puan, bekliyor. Sefa'nın ana geliştirme ortamı — verimlilik doğrudan etkilenir.

**⚠️ Güvenlik & Stabilite**
- B-015 (dashboard auth): 3 puan, bekliyor. Dışarıya açık bir dashboard'ta auth yok = risk.
- B-005 (WireGuard optimizasyonu): 2 puan, bekliyor. VPN yapılandırması periyodik gözden geçirmeli.
- B-019 (error rate tracking + alert): 2 puan, bekliyor. Kesintileri erken yakalamak için şart.

**📊 İzleme & Gözlem**
- B-018 (performance metrics): 2 puan, bekliyor. B-019 ile paralel gidebilir.
- B-004 (HA otomasyon review): 3 puan, bekliyor. Smart home güvenilirliği için değerlendirilmeli.

**🔧 Altyapı**
- B-014 (PM2 path düzeltme): 1 puan. PM2 geçişi için altyapı hazırlığı.
- B-007 (Homepage özelleştirme): 1 puan. Düşük etki — sakin günlerde.

**✅ Zaten Tamamlanmış (gözden geçir)**
- B-006 (yedekleme otomasyonu): Cron-based yedekleme çalışıyor mu? Doğrulanmalı.
- B-016 (CORS headers): Gerçekten tamamlandı mı? Güvenlik açısından ikinci bir göz atmak faydalı.
- B-017 (stats history): Kalıcı veri saklanıyor mu, dosya yapısı ne?

### Çakışma/Uyumsuzluk Tespiti
- N-002 (Dippy auto-approve) ve N-007 (otonom görev döngüsü) benzer alanlara hitap ediyor — biri seçilmeli, ikisi birlikte çakışabilir.
- B-015 (basic auth) ve B-016 (CORS) birlikte ele alınmalı — güvenlik katmanları birbirini tamamlıyor.

### Öneri: Sprint 2 Tanımlaması
1. B-009 (hemen, 1p)
2. B-003 (önemli, 2p)
3. B-015 + B-016 birlikte (güvenlik, 4p)
4. B-005 + B-019 (stabilite, 4p)

---
*Alfred | 2026-04-14 09:30 UTC*
