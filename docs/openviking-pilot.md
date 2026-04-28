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
