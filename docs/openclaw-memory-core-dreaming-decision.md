# OpenClaw Memory-Core Dreaming Karar Paketi

**Tarih:** 2026-04-30  
**Görev:** T-088  
**Durum:** Ölçüm tamamlandı; 2026-04-30 16:03 itibarıyla Master Sefa onayıyla 24 saatlik A/B test başlatıldı.

---

## Kısa Sonuç

`memory-core dreaming` şu anda OpenClaw yavaşlığı için en güçlü adaylardan biridir.

Sebep:

- Gateway health endpoint hızlı cevap veriyor; sorun genel port erişimi değil.
- Legacy `telegram_bot.py` süreci görünmüyor; eski bot çakışması ana aday olmaktan çıktı.
- Browser/device/phone/talk pluginleri kapalı; browser sidecar portu dinlemiyor.
- Buna rağmen gateway süreci dönemsel yüksek CPU/RSS gösteriyor.
- OpenClaw logu yoğun `memory-core` dreaming çıktısı, narrative generation timeout ve uzun dream diary metinleri içeriyor.

---

## Ölçüm Bulguları

### Canlı Durum

| Metrik | Değer |
|---|---|
| Gateway health | `18789 /health` → 200, hızlı |
| Dashboard | `4173 /api/sprint` → 200 |
| OpenViking | `1933 /health` → 200 |
| OpenViking embedding | `1934 /health` → 200 |
| RAM | 3.7Gi toplam, swap kullanımı yaklaşık 1.5Gi |
| Gateway RSS | Ölçüm sırasında yaklaşık 793MB–1.3GB aralığı |
| Gateway CPU | `ps` örneklerinde yaklaşık %21 CPU |

### Log Sayımı

Kaynak: `/tmp/openclaw/openclaw-2026-04-30.log`

| Olay | Sayı |
|---|---:|
| `light dreaming staged` | 147 |
| `REM dreaming wrote` | 147 |
| `dream diary entry written` | 280 |
| `dreaming promotion complete` | 49 |
| `status=timeout` | 14 |

Zaman aralığı: 2026-04-30 00:24 → 14:59.

Workspace dağılımı:

| Workspace | Dreaming log adedi |
|---|---:|
| `/home/sefa/.openclaw/workspace` | 189 |
| `/home/sefa/.openclaw/agents/mait` | 197 |
| `/home/sefa/.openclaw/agents/mercer` | 197 |

### Config Gözlemi

`~/.openclaw/openclaw.json` içinde:

```json
{
  "memory-core": {
    "config": {
      "dreaming": {
        "enabled": true
      }
    }
  }
}
```

Cron tarafında ayrıca günlük `__openclaw_memory_core_short_term_promotion_dream__` system event'i var:

- Schedule: `0 3 * * *`
- Durum: enabled

Ancak loglar sadece 03:00 civarı değil, gün içine yayılan dreaming aktivitesi de gösteriyor. Bu yüzden tek başına cron saatini kaydırmak yeterli olmayabilir.

---

## Seçenekler

### Seçenek A — Hiç Dokunma, Sadece İzle

**Artı:**

- OpenClaw base davranışı korunur.
- Hafıza konsolidasyonu kesilmez.

**Eksi:**

- Telegram ve CLI gecikmesi tekrar edebilir.
- Log ve model çağrısı yükü devam eder.
- RPi 400 RAM sınırında swap baskısı sürer.

**Uygunluk:** Kısa süreli gözlem için kabul edilebilir; kalıcı çözüm değil.

### Seçenek B — Dreaming'i Geçici Kapat

**Artı:**

- En hızlı ve net A/B testi.
- Gateway CPU/RSS ve Telegram latency etkisi açık ölçülür.
- OpenViking + kanonik markdown hafıza zaten çalıştığı için ana operasyon hafızası tamamen kaybolmaz.

**Eksi:**

- OpenClaw memory-core'un otomatik konsolidasyon/dreaming davranışı durur.
- Uzun vadeli etkisi gözlenmeden kalıcı yapılmamalı.

**Uygunluk:** En iyi ilk deney. Süre sınırlı uygulanmalı.

Önerilen test penceresi:

- 24 saat geçici kapatma
- Önce/sonra ölçüm: Telegram `/status`, `/models`, kısa normal mesaj, hafıza niyetli mesaj
- Gateway CPU/RSS ve timeout sayısı karşılaştırılır

### Seçenek C — Sadece 03:00 Promotion Kalsın, Gün İçi Dreaming Azaltılsın

**Artı:**

- Hafıza konsolidasyonu tamamen kapanmaz.
- Kullanıcı saatlerinde yük azalabilir.

**Eksi:**

- Gün içi dreaming hangi mekanizma ile tetikleniyor netleşmeden yanlış ayar yapılabilir.
- OpenClaw base davranışına daha fazla müdahale gerektirir.

**Uygunluk:** B seçeneğiyle A/B testten sonra.

### Seçenek D — OpenViking'i Hafıza Retrieval Katmanı, Memory-Core'u Sadece Arşiv Katmanı Yap

**Artı:**

- OpenViking hybrid retrieval zaten 10/10 test verdi.
- Telegram için daha deterministik, timeout kontrollü ve ölçülebilir hafıza yolu oluşur.
- Dreaming anlatı üretimi yerine kanonik dosya + retrieval ağırlıklı akışa geçilir.

**Eksi:**

- Production `contextEngine` geçişi ayrı tasarım ve rollback ister.
- OpenClaw'ın kendi memory-core özellikleri kısmen devre dışı kalabilir.

**Uygunluk:** Orta vadeli hedef; hemen yapılmamalı.

---

## Önerilen Karar

1. **Önce Seçenek B:** `memory-core dreaming` 24 saat geçici kapatılsın.
2. Bu sırada Telegram latency ve gateway CPU/RSS ölçülsün.
3. İyileşme belirginse Seçenek C tasarlansın: sadece düşük trafik saatinde konsolidasyon.
4. OpenViking production geçişi ayrı task olarak, sadece KPI verisi yeterli olursa değerlendirilsin.

Bu karar OpenClaw davranışını etkilediği için uygulama onay ister.

---

## Onay Gerektiren Uygulama Adımı

Onay verilirse yapılacak kontrollü deney:

1. `~/.openclaw/openclaw.json` yedeği alınır.
2. `plugins.entries.memory-core.config.dreaming.enabled=false` yapılır.
3. Gateway kontrollü restart edilir.
4. 24 saat ölçüm yapılır.
5. Sonuç kötüleşirse backup ile geri alınır.

Onay olmadan bu adımlar uygulanmaz.

---

## 2026-04-30 Uygulama Kaydı

Master Sefa onayı sonrası kontrollü A/B test başlatıldı.

| Alan | Değer |
|---|---|
| Başlangıç | 2026-04-30 16:03 Europe/Istanbul |
| Planlanan bitiş | 2026-05-01 16:03 Europe/Istanbul |
| Değişiklik | `plugins.entries.memory-core.config.dreaming.enabled=false` |
| Backup | `~/.openclaw/openclaw.json.bak-memory-core-dreaming-20260430-160233` |
| Gateway restart | Yapıldı |
| Health sonrası | `18789 /health` 200, 2–9ms |
| Dream cron durumu | OpenClaw logu: `memory-core: removed 1 managed dreaming cron job(s)` |
| Güncel CPU örneği | `top` örneğinde 0–1% |
| Güncel RSS örneği | Yaklaşık 630MB |

Not:

- Startup yaklaşık 2–3 dakika sürdü ve ilk anda CPU spike üretti.
- Stabil olduktan sonra gateway health hızlı ve CPU düşük göründü.
- Testin amacı Telegram gecikmesinin düşüp düşmediğini ölçmek; hafıza kalitesi etkisi ayrıca izlenecek.

Rollback:

1. Backup dosyasından `~/.openclaw/openclaw.json` geri yüklenir.
2. Gateway restart edilir.
3. `dreaming.enabled=true` ve managed dream job geri geldi mi doğrulanır.

---

## 2026-04-30 Erken Sonuç ve Rollback

İlk Telegram testi hedefleri karşılamadığı için A/B test erken sonlandırıldı.

| Test | Sonuç |
|---|---|
| `/status` | 7 sn — önceye göre iyi ama hedef dışı |
| `/models` | 19 sn — kötüleşti |
| `orada mısın` | typing 11 sn, 1.5 dk+ final cevap yok |

Rollback uygulandı:

- `~/.openclaw/openclaw.json.bak-memory-core-dreaming-20260430-160233` geri yüklendi.
- `memory-core.config.dreaming.enabled=true` oldu.
- Gateway restart edildi.

Ek bulgu:

- Aynı zaman penceresinde Telegram polling stall, `sendMessage` network failure ve `lane wait exceeded` logları görüldü.
- Bu nedenle `memory-core dreaming` tek başına kök neden değildir.
- Sıradaki daha doğru odak: Telegram transport/fast path ve main lane blokajını ayırmak.
