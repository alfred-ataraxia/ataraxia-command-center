# OpenClaw Cron / Tool Sandbox Analizi

Tarih: 2026-04-30  
Görev: T-093  
Durum: Analiz tamamlandı; config/cron değişikliği yapılmadı.

## Problem

OpenClaw loglarında `cron-failure-alert.sh` için şu hata görülüyor:

```text
exec host=sandbox requires a sandbox runtime for this session
```

Bu hata Telegram gecikmesiyle aynı dönemde göründüğü için kök neden ayrımı yapıldı.

## Kanıtlar

- `/tmp/openclaw/openclaw-2026-04-30.log` içinde aynı hata 05:22 ve 15:22 civarında tekrarlandı.
- Hatalı tool çağrısında raw params açık: `command="bash /home/sefa/alfred-hub/command-center/cron/cron-failure-alert.sh"` ve `host="sandbox"`.
- `~/.openclaw/cron/jobs.json` içinde `cron-failure-alert` job'u doğrudan script değil, `payload.kind="agentTurn"` olarak tanımlı.
- Aynı job `toolsAllow=["exec"]` ile LLM ajanına "bu bash komutunu çalıştır" diye görev veriyor.
- `~/.openclaw_engine/src/cron/service/timer.ts` detached/isolated cron job'larda yalnızca `payload.kind="agentTurn"` kabul ediyor.
- `~/.openclaw_engine/src/agents/bash-tools.exec.ts` içinde `host=sandbox` seçilmişse ve session sandbox runtime taşımıyorsa aynı hata bilerek üretiliyor.
- Son run kayıtları `cron-failure-alert` job'unun tek başına yaklaşık 66-115 saniye sürdüğünü ve çoğu çalışmada 12K-15K token harcadığını gösteriyor.

## Kök Neden

Bu bir `cron-failure-alert.sh` script bug'ı değil. Script shell seviyesinde basit: SQLite'tan son cron hatalarını okuyor, yeni hata varsa Telegram'a mesaj atıyor.

Asıl sorun şu zincir:

1. OpenClaw cron job'u script'i doğrudan çalıştırmıyor.
2. Job, LLM/agent turn başlatıyor.
3. Agent `exec` tool çağrısında `host=sandbox` seçiyor.
4. Bu session için sandbox runtime yok.
5. Tool güvenli şekilde fail ediyor.

Ek performans etkisi: Hata olmasa bile bu job düzenli olarak LLM çalıştırıyor. Basit bir SQLite + curl kontrolü için 1-2 dakikalık agent turn ve yüksek token kullanımı gereksiz yük oluşturuyor.

## Güvenli Çözüm Seçenekleri

### 1. Sandbox Runtime Açmak

Öneri: Şimdilik uygulanmasın.

Artı:
- `host=sandbox` çağrıları çalışabilir hale gelir.

Eksi:
- OpenClaw base execution model değişir.
- Yeni runtime/container davranışı ekler.
- Telegram yavaşlığının ana sorununu çözmez; cron hâlâ LLM üzerinden çalışır.

### 2. Cron Prompt'unu `host=auto/gateway` Diye Sıkılaştırmak

Öneri: Geçici workaround olarak mümkün ama ideal değil.

Artı:
- Sandbox hatasını azaltabilir.
- Küçük config değişikliğiyle yapılabilir.

Eksi:
- Agent yine LLM olarak çalışır.
- Token ve lane yükü devam eder.
- Modelin tool parametresini her zaman doğru seçeceği garanti değil.

### 3. Job'u LLM'siz Script Akışına Taşımak

Öneri: En doğru yön, ama OpenClaw cron içinde hazır direct-exec payload görünmediği için ayrıca tasarlanmalı.

Artı:
- 66-115 saniyelik agent turn ortadan kalkar.
- 12K-15K token tüketimi ortadan kalkar.
- Telegram ana hattına binen gereksiz yük azalır.
- Script zaten kendi dedup ve Telegram bildirim mantığını taşıyor.

Eksi:
- OpenClaw cron `isolated` işlerinde direct-exec desteklemiyor görünüyor.
- Ya OpenClaw dışı systemd timer gerekir ya da OpenClaw cron motoruna yeni güvenli payload tipi eklemek gerekir.
- Bu, kullanıcı onayı olmadan yapılmamalı.

### 4. Job'u Geçici Kapatmak

Öneri: Sadece acil stabilizasyon gerekiyorsa uygulanmalı.

Artı:
- Anında yük ve token tüketimi azalır.
- Telegram gecikmesi üzerindeki cron kaynaklı baskı düşer.

Eksi:
- Cron hata bildirimi geçici olarak susar.
- Kapatma kararı kullanıcı onayı gerektirir.

## Tavsiye

Kısa vadede config değiştirmeden T-093 analizi kapatılmalı ve ayrı bir uygulama görevi açılmalı:

- `cron-failure-alert` için LLM'siz çalışma yolu tasarla.
- OpenClaw base cron davranışı değiştirilmeyecekse systemd user timer veya mevcut host cron gibi dış scheduler değerlendir.
- OpenClaw içine direct-exec payload eklenecekse önce küçük RFC/test hazırlanmalı.
- Kullanıcı onayı olmadan `~/.openclaw/cron/jobs.json`, `~/.openclaw/openclaw.json` veya servis restart yapılmamalı.

T-085 Telegram gecikmesi açısından bu bulgu "tek kök neden" değil; ama gereksiz LLM cron yükü olduğu için performans iyileştirme listesinin üst sırasına alınmalı.
