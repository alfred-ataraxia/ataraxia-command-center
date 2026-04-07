# CRON ACTIVATION PLAN
**Hazırlandı:** 4 Nisan 2026, 23:10 GMT+3  
**Amaç:** AGENTS.md'de tanımlanan takım rapor flow'unu activate etmek

---

## 📅 ÖNERİLEN CRON JOBS

### 1. LUCIUS — Tech Radar (Haftalık Cuma)
```yaml
Job Name: lucius-tech-radar
Schedule: Cuma 18:00 (cron: "0 18 * * 5", tz: Europe/Istanbul)
Runtime: isolated (acp)
Payload: 
  kind: agentTurn
  message: "Haftalık Tech Radar raporu hazırla. Yeni AI tools, framework'ler, API'ler. SoftTech/İş Bankası fizyoloji dahil. Raporu ~/wonderful/2026-W{week}-tech-radar.md dosyasına yaz."
  model: google-gemini-cli/gemini-3.1-pro-preview
Delivery:
  mode: announce
  channel: telegram
  to: "Master Sefa"
```

---

### 2. ROBIN — Research Summary (Haftalık Pazartesi)
```yaml
Job Name: robin-research-summary
Schedule: Pazartesi 08:00 (cron: "0 8 * * 1", tz: Europe/Istanbul)
Runtime: isolated (acp)
Payload:
  kind: agentTurn
  message: "Haftalık Research Summary. Geçen haftanın önemli bulguları, teknoloji trendleri, rakip hareketi, sektör analizi. Strateji önerileri. ~/wonderful/ klasörüne yaz."
  model: google-gemini-cli/gemini-3.1-pro-preview
Delivery:
  mode: announce
  channel: telegram
  to: "Master Sefa"
```

---

### 3. NETRUNNER — Security Report (Günlük)
```yaml
Job Name: netrunner-daily-security
Schedule: Her gün 03:00 (cron: "0 3 * * *", tz: Europe/Istanbul)
Runtime: isolated (acp)
Payload:
  kind: agentTurn
  message: "Günlük security kontrol. OpenClaw sistem sağlığı, API key rotasyonu, anormal davranış, backup status. Kritik bulgu varsa uyar."
  model: google-gemini-cli/gemini-3.1-pro-preview
Delivery:
  mode: none
  # Kritik durumlar için ayrı webhook alert'i oluştur
```

---

### 4. ALFRED — Morning Briefing (Günlük Sabah)
```yaml
Job Name: alfred-morning-briefing
Schedule: Her gün 07:00 (cron: "0 7 * * *", tz: Europe/Istanbul)
Runtime: main (systemEvent)
Payload:
  kind: systemEvent
  text: "Sabah Brifing (07:00): Gece taraması, güvenlik raporu, email/mesajlar, takvim, dün neler oldu. Konsole konsolide rapor yaz."
```

---

### 5. ALFRED — Nightly Scan (Gece, HER ŞEKİ HAFTA)
```yaml
Job Name: alfred-nightly-scan
Schedule: Cuma/Cumartesi 23:00 (cron: "0 23 * * 5,6", tz: Europe/Istanbul)
Runtime: isolated (acp)
Payload:
  kind: agentTurn
  message: "Haftalık proaktif gece taraması. Workspace'i analiz et, teknik borç, kullanılmayan skill'ler, memory leaks. ~/wonderful/YYYY-MM-DD-nightly-scan.md dosyasına yaz. Kısa özet Telegram'a gönder."
  model: google-gemini-cli/gemini-3.1-pro-preview
Delivery:
  mode: announce
  channel: telegram
```

---

### 6. ALFRED — Weekly Summary (Pazar Öğle)
```yaml
Job Name: alfred-weekly-summary
Schedule: Pazar 12:00 (cron: "0 12 * * 0", tz: Europe/Istanbul)
Runtime: isolated (acp)
Payload:
  kind: agentTurn
  message: "Haftalık konsolide özet. Teknik raporlar (Tech Radar, Security, Research), Home Assistant KPI'ları, token tasarrufu, cost summary. Master Sefa'ya sunum formatında hazırla. ~/wonderful/YYYY-WXX-weekly-summary.md"
Delivery:
  mode: announce
  channel: telegram
  to: "Master Sefa"
```

---

## 🎯 İMALEME ADIMARI (Manual Setup)

### Seçenek 1: CLI via `cron` Tool
```bash
cron:add job={...} # Her job için tekrarla
```

### Seçenek 2: YAML File (Bulk)
Tüm job'ları `cron/cron-jobs.yaml` olarak hazırla, sonra import et.

### Seçenek 3: Hand-Deliver to ALFRED
Parametreleri ALFRED'e ver, o schedule etsin (preferred way).

---

## ✅ KONTROL LİSTESİ

**Activation Order:**
- [ ] Job 1: LUCIUS Tech Radar (Cuma)
- [ ] Job 2: ROBIN Research (Pazartesi)
- [ ] Job 3: NETRUNNER Security (Günlük 03:00)
- [ ] Job 4: ALFRED Morning (Günlük 07:00)
- [ ] Job 5: ALFRED Nightly (Cuma/Cumartesi)
- [ ] Job 6: ALFRED Weekly (Pazar)

**Testing:**
- [ ] İlk çalıştırma manual test et (`cron:run jobId`)
- [ ] Output'ları kontrol et
- [ ] Telegram delivery'sini kontrol et
- [ ] Schedule'ları kaydet

---

## 🚀 TARAF ETKİSİ

| Job | Output | Destination | Impact |
|-----|--------|-------------|--------|
| Tech Radar | Trend raporu | ~/wonderful/ + Telegram | Strategy decisions |
| Research | Insight'lar | ~/wonderful/ + Telegram | Decision support |
| Security | Health check | ~/wonderful/ (log) + Alert (critical) | Risk mitigation |
| Morning | Briefing | Telegram | Daily awareness |
| Nightly | Workspace audit | ~/wonderful/ + Telegram (Cuma) | Continuous optimization |
| Weekly | Konsolide summary | Telegram | Executive summary |

---

## 💡 NOTLAR

- **Fallback Model:** Google Gemini (free tier). Rate limit'e takılırsa → Claude upgrade
- **Telegram Token:** TOOLS.md'de kayıtlı. Ensure delivery.channel ayarları doğru
- **Timezone:** Europe/Istanbul (UTC+3)
- **Cost Impact:** Ajanlar isolated session'da çalışır → her job ~500-1000 tokens

---

*ALFRED'in orchestration yapısı bekliyordu. Bu schedule'lar o'nu hayata geçirecek.*
