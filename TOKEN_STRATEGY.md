# 🎯 Token Optimizasyon Stratejisi - Ataraxia Command Center
**Tarih:** 2026-04-07 | **Durum:** AKTIF

---

## 📊 Mevcut Token Limitleri
```
Per-Session:  100% (5 saatlik session)
             Resets her 5 saatte
             
Weekly:       50% (Tüm modeller birleşik)
             Resets Pazartesi 11:00 AM
```

---

## 🔄 OPTIMAL KULLANIM DÖNGÜSÜ

### Tier 1: HAIKU (70% görevler — hafif, sık)
- **Amaç:** Rutin task execution
- **Frekans:** Her 30 dakikada 1 görev
- **Token/görev:** ~50-100 tokens
- **Kullanım:** T-069, T-070, T-071, vb. kod yazma görevleri
- **Kural:** Prompt minimal, CLI-heavy, dosya okuma yok

### Tier 2: SONNET (25% görevler — orta, dönemsel)
- **Amaç:** Proje analizi, refactoring, kompleks logic
- **Frekans:** Session başında (her 5 saatte 1x)
- **Token/görev:** ~500-1000 tokens
- **Kullanım:** Audit, architecture review, performance optimization
- **Kural:** Kapsamlı analiz, multiple files, complex reasoning

### Tier 3: OPUS (5% görevler — ağır, nadir)
- **Amaç:** Strategik karar, Kaizen migration, system redesign
- **Frekans:** Günde 1x (sabah 09:00)
- **Token/görev:** ~2000-3000 tokens
- **Kullanım:** T-074 (Kaizen), T-055, long-term planning
- **Kural:** Proof of concept, architectural decisions

---

## 📅 HAFTAIK TAKVIM

```
MON 09:00  — Opus: Weekly Strategic Review (3000 tokens)
            → Kaizen Migration status, system health, bottlenecks

TUE-FRI:   — Haiku Cycle: 5-saatlik session her 4-5 saatte
            08:00 - 13:00: Session 1 (Haiku 8 görev)
            13:00 - 18:00: Session 2 (Haiku 8 görev)  
            18:00 - 23:00: Session 3 (Haiku 8 görev)
            
            → Her session başında Sonnet: 30min analysis (1000 tokens)
            → Sonra Haiku: 4.5 saat x 8 görev (400 tokens)
            
SAT-SUN:   — Light mode
            09:00: Haiku maintenance (3 görev)
            — Daily Opus review if needed
```

---

## 🧮 TOKEN BÜTÇESI (Haftalık)

### Allocation:
```
Haiku:      50 görev/hf × 75 token    = 3,750  (55%)
Sonnet:     10 analiz/hf × 800 token  = 8,000  (35%)
Opus:       2 stratejik/hf × 2500     = 5,000  (10%)
────────────────────────────────────────────────
TOPLAM:     68,750 tokens/hafta       = 100%
```

### Gerçek haftalık: 50% = 34,375 tokens max
```
PLAN:       34,375 tokens
Buffer:     17,188 tokens (+50% safety)
────────────────────────────────
Available:  ~35,000 tokens/hf
```

---

## 🚨 KURAL VE KONTROLLER

### Task-Worker Model Selection:
```bash
# KURAL:
if [ "$TASK_ID" == "T-074" ] || [ "$TASK_ID" == "T-055" ]; then
    MODEL="claude-opus-4-6"  # Ağır stratejik görevler
elif [ "$HOUR" == "09" ] && [ "$WEEKDAY" == "1" ]; then
    MODEL="claude-sonnet-4-6" # Pazartesi sabahı review
else
    MODEL="claude-haiku-4-5-20251001" # Default: Haiku
fi
```

### Token Monitoring:
```bash
# task-worker.sh sonunda:
echo "Tokens: ~$(estimate_tokens "$PROMPT")" >> "$LOG"
# Weekly summary: token usage tracking
```

---

## 🎯 BAŞARI ÖLÇÜTLERI

| Metrik | Target | Gerçek |
|--------|--------|--------|
| Haftanın %50'si Haiku | 55% | - |
| Session/hf Sonnet 1x | ✓ | - |
| Opus Pazartesi | ✓ | - |
| Token waste (<5%) | <1750 | - |
| Görev throughput | 50/hf | - |

---

## 📋 IMPLEMENTATION CHECKLIST

- [x] Token limits dokumentasyonu
- [x] task-worker.sh'ye model selector ekle
- [x] Cron job: Pazartesi 09:00 Opus trigger
- [x] Weekly token audit cron script
- [ ] Dashboard: Token usage widget
- [ ] Alert: Weekly limit %80'ine ulaşınca

---

**Yürürlük:** Çarşamba 21:00 (2026-04-07) itibaren
**Sorumluluk:** Alfred Automation System
**Review:** Her Pazartesi 09:00

