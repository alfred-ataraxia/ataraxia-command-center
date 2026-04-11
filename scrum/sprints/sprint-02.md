# Sprint 2 — Dashboard MVP Sertleştirme

**Hedef:** 5 çalışan bölümün her birini gerçek veriyle besle, gürültüyü kes
**Tarih:** 2026-04-10 → 2026-04-17
**Durum:** Aktif

---

## Sprint Backlog

| #     | Görev                                              | Puan | Durum    |
|-------|----------------------------------------------------|------|----------|
| S2-01 | Logs: openclaw→alfred-hub dizin geçişi             | 1p   | Bekliyor |
| S2-02 | Agents: gerçek model göster (Robin→Gemini)         | 2p   | Bekliyor |
| S2-03 | Overview: görev özeti widget                       | 1p   | Bekliyor |
| S2-04 | Tasks: done görevleri gizle / arşiv toggle         | 2p   | Bekliyor |
| S2-05 | Memory: MEMORY.md index, dosyaya tıklayınca içerik | 2p   | Bekliyor |

**Toplam:** 8p

---

## Görev Detayları

### S2-01 — Logs dizin geçişi (1p)
**Sorun:** `server.cjs` hâlâ `~/openclaw/logs` okuyor. `task-runner.log` görünmüyor.
**Çözüm:** Log tarama dizinini `~/alfred-hub/logs/` + `~/alfred-hub/command-center/dashboard/logs/` yap.
**Dosya:** `server.cjs` — `/api/logs` ve `/api/logs/stream` handler'ları

### S2-02 — Agents gerçek model (2p)
**Sorun:** 4 ajan hepsi `claude-sonnet-4-6` gösteriyor. Robin için Gemini yok.
**Çözüm:**
- TASKS.json'dan her ajanın en son görevindeki `preferred_model` al
- Robin → `gemini-2.5-pro`, diğerleri atanan modeli göster
- `tasksTotal` / `tasksToday` gerçek TASKS.json verisinden hesapla
**Dosya:** `server.cjs` — `/api/agents` handler

### S2-03 — Overview görev özeti (1p)
**Sorun:** Overview sadece sistem metriği gösteriyor, görev durumu yok.
**Çözüm:** Stat kartlarının altına küçük özet satırı: `pending / in_progress / done` sayıları + aktif sprint adı
**Dosya:** `Overview.jsx` + `/api/tasks` zaten mevcut

### S2-04 — Tasks arşiv toggle (2p)
**Sorun:** 65+ done görev ekranda, aktif işleri bulmak zorlaşıyor.
**Çözüm:**
- Varsayılan: done görevleri gizle
- FilterPanel'de "Tamamlananları göster" toggle (varsayılan kapalı)
- "N görev gizlendi" bilgi satırı
**Dosya:** `TaskQueue.jsx`

### S2-05 — Memory index + içerik (2p)
**Sorun:** MEMORY.md ham metin olarak duruyor, diğer dosyalar type badge'i yok, içerik küçük.
**Çözüm:**
- MEMORY.md'yi özel olarak parse et → link listesi göster
- Dosyaya tıklayınca tam içerik expanded panel aç
- Type badge renkleri: feedback=amber, project=cyan, user=purple, reference=green
**Dosya:** `MemoryView.jsx`

---

## Kapsam Dışı
- Yeni sayfa / view ekleme
- HA entegrasyonu
- Telegram bildirimleri
- Task runner değişiklikleri
