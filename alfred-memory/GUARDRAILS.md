# Ataraxia Guardrails & Safety Policy

**Scope:** Operasyonel güvenlik + kaynak yönetimi + otonom motor kuralları.
**Budget/rate-limit kanonik kaynağı:** `~/alfred-hub/command-center/GUARDRAILS.md` (bu dosya sadece hatırlatma amaçlı budget özetini tutar — çelişki olursa command-center kazanır).

Bu doküman, Alfred ve diğer otonom ajanların uyması gereken katı sınırları (hard limits) belirler.

## 1. Finansal Bütçe (Özet — detaylar için command-center/GUARDRAILS.md)

- **Günlük Soft Limit:** $5.00 (uyarı: $3.75 / %75)
- **Aylık Hedef:** $100.00 (uyarı: $75.00 / %75)
- **Görev Başı Eşik:** $1.00 (aşarsa onay iste)
- **DeFi İşlem Limiti:** Onay alınmadan tek seferde maks. 0.05 ETH veya 50 USDC.
- **Not:** Claude API şu an aktif değil — OpenRouter ücretsiz tier / MiniMax/Gemini sabit abonelik.

## 2. Operasyonel Güvenlik (Code & Shell)
- **Yıkıcı Komutlar:** `rm -rf`, `format`, `mkfs` vb. komutlar kesinlikle Telegram onayı olmadan çalıştırılamaz.
- **Port Açma:** Sisteme yeni bir dış port açılması (UFW/Modem) Master Sefa'nın "EVET" onayı olmadan yapılamaz.
- **Credential Handling:** `.env` dosyaları asla `shared-notes.md` veya diğer dokümanlara düz metin olarak kopyalanamaz.

## 3. Otonom Motor Kuralları
- **`auto: true` Filtresi:** Sadece bu etikete sahip görevler otonom olarak (insan müdahalesi olmadan) çalıştırılabilir.
- **Depeg Protokolü:** TVL kaybı %50'yi aşan havuzlarda ajan "ACİL DURUM" uyarısı geçer ve eğer onaylıysa pozisyonu kapatır.
- **Hata Döngüsü:** Bir görev üst üste 3 kez başarısız olursa `suspended` statüsüne alınmalı ve gürültü yaratmamak için sessize alınmalıdır.

## 4. Kaynak Yönetimi (RPi 400)
- **RAM Koruması:** Bellek kullanımı %90'ı aşarsa, kritik olmayan Docker container'ları (örn. remotion-test) geçici olarak durdurulabilir.
- **Disk Koruması:** `/home/sefa` doluluğu %90'ı aşarsa, `history.json` arşivleme zorunlu olarak tetiklenir.

---
*Mühürlendi: 2026-04-18 | Alfred*
