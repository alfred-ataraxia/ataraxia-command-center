# OpenClaw Model Routing Doğrulaması

Tarih: 2026-04-30  
Görev: T-086  
Durum: Doğrulandı; config değişikliği yapılmadı.

## Sonuç

OpenClaw model routing şu an tutarlı görünüyor:

- `agents.defaults.model.primary`: `opencode-go/kimi-k2.5`
- `alfred.model.primary`: `opencode-go/kimi-k2.5`
- `mait.model.primary`: `opencode-go/kimi-k2.5`
- `mercer.model.primary`: `opencode-go/kimi-k2.5`
- 2026-04-30 gateway loglarında agent model kayıtları `opencode-go/kimi-k2.5` olarak görünüyor.

## Fallback Sırası

Mevcut fallback sırası:

1. `opencode-go/minimax-m2.7`
2. `opencode-go/minimax-m2.5`
3. `opencode-go/mimo-v2-pro`
4. `opencode-go/mimo-v2-omni`
5. `opencode-go/glm-5`
6. `opencode-go/glm-5.1`
7. `minimax-portal/MiniMax-M2.7-highspeed`

Bu sıra quota-safe ve OpenCode Go ağırlıklı. `openai-codex/*` modelleri primary/fallback yürütme sırasına alınmamış; sadece model menüsünde tanımlı modeller arasında duruyor.

## Performans Yorumu

Telegram gecikmesinin ana nedeni şu an model routing tutarsızlığı gibi görünmüyor.

Daha güçlü kanıtlar:

- `memory-core dreaming` kapatma testi tek başına sorunu çözmedi.
- Aynı dönemde `lane wait exceeded` ve Telegram polling stall görüldü.
- `cron-failure-alert` agentTurn job'u 66-115 saniye ve 12K-15K token harcıyor.
- `/models` komutu menü/config okuma ve Telegram callback tarafına bağlı; LLM cevabından bağımsız yavaşlayabiliyor.

## Tavsiye

- Alfred varsayılanı şimdilik `opencode-go/kimi-k2.5` kalsın.
- `opencode-go/glm-5.1` Telegram varsayılanı yapılmasın; manuel testte yavaş hissedildi.
- MiniMax modeller fallback olarak kalsın; direct MiniMax endpoint yerine OpenCode Go kanalı tercih edilsin.
- Bir sonraki optimizasyon model değiştirmek değil, Telegram native komutlarını ve cron-agent yükünü hafifletmek olmalı.

## Açık Risk

Telegram `/models` ile yapılan kullanıcı seçiminin session-local override üretip üretmediği tam olarak ayrı ölçülmeli. Bugünkü dosya/log kontrolünde gateway çalışma modeli `opencode-go/kimi-k2.5` görünüyor; ancak UI seçimlerinin anlık session davranışı canlı Telegram testiyle ayrıca doğrulanmalı.
