# Sistem Analizi — Ataraxia

**Tarih:** 2026-04-30 · Alfred  
**Kapsam:** Tüm sistemin derinlemesine analizi — mimari, zayıflıklar, büyüme vektörleri  
**Okuyucular:** Alfred, Claude, Codex, Gemini, MAIT, MERCER

---

## 1. Mimari Genel Görünüm

```
┌─────────────────────────────────────────────────────────────┐
│  PRESENTATION LAYER                                         │
│  ├── Dashboard (React/Vite/Tailwind, port 4173)             │
│  ├── Telegram Bot (@ataraxia_alfred_bot)                    │
│  └── Obsidian Vault (/home/sefa/ikinci-beyin)               │
├─────────────────────────────────────────────────────────────┤
│  ORCHESTRATION LAYER                                        │
│  ├── OpenClaw Gateway (Node.js, v2026.4.11-beta.1)          │
│  ├── Cron Jobs (22 aktif job)                               │
│  ├── TASKS.json (merkezi görev kuyruğu)                     │
│  └── Ajan Ağı: Alfred, Claude, Codex, Gemini, MAIT, Mercer  │
├─────────────────────────────────────────────────────────────┤
│  DOMAIN SERVICES                                            │
│  ├── DeFi APM (TypeScript/SQLite/Viem, port 4180)           │
│  │   └── Faz 1: Gözlemci ✅, Faz 2: UI ✅, Faz 3: Autopilot 🔒 │
│  ├── Homepage (Docker, port 3000)                           │
│  ├── Home Assistant (Docker, port 8123)                     │
│  └── Pi-hole + unbound (DNS, port 53)                       │
├─────────────────────────────────────────────────────────────┤
│  MEMORY LAYER                                               │
│  ├── Kanonik Hafıza (~/.openclaw/workspace/memory/)         │
│  ├── OpenViking Pilot (semantic retrieval, 127.0.0.1:1933)  │
│  ├── Vault Sync (OpenClaw ↔ Obsidian, iki yönlü)           │
│  └── Shared Notes (inbox/shared-notes.md)                   │
├─────────────────────────────────────────────────────────────┤
│  INFRASTRUCTURE                                             │
│  ├── ataraxia (RPi 400, 4GB RAM, Debian Trixie, arm64)       │
│  ├── Docker containers (6 servis)                           │
│  └── systemd services (user-level)                          │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Donanım ve Kaynak Kullanımı (2026-04-30)

| Kaynak | Kullanım | Not |
|--------|----------|-----|
| RAM | 1.9GB/3.7GB可用 + 1.5GB swap | Gateway %14, DeFi APM %3.7, HA %2.7 |
| CPU Load | 1.18 (1dk) | Gateway %30, stable |
| Disk | 42GB/231GB (%19) | Yeterli |
| Swap | 1.5GB/4GB kullanımda | RAM baskısı var |

**En çok kaynak tüketen süreçler:**
- openclaw-gateway: 559MB (%14 RAM)
- DeFi APM (tsx): 146MB (%3.7)
- Home Assistant: 106MB (%2.7)
- Claude Code (ccd-cli): 44MB (%1.1)
- Dashboard (server.cjs): 60MB (%1.5)
- OpenViking server: ~3MB

**Önemli:** Gateway haftalık restart (Salı 04:30) konmuş ama bu kaçınılmaz bir çare, çözüm değil.

---

## 3. Ajan Ekosistemi

| Ajan | Emoji | Model | Rol | Workspace |
|------|-------|-------|-----|-----------|
| Alfred | 🦊 | kimi-k2.5 | Orkestratör, Telegram, 7/24 | `~/.openclaw/workspace` |
| MAIT | 🏠 | minimax-m2.7 | Ev işleri yöneticisi | `~/.openclaw/agents/mait` |
| MERCER | 💰 | minimax-m2.7 | Finansal denetçi, CFO danışmanı | `~/.openclaw/agents/mercer` |
| Claude | — | claude-sonnet | Mimari, kod, analiz (on-demand) | `~/.claude` |
| Codex | — | gpt-5.4 | Kod yazma, refactor (on-demand) | `~/.codex` |
| Gemini | — | gemini-2.5-pro | Araştırma, rapor (on-demand) | `~/.gemini` |

**Model routing:** Primary kimi-k2.5, fallback sırası: minimax-m2.7 → minimax-m2.5 → mimo-v2-pro → glm-5.1

**Her ajanın bağımsız:** SOUL.md, HEARTBEAT.md, TOOLS.md, memory katmanı, workspace dizini

---

## 4. Cron Job Haritası (22 aktif)

```
00:00  shared-notes-rotate (Pazartesi)
02:00  alfred-backup
02:30  memory-architect-archive (Pazar)
03:00  memory-dreaming-promotion
04:00  session-retention-cleanup
04:30  openclaw-gateway-restart (Salı)
07:30  morning-briefing (hafta içi, script→Telegram, delivery=none)
09:00  radar-weekly (Çarşamba)
12:00  morning-briefing-weekend (hafta sonu, delivery=none)
15:xx  alfred-task-runner (:/02, :/32, şu an disabled)
16:00  mait-weekly-review (Cuma)
18:00  mait-weekly-query (Pazar)
20:00  mercer-wallet-check
21:00  alfred-weekly-summary (Pazar, delivery=announce)
21:30  mait-daily-query
22:00  vault-sync-weekly (Pazar)
22:52  cron-failure-alert (:/22, :/52)
23:00  evening-report (script→Telegram, delivery=none)
23:15  vault-sync-daily
06:xx  token-audit (6 saatte bir)
```

**Not:** morning-briefing, evening-report, morning-briefing-weekend → `delivery.mode=none` (script kendi Telegram'ına gönderiyor, Alfred tekrar bildirmiyor).

---

## 5. Hafıza Katmanları

```
         ┌─────────────────────┐
         │   UZUN VADELİ       │  Kanonik memory (00-canonical-profile, 10-operating-rules,
         │   Kararlar, kimlik  │  30-projects, 40-active-work, 50-decisions)
         ├─────────────────────┤
         │   GÜNLÜK            │  memory/YYYY-MM-DD.md, shared-notes.md
         │   Bugünün işleri    │  Vault sync (günlük 23:15 + haftalık Pazar 22:00)
         ├─────────────────────┤
         │   SEMANTIC          │  OpenViking (127.0.0.1:1933/1934)
         │   Hybrid retrieval  │  10/10 skor, confidence-gated fallback
         ├─────────────────────┤
         │   DREAM              │  openclaw memory-core
         │   Kısa vad→uzun vad  │  (03:00 promotion, minScore 0.8, minRecallCount 3)
         └─────────────────────┘
```

**OpenViking pilot sonuçları:**
- Strict retrieval: 7/10 → hybrid çözüm ile 10/10
- Adapter dry-run: 10/10, P0 5/5
- Production `contextEngine`'ine henüz bağlı değil — güvenlik önlemi olarak doğru karar

---

## 6. Dashboard Mimarisi

- **Stack:** React 19 + Vite + Tailwind 4 + Node HTTP (Express yok!)
- **Port:** 4173, systemd servis (`ataraxia-dashboard.service`, system unit)
- **31 component dosyası:** Overview, TaskQueue (23KB), DeFiView (69KB), OrchestrationView, MemoryView, ApprovalsView...
- **API endpoint'leri:** /api/sprint, /api/daily-summary, /api/defi/*, /api/openviking/*, /api/tokens, /api/approvals, /api/feedback
- **Renk paleti:** Warm Obsidian (Territory Studio + Fathom aesthetic)

---

## 7. DeFi APM Mimarisi

- **Stack:** TypeScript, SQLite (better-sqlite3), Express, Viem, Zod, Vitest
- **Port:** 4180, systemd servis
- **15 modül:** ai-engine, alpha, api, autopilot, chain, indexer, notifications, openclaw, portfolio, pricing, risk-engine, scoring, tx-builder
- **Autopilot modülü:** approve.ts, discover.ts, executor.ts, killswitch.ts, prelight.ts, privateKey.ts, strategy.ts — tam on-chain execution altyapısı
- **Risk kuralları:** APY > %500 → şüphe flag'i, TVL < $500K → izleme dışı
- **Faz durumu:** Faz 1 ✅, Faz 2 ✅, Faz 3 🔒 (cüzdan/private key + private RPC + funding kararı bekliyor)

---

## 8. Güvenlik ve Guardrail

- **Güvenlik anayasası:** SOUL.md ve 10-operating-rules.md'de kazınmış
- **Yıkıcı komut onayı:** `rm -rf`, `chmod 777` vb. → önce onay al
- **Erişim yasağı:** SSH anahtarları, bankacılık, DeFi cüzdanları, şifre yöneticisi
- **Bütçe:** $5/gün soft limit, $100/ay hedef, görev başı $1
- **3 deneme kuralı:** 3 başarısız deneme → dur ve raporla
- **Onay mekanizması:** Dashboard ApprovalsView — finansal işlem ve yıkıcı komutlar için

---

## 9. Kritik Sorunlar ve Riskler

### 🔴 Kritik

| # | Sorun | Etki | Çözüm Önerisi |
|---|-------|------|---------------|
| B-080 | DeFi APM LIVE MODE çelişkisi | .env'de execute=true ama memory'de simulateOnly=true | Sefa kararı gerekiyor |
| B-081 | BudgetBakers token 2026-05-29'da dolacak | Wallet-check durur | Otomasyon veya manuel yenileme |
| B-082 | MERCER gerçek ajan olarak çalışmıyor | Tüm mercer job'ları alfred üzerinden shell script | Mercer'a ayrı context ve heartbeat verilmeli |
| — | Gateway RAM baskısı (%14) | 1.5GB swap kullanımı | Model routing hafifletme veya daha agresif restart |
| — | Tek nokta arıza: ataraxia | RPi 400 failure = tam kesinti | Offsite backup mevcut ama HA yok |

### 🟡 Orta

| # | Sorun | Detay |
|---|-------|-------|
| B-083 | 20-system-landscape.md eskimiş | 13 cron diyor, şimdi 22 |
| B-084 | Orphan cron scriptleri | hour-report, cost-check, monday-review, inbox-rotate |
| — | Home Assistant otomasyonları "unavailable" | 14 YAML otomasyon tetiklenmemiş, cihaz entegrasyonu eksik |
| — | Radar modülü tek yönlü | Sadece arama yapıyor, vault'a yazmıyor |
| — | Memory architect sadece archive | Compaction ve sentez mantığı eksik |

---

## 10. Büyüme Vektörleri

### Kısa Vadeli (1-2 hafta)
- MERCER gerçek context ile çalışsın (B-082)
- Dashboard'a BudgetBakers widget (B-089)
- OpenViking production'a taşınsın (pilot başarılı)
- Gateway memory sorununu çöz (T-085, T-086)

### Orta Vadeli (1-2 ay)
- DeFi Faz 3 canlıya çıksın — cüzdan setup sonrası
- Google Calendar entegrasyonu — gog CLI OAuth
- Home Assistant otomasyonlarını aktifleştir
- MAIT ev sensörlerine bağlansın

### Uzun Vadeli (3-6 ay)
- SoftTech AI pilot — kurumsal AI stratejisi
- Enterprise AI araç değerlendirme — iş kariyeriyle köprü
- RPi'den VPS'e göç — 4GB RAM scale gerekiyor (~$5-10/ay)
- Çok-ajan koordinasyon protokolü — gerçek zamanlı mesajlaşma ve handoff

---

## 11. Temel Desenler

1. **Hub-and-Spoke:** TASKS.json merkezli, Alfred orkestratör, ajanlar spoke
2. **Memory-First:** Markdown tabanlı kanonik hafıza, diff edilebilir, git ile takip edilebilir
3. **Guardrail-Driven:** Güvenlik anayasası ajan kişiliklerine kazınmış
4. **Progressive Automation:** Gözlemle → UI ile göster → Otonom çalıştır (kademeli)
5. **Sefa Karar Verir, Alfred Uygular:** Finansal işlem, satın alma, yıkıcı komutlar için onay mekanizması

---

## 12. MERCER Özel Durumu

MERCER şu an gerçek ajan context'i ile çalışmıyor. Tüm mercer job'ları alfred üzerinden shell script çalıştırıyor:
- `wallet-check.sh` — BudgetBakers Wallet günlük kontrol (her gün 20:00)
- `check_email.sh` — Email kontrol (şu an devre dışı)

**MERCER araçları (mcporter üzerinden):**
- BudgetBakers Wallet MCP: 10 aktif hesap, işlem geçmişi, kategori analizi
- Token yenileme: 2026-05-29'da dolacak

**Öneri:** Mercer'a kendi SOUL.md'sine göre gerçek OpenClaw ajan oturumları verilmeli.

---

## 13. Servis ve Port Haritası

| Servis | Port | Tip | Durum |
|--------|------|-----|-------|
| OpenClaw Gateway | 18789 | Node.js | ✅ Running |
| Dashboard | 4173 | Node.js HTTP | ✅ Running (systemd) |
| DeFi APM | 4180 | Express | ✅ Running (systemd) |
| Home Assistant | 8123 | Docker | ✅ Running |
| Homepage | 3000 | Docker | ✅ Running |
| Nginx Proxy Manager | 80/443/81 | Docker | ✅ Running |
| Portainer | 8000/9443 | Docker | ✅ Running |
| Pi-hole | 53/8080 | systemd | ✅ Running |
| WireGuard | 51820/udp | Docker | ✅ Running |
| OpenViking server | 1933 | Python | ✅ Pilot |
| OpenViking embed | 1934 | Python | ✅ Pilot |
| DuckDNS | — | Docker | ✅ Running |

---

*Bu dosya tüm ajanların okuyabileceği şekilde kanonik hafızada tutulur. Güncelleme: 40-active-work.md veya bu dosya üzerinden.*