---
name: Token Bütçesi ve Otomasyon Güvenliği
description: Habersiz token harcamasını önleme kuralları — task-runner, cron, auto filtre
type: feedback
originSessionId: 0049017d-6ed7-43f2-a198-08736dd887ac
---
**Kural:** Task-runner yalnızca `auto: true` olan görevleri çalıştırmalı. Tüm pending görevleri otomatik alma.

**Why:** 2026-04-10'da task-runner cron'u `auto` filtresi olmadan çalıştı, token hakkının %25'ini habersiz harcadı. Sefa "hiç kullanmazken token hakkının %25'i gitmiş" diye uyardı.

**How to apply:**
- Task-runner konfigürasyonunda `auto: true` filtresi zorunlu
- Cron günde 2'den fazla çalışmamalı (mevcut: sabah + akşam)
- Yeni otomasyon kurulurken Sefa'nın token harcaması konusunda haberi olsun
- `task-runner.sh`'da değişiklik yaparken auto filtre mantığını koru
- GitHub'a habersiz commit+push yapmama — her zaman onay al
