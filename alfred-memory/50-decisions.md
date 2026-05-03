# Decisions

## 2026-04-11

- Kanonik ortak hafıza dizini olarak `/home/sefa/.openclaw/workspace/memory` seçildi.
- Amaç proje bazlı hafızayı aşarak tüm çalışma alanı için tek doğru kaynak oluşturmaktır.
- Kapalı araç hafızaları doğrudan birleştirilmeyecek; yalnızca disk üstündeki okunabilir kaynaklar konsolide edilecek.
- Codex, Claude Code ve Gemini için ortak giriş noktası dosya tabanlı olacak.
- `CLAUDE.md` kök dosyası ortak hafızaya yönlendirecek şekilde dolduruldu.

## 2026-04-30 — Cron Bildirim Stratejisi

**Karar:** Script'ler kendi Telegram bildirimlerini doğrudan gönderecek, Alfred tekrar bildirmeyecek.

**Gerekçe:** Morning briefing ve evening report script'leri zaten `curl` ile Telegram'a mesaj atıyordu. Alfred'in "başarıyla çalıştı" mesajı çift bildirim oluşturuyordu.

**Uygulama:**
- 3 cron job'un `delivery.mode`: `announce` → `none`
- Payload: "Script kendi bildirimini yapıyor, tekrar gönderme"

**Etkilenen job'lar:** morning-briefing, evening-report, morning-briefing-weekend

---

## 2026-04-30 — Morning Briefing Formatı

**Karar:** Hava durumu ve haber formatı tamamen yenilenecek.

**Detaylar:**
- wttr.in JSON API kullanımı (Türkçe açıklama, hissedilen sıcaklık, nem, rüzgar)
- 24 saatlik piyasa değişimi (BTC/ETH/SOL ↑↓%)
- Haberlerde site adı temizliği, kaynak etiketi, tekrar eden özet kaldırıldı
- Markdown → düz metin fallback mekanizması

**Dosya:** `morning-briefing.sh` + `news-collect.py`

---

## 2026-04-30 — Sistem Analizi Dokümantasyonu

**Karar:** Tüm ajanların erişebileceği kapsamlı sistem analizi raporu oluşturulacak.

**Konum:** `memory/21-system-analysis.md`

**İçerik:** Mimari, kaynak kullanımı, ajan ekosistemi, cron haritası, riskler, büyüme vektörleri

---

## 2026-04-30 — Orphan Script Arşivleme

**Karar:** Hiçbir cron job tarafından çağrılmayan 4 script arşivlendi.

**Dosyalar:** hourly-report.sh, cost-daily-check.sh, monday-review-trigger.sh, inbox-rotate.sh

**Konum:** `~/archive/cron-scripts-2026-04-30/`

**Gerekçe:** OpenClaw cron zaten `shared-notes-rotate` ve `session-retention-cleanup` yapıyor. Bu scriptler gereksiz disk alanı ve bakım yükü oluşturuyordu.

---

## 2026-04-30 — Cron-Failure-Alert Geçici Devre Dışı

**Karar:** `cron-failure-alert` cron job'u geçici olarak devre dışı bırakıldı.

**Gerekçe:** Job `agentTurn` olarak çalışıp her tick'te LLM çağırıyor (12-15K token, 66-115sn). Basit bir SQLite + curl kontrolü için bu gereksiz yük. Sandbox hatası da üretiyor.

**Uygulama:** `enabled: false` (jobs.json)

**Not:** Codex kalıcı LLM'siz çözüm tasarlayana kadar kapalı kalacak.

---

## 2026-05-01 — DeFi APM .env Gerçeklik Düzeltmesi

**Karar:** `.env` dosyası gerçek durumu yansıtacak şekilde düzeltildi.

**Değişiklikler:**
- `AUTOPILOT_EXECUTE=true` → `false`
- `AUTOPILOT_SIMULATE_ONLY=false` → `true`

**Gerekçe:** `REQUIRE_APPROVAL=true` zaten her tick'te `execute=false, simulateOnly=true` zorluyordu. `.env`'deki `execute=true` yanıltıcıydı ve memory belgeleriyle çelişiyordu. 3 katmanlı güvenlik (approval + simulateOnly + killswitch) korundu.

**B-080 blokajı kaldırıldı.**

---

## 2026-04-10 (Audit Sonuçları)

- `homepage/config/services.yaml` içindeki Home Assistant token, `HOMEPAGE_VAR_HOME_ASSISTANT_TOKEN` env değişkenine taşındı.
- `telegram_bot.py` için config dosyası ve servis birimi gerekliliği kabul edildi.
- `scrum/` ve `TASKS.json` senkronizasyonunun tek yöne indirilmesine karar verildi.
- `wonderful/` altına retention ve son çalışma zamanı kontrolü eklenmesi kararlaştırıldı.

## 2026-05-02 — ClauDEx Migration Kararı

**Karar:** claude-code-router (musistudio) kaldırıldı, yerine ClauDEx (sasdsamatt123) kuruldu.

**Gerekçe:**
- Router HTTP proxy yaklaşımı +100-200MB RAM gerektiriyordu (RPi 400'de sorun)
- ClauDEx shell function override ile çalışıyor (0MB ek RAM, proxy yok)
- Multi-account desteği (Anthropic rate limit x2)
- Bedava model desteği (Z.ai, MiniMax, OpenRouter)
- Natif Anthropic protokolü korunuyor
- Codex CLI, Gemini CLI, OpenCode Go abonelik araçları olarak kalır (ClauDEx kapsamı dışında, shell alias ile erişilebilir)

**Risk azaltma:**
- Eski router config yedeklendi: `~/backups/claudex-migration-20260501/`
- Eski router npm paketi hâlâ yüklü (geri dönüş için)
- `claude-main` her zaman native Anthropic geri dönüş yolu olarak korunuyor

---

## 2026-05-02 — OpenViking Pilot Kararı (Faz 3.3)

**Karar:** Yeterli KPI verisi oluşmadığı için production contextEngine varsayılan OpenClaw olarak bırakılacak.

**Gerekçe:** T-078 - T-084 kapsamında yerel OpenViking hafıza pilotu aktif edildi. `openviking-kpi.jsonl` loglarında `ov_used: true` durumu yetersiz (çoğunluk `memory_intent: false`). 

**Uygulama:** Hibrit arama (Telegram botundaki fallback try-catch) standart prosedür olarak devam edecektir.

## 2026-05-03: Ajan İzolasyonu ve Model Optimizasyonu (Modül 1.1 & 1.2)
- **Ajan İzolasyonu:** Ana ajan Alfred, global workspace'ten alınarak `~/.openclaw/agents/alfred` altına taşındı. Kendi `agent.json` ve `SOUL.md` dosyalarına sahip oldu.
- **Model Değişikliği:** Alfred ve MAIT ajanları, maliyet ve kota sorunları nedeniyle native **Google Gemini 1.5 Flash** modeline taşındı. Google AI Studio API anahtarı ile çalışıyorlar.
- **Kota Takibi:** `/kota` komutu bir "Skill" olarak sisteme eklendi. `quota-manager.py` üzerinden canlı log taraması yapılarak gerçek zamanlı token kullanımı raporlanıyor.
- **Heartbeat Throttling:** Sistem yükünü azaltmak için ajan heartbeat frekansı 15 dakikadan 24 saate düşürüldü.
