# OpenViking Alfred Hafıza Pilotu

**Durum:** Başladı  
**Tarih:** 2026-04-28  
**Sahip:** Codex  
**Backlog:** B-079  

## Amaç

OpenViking'i Alfred/OpenClaw için uzun dönem hafıza katmanı olarak denemek; mevcut kanonik memory ve Obsidian köprüsünü bozmadan retrieval kalitesini ölçmek.

## Kapsam

- Pilot workspace: `/home/sefa/.openviking-alfred-pilot`
- Kanonik memory kaynağı: `~/.openclaw/workspace/memory/`
- Obsidian vault kaynağı: `/home/sefa/ikinci-beyin`
- OpenClaw state: `~/.openclaw/openclaw.json`

## Güvenlik Sınırı

- İlk fazda OpenClaw `plugins.slots.contextEngine` değiştirilmeyecek.
- Production gateway restart yapılmayacak.
- Import kaynakları read-only işlenecek.
- Token, API key, seed veya private key OpenViking resource olarak import edilmeyecek.
- Ağ/servis açma, gateway restart veya plugin activation için ayrıca onay alınacak.

## Fazlar

| Faz | İş | Çıktı |
|---|---|---|
| 0 | Proje kaydı ve pilot workspace | Bu dosya + TASKS kayıtları |
| 1 | Preflight | Node/OpenClaw/Python/Rust/RAM/disk ve plugin compatibility raporu |
| 2 | Local server denemesi | OpenViking HTTP servis healthcheck; OpenClaw'a bağlamadan |
| 3 | Read-only import | Seçili memory + Obsidian özetlerinin import testi |
| 4 | Retrieval ölçümü | Alfred soruları için doğru hatırlama / token / latency gözlemi |
| 5 | Karar | Devam, ertele veya production plugin activation önerisi |

## Başarı Kriterleri

- Alfred, Obsidian ve kanonik memory'deki kritik bilgileri daha tutarlı geri çağırır.
- Retrieval izlenebilir olur; hangi context'in geldiği debug edilebilir.
- RPi 400 üzerinde RAM/CPU/queue şişmesi oluşmaz.
- Mevcut `~/.openclaw/workspace/memory/` ve `/home/sefa/ikinci-beyin` düzeni bozulmaz.

## Bilinen Riskler

- OpenViking ek HTTP servis ve semantic worker yükü getirir.
- Rust/C++ bağımlılıkları veya Python wheel build süresi RPi 400 için ağır olabilir.
- OpenClaw plugin/API uyumsuzluğu raporları vardır; özellikle `memory_recall` endpoint path ve semantic queue davranışı izlenmeli.
- AGPLv3 lisans ana proje için dikkate alınmalı.

## İlk Görevler

| Task | Amaç | Atanan |
|---|---|---|
| T-076 | Pilot kayıt + workspace hazırlığı | Codex |
| T-077 | OpenViking preflight + kurulum stratejisi | Codex |
| T-078 | Read-only import aday listesi ve test soruları | Gemini |
| T-079 | Retrieval skorlaması ve Faz 5 kararı | Codex |

## T-079 Sonucu

- Rapor: `/home/sefa/.openviking-alfred-pilot/reports/t079-retrieval-score.md`
- Ham sonuç: `/home/sefa/.openviking-alfred-pilot/reports/t079-results.json`
- Sonuç: `ov find` strict skor 7/10; queue sağlıklı, ancak retrieval kalitesi production için yeterli değil.
- Karar: OpenViking henüz OpenClaw production `contextEngine` olarak bağlanmayacak.
- Sonraki adım: hybrid retrieval prototipi ve embedding/rerank iyileştirmesi.

## T-080 Sonucu

- Rapor: `/home/sefa/.openviking-alfred-pilot/reports/t080-hybrid-retrieval-report.md`
- Ham sonuç: `/home/sefa/.openviking-alfred-pilot/reports/t080-hybrid-results.json`
- Scriptler: `/home/sefa/.openviking-alfred-pilot/scripts/hybrid-retrieve.py`, `/home/sefa/.openviking-alfred-pilot/scripts/run-hybrid-tests.py`
- Sonuç: hybrid retrieval skoru 10/10, P0 skoru 5/5.
- Karar: Production `contextEngine` hâlâ değişmeyecek; hybrid wrapper Alfred için kontrollü yan bellek adapter'ı olarak değerlendirilecek.

## T-081 Sonucu

- Rapor: `/home/sefa/.openviking-alfred-pilot/reports/t081-adapter-report.md`
- Ham sonuç: `/home/sefa/.openviking-alfred-pilot/reports/t081-adapter-results.json`
- Adapter: `/home/sefa/.openviking-alfred-pilot/scripts/alfred-memory-query.sh`
- Sonuç: adapter dry-run 10/10, P0 5/5, secret leak kontrolü 10/10 güvenli.
- Karar: Alfred Telegram pipeline'a doğrudan bağlanmadan önce Dashboard MemoryView health + dry-run paneli yapılacak.

## T-082 Sonucu

- Backend endpointleri eklendi: `GET /api/openviking/health`, `POST /api/openviking/query`.
- UI eklendi: `dashboard/src/components/MemoryView.jsx` içinde OpenViking Pilot kartı.
- Özellikler: queue/son skor görünümü, dry-run query formu, confidence/strategy/süre gösterimi.
- Güvenlik: production `contextEngine` değişmedi; dry-run endpoint secret-pattern filtresi içeriyor.

## T-083 Sonucu

- Dosya: `command-center/telegram/telegram_bot.py`
- Koşullu hafıza intent tespiti eklendi (`is_memory_intent`): sadece hafıza niyetli mesajlarda OpenViking adapter çağrılıyor.
- Adapter entegrasyonu eklendi (`query_openviking_memory`): `alfred-memory-query.sh` çağrısı, `timeout=3s`, `ok=true` ve `confidence in {high, medium}` filtreleri.
- Fallback: timeout/hata/düşük confidence durumunda sessiz fallback ile mevcut kanonik memory akışı aynen devam ediyor.
- Kapsam: production `contextEngine` ve gateway mimarisi değiştirilmedi; entegrasyon dry-run/yardımcı context katmanı olarak kaldı.

## T-084 Sonucu

- Telegram botta OpenViking KPI event log eklendi: `~/openclaw/logs/openviking-kpi.jsonl`.
- Dashboard backend endpointi eklendi: `GET /api/openviking/kpi?days=7` (1-30 gün aralığı).
- KPI metrikleri: `memoryIntentEvents`, `ovFallbackEvents`, `fallbackRatePct`, `p95LatencyMs`, `replyBlockedRatePct`, confidence dağılımı.
- Dashboard MemoryView'e KPI kartı eklendi (7 günlük intent/fallback/p95/blocked görünümü).
- Bu adım rollout kararı için ölçülebilir temel veri üretir; production `contextEngine` hâlâ değiştirilmedi.
