# Alfred Task-Runner Çalışma Politikası

**Tarih:** 2026-04-30  
**Görev:** T-089  
**Durum:** Politika netleştirildi; cron/config değişikliği yapılmadı.

---

## Kısa Sonuç

`alfred-task-runner` şu an kapalı kalmalı.

Gerekçe:

- `jobs.json` içinde job mevcut ama `enabled:false`.
- Eski hafıza notları “Alfred her 30 dakikada TASKS.json poll eder” varsayımını taşıyor.
- Geçmiş run kayıtları, görev yokken bile pahalı ve yavaş agent run üretmiş.
- Son 20 run ortalaması yaklaşık **215 saniye**, maksimum **292 saniye**.
- Son 20 run ortalama token kullanımı yaklaşık **25K token**.
- Özetler çoğunlukla `NO_TASK` veya `HEARTBEAT_OK`; yani harcanan maliyetin operasyonel değeri düşük.

Bu nedenle görev kuyruğu için doğrudan LLM agent run yerine daha ucuz bir kontrol katmanı kullanılmalı.

---

## Mevcut Durum

`~/.openclaw/cron/jobs.json`:

| Alan | Değer |
|---|---|
| Job | `alfred-task-runner` |
| Enabled | `false` |
| Schedule | `2,32 * * * *` |
| Timezone | `Europe/Istanbul` |
| Delivery | `none` |
| Command kind | `agentTurn` |
| Prompt uzunluğu | Yaklaşık 2617 karakter |

Run geçmişi:

| Metrik | Değer |
|---|---:|
| Toplam geçmiş run | 651 |
| Son 20 run ortalama süre | 214.8 sn |
| Son 20 run min süre | 77.5 sn |
| Son 20 run max süre | 292.5 sn |
| Son 20 run ortalama token | ~25K |
| Son provider/model | MiniMax-M2.7 ve opencode-go/kimi-k2.5 |

---

## Sorun

Mevcut `agentTurn` tabanlı task-runner tasarımı basit `TASKS.json` kontrolü için fazla ağır.

Örnek davranış:

- Görev yoksa bile agent session açılıyor.
- Kanonik hafıza okunuyor.
- Model çağrısı yapılıyor.
- 2–5 dakika süren `NO_TASK` run oluşuyor.
- Aynı gateway/Telegram runtime kaynaklarını tüketiyor.

Bu, özellikle RPi 400 üzerinde Telegram gecikmesiyle çakışabilir.

---

## Politika Seçenekleri

### Seçenek A — Kapalı / Manuel

`alfred-task-runner` kapalı kalır. Görevler Codex/Claude/Gemini/Alfred oturumlarında manuel başlatılır.

**Artı:**

- En güvenli ve en az kaynak tüketen seçenek.
- OpenClaw base davranışı değişmez.
- Beklenmeyen agent run/maliyet yok.

**Eksi:**

- Tam otonom task pickup yok.
- Dashboard/TASKS görünürlüğü var ama otomatik icra yok.

**Uygunluk:** Şu an için önerilen varsayılan.

### Seçenek B — Düşük Maliyetli Script Check

Cron her 30 dakikada LLM çağırmadan sadece `TASKS.json` okur. Pending + `auto:true` + assignee `Alfred` varsa Telegram'a “görev var” bildirir veya dashboard’da görünür yapar. Görevi kendi başına icra etmez.

**Artı:**

- Çok düşük CPU/token maliyeti.
- Görev kaçırma problemi çözülür.
- OpenClaw agent runtime yükü yaratmaz.

**Eksi:**

- Gerçek iş yürütmez; sadece görünürlük sağlar.
- Küçük bir script/cron davranış değişikliği gerekir.

**Uygunluk:** En iyi kısa vadeli iyileştirme; onayla uygulanabilir.

### Seçenek C — Kontrollü Agent Run

Cron önce script ile kontrol eder. Sadece `auto:true`, `assignee:"Alfred"`, `priority:"high"` ve allowlist tag varsa agent run tetikler.

**Artı:**

- Otonomi geri gelir.
- Boş `NO_TASK` model çağrıları kesilir.
- Riskli görevler otomatik çalışmaz.

**Eksi:**

- Hâlâ agent run maliyeti ve gateway yükü üretir.
- İyi guardrail ve timeout gerekir.
- OpenClaw cron davranışı değişir; onay gerektirir.

**Uygunluk:** Seçenek B stabil olduktan sonra.

---

## Önerilen Karar

1. **Şimdilik Seçenek A:** `alfred-task-runner` kapalı kalsın.
2. **Sonraki iyileştirme Seçenek B:** LLM'siz `TASKS.json` watcher tasarlansın; sadece görünürlük/uyarı sağlasın.
3. **Otonomi için Seçenek C:** Sadece `auto:true` + allowlist + düşük riskli görevlerde agent run açılmalı.

Kural:

- `auto` etiketi olmayan görev otomatik çalıştırılmaz.
- Secret, finans, servis restart, cron/config değişikliği içeren görev otomatik çalıştırılmaz.
- `NO_TASK` için model çağrısı yapılmaz.
- Görev başlatma/bitirme `task-start.sh` ve `task-done.sh` ile kayıtlanır.

---

## Uygulama Onayı Gerektiren Adım

Onay verilirse sıradaki güvenli uygulama:

1. `alfred-task-runner` kapalı kalır.
2. Yeni bir `tasks-watch-lite` script tasarımı hazırlanır.
3. İlk faz cron'a bağlanmaz; manuel çalıştırılıp çıktı doğrulanır.
4. Sonra dashboard veya düşük frekanslı cron entegrasyonu için ayrıca onay alınır.

Bu görev kapsamında hiçbir cron/config değişikliği yapılmadı.
