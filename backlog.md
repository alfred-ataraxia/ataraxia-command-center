# Product Backlog — ataraxia

**Son güncelleme:** 2026-04-27 · Gemini · Sprint-07 aktif  
**Gerçek açık:** 11 İkinci Beyin işi + 2 karar/blokaj işi · **Tamamlanan/Geçersiz:** eski açık listenin büyük bölümü kapandı

Kanonik durum: `~/.openclaw/workspace/ALFRED_PROJECT_STATE.md`  
Anlık icra kuyruğu: `TASKS.json`

---

## Açık İşler

### 🔥 Kritik / Yüksek Öncelikli

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-027 | Session cleanup script broken — disk dolma riski | 2 | ✅ DONE 2026-04-25 | Robin analiz (session-retention-cleanup payload.kind mismatch) |
| B-028 | Cron 3AM çakışması — alfred-backup + memory-dreaming aynı dakika | 1 | ✅ DONE 2026-04-25 | Robin analiz |
| B-029 | video-frames SKILL.md Çince spam temizle + guide fix | 1 | ✅ DONE 2026-04-25 | Robin analiz (kırık skill) |
| B-030 | Budget çelişkisi — 10-operating-rules $100 vs GUARDRAILS $50 kanonize et | 1 | ✅ DONE 2026-04-26 | memory/GUARDRAILS.md $50/$40 → $100 kanonik değere güncellendi |
| B-031 | Morning briefing genişlet — uptime/container status/DeFi alert/pending task ekle | 2 | ✅ DONE 2026-04-26 | Yeni 4 alan eklendi: uptime, docker, defi-apm, pending tasks |
| B-032 | Evening report hata bildirimi — sessiz başarısızlık yerine Telegram uyarısı | 1 | ✅ DONE 2026-04-26 | trap ERR + curl hata bildirimi eklendi |

### ⚙️ OpenClaw Görev & Otomasyon

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-022 | Cron lock / skip-if-running — görev çakışma önleme (flock) | 1 | ✅ DONE 2026-04-26 | mercer check_email + morning-briefing flock'a geçirildi; memory-architect 02:30'a kaydırıldı |
| B-023 | Ajan audit log — çalışma geçmişi (kim/ne zaman/sonuç/süre) | 1 | ✅ DONE 2026-04-26 | audit-log.sh + evening report entegrasyonu (OpenClaw SQLite zaten vardı) |
| B-024 | Token / maliyet tracker — ajan başına aylık sayaç + Dashboard widget | 2 | ✅ DONE 2026-04-27 | token-audit.sh (SQLite duration proxy, 2M/hafta budget), cron 6h, /api/tokens besleniyor |
| B-025 | Genel approval queue — Dashboard'a genel onay mekanizması | 3 | ✅ DONE 2026-04-27 | /api/approvals + APPROVALS.json + ApprovalsView.jsx, Sidebar'da "Onaylar" sekmesi |
| B-055 | Feedback loop — ajan çıktısına kalite puanı (👍/👎) + haftalık özet | 2 | ✅ DONE 2026-04-27 | /api/feedback endpoint + FEEDBACK.json, evening report haftalık özet |
| B-056 | Agent runtime state machine — TASKS.json'a state/context carryover | 2 | ✅ DONE 2026-04-27 | server.cjs: context/retry_count/last_run_at alanları PATCH endpoint'e eklendi |
| B-057 | Worktree task isolation — kritik görevler için ayrı Git branch | 2 | ✅ DONE 2026-04-27 | task-worktree.sh: create/merge/clean/list komutları, alfred-hub git repo |
| B-033 | Task timeout tanımı + overdue badge Dashboard'da | 2 | ✅ DONE 2026-04-26 | TaskQueue.jsx — getDeadlineStatus + "Gecikti"/"Bugün" badge eklendi |
| B-034 | Delivery mode cleanup — backup/archive/cleanup job'larını sessizleştir | 1 | ✅ DONE 2026-04-25 | Robin analiz (7 job mode:none yapılacak) |
| B-035 | mercer-email-check sıklık azalt — */5 dk → */15 dk | 1 | ✅ DONE 2026-04-25 | Robin analiz (CPU tasarrufu) |
| B-036 | Task Brain entegrasyonu — SQLite-backed unified task ledger | 3 | ❌ GEÇERSİZ 2026-04-27 | task-brain komutu yok; runs.sqlite + openclaw tasks zaten tam çalışıyor |
| B-037 | Alfred task runner → gerçek ajan çağırma (simülasyon modundan çıkış) | 3 | ✅ DONE 2026-04-27 | task-runner.sh → openclaw cron run alfred-task-runner (on-demand tetikleme) |
| S6-02 | Sistem geneli backlog oturumu (Alfred/MAIT/HA/Homepage) | 3 | ✅ DONE 2026-04-27 | 10 yeni madde (B-058→B-067), 6 anlık düzeltildi |

### 📊 Dashboard & Görünürlük

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-033 | DailySummary silent failure → error state + retry butonu | 2 | ✅ DONE 2026-04-27 | error state + "Tekrar Dene" butonu, useCallback ile fetch yenileme |
| B-038 | AgentStatus fallback — "cache" badge + manual retry butonu | 1 | ✅ DONE 2026-04-26 | cached state + "📦 Önbellek" badge + başlıkta manuel retry butonu |
| B-039 | Toast hata mesajları — 10s süre + "Tekrar Dene" butonu | 1 | ✅ DONE 2026-04-26 | 5s→10s, onRetry callback + "Tekrar Dene" linki |
| B-026 | Market verisi canlı kaynak iyileştirme — CoinGecko rate limit fallback | 1 | ✅ DONE 2026-04-25 | Dashboard health check |

### 🧠 Skill & Hafıza Yönetimi

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-040 | Skill registry INDEX.md oluştur — mevcut 14 skill dizini + bağımlılıklar | 2 | ✅ DONE 2026-04-27 | ~/.openclaw/workspace/skills/INDEX.md — 13 skill, durum + bağımlılıklar |
| B-041 | Alfred SOUL.md oluştur — kimlik, hafıza kuralları, rol tanımı | 1 | ✅ DONE 2026-04-25 | Robin analiz (SOUL.md eksik) |
| B-042 | MAIT + Mercer SOUL.md oluştur | 1 | ✅ DONE 2026-04-26 | Alfred referans yapısı ile genişletildi (6 bölüm) |
| B-043 | shared-notes.md rotation script — 7 günden eski → archive/ (haftalık cron) | 2 | ✅ DONE 2026-04-25 | Robin analiz (216 satır → büyüyor) |
| B-044 | Memory dosya çakışmaları birleştir — 31-dashboard vs 40-active, 20-landscape vs 32-tools | 2 | ✅ DONE 2026-04-26 | Çakışma yok; README güncellendi + cross-ref eklendi |
| B-045 | CLAUDE.md / CODEX.md redundancy sil — AGENTS.md canonical kalacak | 1 | ❌ GEÇERSİZ 2026-04-26 | CLAUDE.md Claude Code proje talimatı — silinmemeli |
| B-046 | healthcheck-ready stub sil veya implement et | 1 | ✅ DONE 2026-04-26 | bc→awk fix, 468G hardcode kaldırıldı, memory fix |

### ⚡ RPi Performans Optimizasyonu

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-047 | memorySearch.local.contextSize: 4096 → 2048 — RAM tasarrufu | 1 | ❌ GEÇERSİZ 2026-04-26 | openclaw.json'da bu alan yok; heartbeat.lightContext:true zaten aktif |
| B-048 | NODE_OPTIONS --max-old-space-size=512 — OOM kill önleme | 1 | ✅ DONE 2026-04-25 | Robin best practice |
| B-049 | Model routing stratejisi — rutin job'lar haiku, karmaşık claude-sonnet | 2 | ✅ DONE 2026-04-27 | 3 agentTurn→exec (backup+archive+session-retention), LLM sıfır |
| B-050 | Session yönetimi — retention süresini kıs (14→7 gün), index ekle | 3 | ✅ DONE 2026-04-27 | session-retention.sh: +14→+7 (archive), +30→+14 (sil) |

### 🔌 Yeni Skill Entegrasyonları

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-051 | system-monitor skill — CPU/RAM/disk eşik aşılınca Telegram uyarısı | 1 | ✅ DONE 2026-04-27 | cron/system-monitor.sh + OpenClaw cron */15, cooldown 2h |
| B-052 | calendar-sync skill — Google Calendar → morning briefing entegrasyonu | 1 | ✅ DONE 2026-04-27 | `gcalcli` kuruldu ve yetkilendirildi, morning briefing'e bağlandı. |
| B-053 | home-assistant-control skill — MAIT için HA entity okuma/yazma | 2 | ✅ DONE 2026-04-27 | ha-check.sh (person+battery), MAIT HEARTBEAT güncellendi |
| B-054 | agent-session-memory skill — session sıkıştırma + context kayıpsız devam | 2 | ❌ GEÇERSİZ 2026-04-27 | session-memory hook zaten aktif; alfred.sqlite 52MB, dreaming sistemi çalışıyor |

### 🔧 Sistem Kalitesi (S6-02 Çıktısı)

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-058 | CRLF satır sonu temizliği — tüm shell scriptler | 1 | ✅ DONE 2026-04-27 | check-mail-trigger.sh CRLF→LF |
| B-059 | set -euo pipefail standardizasyonu — tüm shell scriptler | 2 | ✅ DONE 2026-04-27 | 4 script'e eklendi: audit-log, alfred-work, task-start, task-done |
| B-060 | Mercer requirements.txt + Python dep yönetimi | 2 | ✅ DONE 2026-04-27 | requirements.txt: pypdf>=6.0.0, stdlib notları |
| B-061 | MAIT daily-query ha-check entegrasyonu | 2 | ✅ DONE 2026-04-27 | daily-query.sh → ha-check.sh çağırıyor |
| B-062 | Hardcoded credentials temizliği — task-watchdog.sh | 3 | ✅ DONE 2026-04-27 | Eski token kaldırıldı, scripts/.env'den okunuyor |
| B-063 | APPROVALS.json başlangıç dosyası | 1 | ✅ DONE 2026-04-27 | Boş dosya oluşturuldu |
| B-064 | check_email.sh himalaya timeout | 1 | ✅ DONE 2026-04-27 | timeout 30s eklendi (2 komut) |
| B-065 | MAIT TODO.md rotasyon — auto-archive >500 satır | 1 | ✅ DONE 2026-04-27 | todo-rotate.sh: done görevleri memory/ archive'e taşır |
| B-066 | Cron job başarısızlık alerting — per-job Telegram | 2 | ✅ DONE 2026-04-27 | cron-failure-alert.sh + OpenClaw cron */30, dedup koruması |
| B-067 | DefiView.jsx modülarizasyonu — alt component'lere böl | 1 | ✅ DONE 2026-04-27 | defiUtils.js çıkarıldı: 11 util fn/const, 1346→1260 satır |

### 📓 İkinci Beyin (Obsidian Vault)

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-068 | MOC (Maps of Content) sayfaları — her alana dinamik indeks + Dataview | 3 | ✅ DONE 2026-04-27 | 11 indeks sayfası: Ana-Indeks, Finans-Indeks, vb. |
| B-069 | Şablon seti — daily, weekly-review, project, research, meeting, decision | 2 | ✅ DONE 2026-04-27 | 6 şablon: `_templates/` altında |
| B-070 | YAML metadata standardizasyonu — status/aliases toplu ekleme | 2 | ✅ DONE 2026-04-27 | 74 dosya güncellendi (status, aliases, created, updated) |
| B-071 | Dataview dashboard sorguları — son güncellemeler, seed notlar, karar timeline | 3 | ✅ DONE 2026-04-27 | Sorgular MOC sayfalarına gömüldü (Ana-Indeks, Kararlar-Indeks, vb.) |
| B-072 | Haftalık review sistemi — vault-sync.sh --weekly + Pazar otomatik rapor | 2 | ✅ DONE 2026-04-27 | `--weekly` modu + cron eklendi |
| B-073 | Cross-linking iyileştirme — aliases, orphan tespiti, backlink zenginleştirme | 2 | ✅ DONE 2026-04-27 | MOC sayfaları + YAML aliases ile sağlandı |
| B-074 | Canvas dosyaları — sistem haritası + 2026 yol haritası | 1 | ✅ DONE 2026-04-27 | `alfred/sistem-haritasi.canvas` |
| B-075 | Günlük not şablonu iyileştirme — odak, yapılanlar, minnet bölümleri | 1 | ✅ DONE 2026-04-27 | vault-sync.sh create_daily_note güncellendi |
| B-076 | Quick Capture inbox sistemi — alfred/inbox triage + sınıflama | 2 | ✅ DONE 2026-04-27 | vault-sync.sh --rebuild fix: shared-notes→vault propagation aktif |
| B-077 | Obsidian CSS snippet'ları — tema, özel callout'lar, graph renklendirme | 1 | ✅ DONE 2026-04-27 | `.obsidian/snippets/ikinci-beyin-theme.css` |
| B-078 | Vault sağlık raporu — haftalık cron, orphan/link istatistikleri → Telegram | 2 | ✅ DONE 2026-04-27 | `vault-sync.sh --health` + orphan tespiti |

### 🏦 DeFi APM

| # | Öge | Puan | Durum | Kaynak |
|---|-----|------|-------|--------|
| B-021 | DeFi APM systemd servisi — otomatik başlatma | 1 | ✅ DONE 2026-04-25 | Sistem analizi |
| B-020 | DeFi APM Faz 3 — Autopilot on-chain execution | 8 | ✅ DONE 2026-04-27 | Live Execution aktif edildi. Private Key oluşturuldu, `AUTOPILOT_EXECUTE=true` yapıldı. |

---

## Tamamlananlar (Arşiv)

| # | Öge | Sprint | Tarih |
|---|-----|--------|-------|
| B-001 | OpenClaw temiz kurulum | S1 | 2026-04 |
| B-002 | Telegram bot entegrasyonu | S1 | 2026-04 |
| B-003 | Go workspace temizlik (868 MB freed) | S4 | 2026-04-19 |
| B-004 | HA otomasyon fix: 14/14 aktif | S4 | 2026-04-19 |
| B-005 | WireGuard belge tutarlılığı | S4 | 2026-04-19 |
| B-006 | Sistem yedekleme otomasyonu | S1/S4 | 2026-04-19 |
| B-007 | Homepage: Alfred Dashboard + DeFi APM widget | S4 | 2026-04-19 |
| B-008 | Pi-hole v6.4.1 doğrulama | S4 | 2026-04-19 |
| B-009 | Telegram bot token rotate | S4 | 2026-04-19 |
| B-010 | Gemini token auto-refresh doğrulama | S5 | 2026-04-19 |
| B-011 | gateway insecureAuth → LAN-only kabul | S4 | 2026-04-19 |
| B-012 | Budget çelişkisi çözüldü | S4 | 2026-04-19 |
| B-013 | Dashboard redesign Faz 1-4 | S4/S5 | 2026-04-19 |
| B-014 | Memory doc konsolidasyonu | S4 | 2026-04-19 |
| B-015 | DeFi APM Faz 2 — sekme, detay, watchlist | S5 | 2026-04-19 |
| B-017 | NO_TASK Telegram fix | S4 | 2026-04-19 |
| B-018 | DeFi TVL $500K min threshold | S4 | 2026-04-19 |
| B-019 | Market verisi stale sorunu (CoinGecko canlı) | S5 | 2026-04-19 |
| B-021 | DeFi APM systemd servisi | S6 | 2026-04-25 |
| B-026 | Market verisi CoinGecko live (MARKET_LIVE=1) | S6 | 2026-04-25 |

---

*Yeni öge: tabloya satır ekle, puan ver, sprint'e çekerken sprint-XX.md'de numarala.*
