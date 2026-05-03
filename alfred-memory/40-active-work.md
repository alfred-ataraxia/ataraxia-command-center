# Active Work

**Son güncelleme:** 2026-05-02 · Alfred

> 📋 Sistem analizi (tüm ajanlar için): `memory/21-system-analysis.md`

---

## Şu Anki Durum

Sprint-06 CLOSED. **Sprint-07 aktif** (2026-04-27→2026-05-10).

- Alfred Hafıza Regresyonu: ✅ ÇÖZÜLDÜ (MiniMax HTTP + Kanonik Hafıza Entegrasyonu)
- Alfred XML tool-call hallucination: ✅ ÇÖZÜLDÜ — `cleanReply()` + "ASLA tool_call" system prompt (server.cjs + telegram_bot.py, commit 8ca2268)
- Dashboard HUD Redesign (S7-06): ✅ TAMAMLANDI — Territory Studio + Fathom aesthetic, Command Station layout, AlfredChat history, commit 8ca2268
- İkinci Beyin / Obsidian entegrasyonu: ✅ AKTİF (`/home/sefa/ikinci-beyin`)
- OpenViking hafıza pilotu: 🧪 AKTİF PİLOT (`127.0.0.1:1933`, local embedding `127.0.0.1:1934`; production context-engine değişmedi)
- Alfred/Codex sistem hizalaması: ✅ T-087 TAMAMLANDI — rapor/canlı tarama farkları işlendi
- OpenClaw performans karar paketi: ✅ T-088 TAMAMLANDI — `memory-core dreaming` yük analizi yazıldı; uygulama onay bekler
- OpenClaw config bootstrap optimizasyonu: ✅ UYGULANDI — `config file` artık doğrudan path yazıyor; `config validate` lite snapshot kullanıyor; `configure` ilk seçimden önce gateway probe beklemiyor. Ölçüm: `config file` 33.47s, `config validate` 20.34s.
- Alfred task-runner politikası: ✅ T-089 TAMAMLANDI — kapalı/manual varsayılan + LLM'siz watcher önerildi
- Telegram latency kapanış doğrulaması: 🔄 T-085 AKTİF — memory-core A/B başarısız, fast path/transport/lane wait odağına dönüldü
- Model routing doğrulaması: ✅ T-086 TAMAMLANDI — default + Alfred/MAIT/MERCER primary `opencode-go/kimi-k2.5`; gecikme ana nedeni routing değil
- Multi-AI workspace planı: 🧭 PLANLANDI — Claude Code ana yüzey, OpenClaw orkestrasyon, OpenCode Go çok-model havuz, Codex/Gemini uzman worker; plan `~/alfred-hub/command-center/docs/multi-ai-workspace-plan.md`
- ClauDEx migration: ✅ TAMAMLANDI — Eski claude-code-router kaldırıldı, ClauDEx v0.2.0 kuruldu (shell function override, 0MB RAM). Profiller: main (Anthropic), minimax (M2.7 ✅), openrouter (32 bedava model ✅), zai (GLM-4.7 ✅ rate-limit geçici). Abonelik araçları (Codex/Gemini/OpenCode) shell alias ile erişilebilir. Detay: `~/alfred-hub/command-center/docs/claude-code-single-console-plan.md`
- Cron/tool sandbox hatası: ✅ T-093 TAMAMLANDI — kök neden `agentTurn` cron + `exec host=sandbox`; config/cron değişmedi
- Cron LLM yük azaltma: ✅ T-094 TAMAMLANDI — `cron-failure-alert` geçici olarak disabled edildi (LLM yükü çok yüksek)
- Üst seviye proje durumu: `~/.openclaw/workspace/ALFRED_PROJECT_STATE.md`
- Sprint detayı: `~/alfred-hub/command-center/sprints/sprint-07.md`
- **Sistem Mükemmelleştirme Yol Haritası:** `~/alfred-hub/command-center/ROADMAP_PERFECTION.md` (Şu an **Modül 1** üzerinde çalışılıyor)

---

## Sprint-07 — AKTİF (2026-04-27 → 2026-05-10)

> Detaylar için → `~/alfred-hub/command-center/sprints/sprint-07.md`

| # | Görev | Durum |
|---|-------|-------|
| S7-01 | Claude Design — dashboard tasarım sistemi | ✅ DONE |
| S7-02 | Dashboard UI revizyonu | ✅ DONE |
| S7-03 | İkinci Beyin şablon seti (B-069) | ✅ DONE |
| S7-04 | YAML metadata standardizasyonu (B-070) | ✅ DONE |
| S7-05 | MOC sayfaları (B-068) | ✅ DONE |
| S7-06 | Dashboard bileşen tutarlılığı + HUD redesign | ✅ DONE |
| S7-07 | OpenViking Alfred hafıza pilotu (B-079) | 🧪 AKTİF PİLOT |
| S7-08 | DeFi eylem geçmişi — Autopilot log dashboard | ✅ DONE |
| S7-09 | Alfred sistem analizi ile canlı tarama hizalama (T-087) | ✅ DONE |
| S7-10 | OpenClaw performans karar paketi (T-088) | ✅ DONE |
| S7-11 | Alfred task-runner çalışma politikası (T-089) | ✅ DONE |
| S7-12 | Telegram latency kapanış doğrulaması (T-085) | ⚠️ PARÇALI — token mismatch + OOM çözüldü, stall devam |
| S7-16 | OpenClaw gateway stabilizasyonu | ✅ DONE — token/memory/timeout/service-file düzeltildi |
| S7-13 | OpenClaw cron/tool sandbox hatası analizi (T-093) | ✅ DONE |
| S7-14 | Cron LLM yük azaltma (T-094) | ✅ DONE (geçici: disabled) |
| S7-15 | Multi-AI workspace planı | 🧭 PLANLANDI |

---

## Sistem Durumu (2026-04-30)

| Bileşen | Durum | Not |
|---------|-------|-----|
| Dashboard (4173) | ✅ 200 | `/api/sprint` hızlı yanıt veriyor |
| DeFi APM (4180) | ✅ Dinliyor | `/health` endpoint'i yok; doğru API endpointleri ayrıca doğrulanmalı |
| Gateway (18789) | ✅ Stabilize | Token mismatch + OOM düzeltildi; MemoryMax=3G; cron disabled |
| Home Assistant (8123) | ✅ 200 | Docker, host network |
| Homepage (3000) | ✅ 200 | Docker |
| WireGuard | ✅ Up | Docker container, 51820/udp |
| Pi-hole + unbound | ✅ Running | systemd |
| Portainer (9443) | ✅ Up | Docker yönetim UI |
| Nginx Proxy Manager | ✅ Up | 80/443 |
| OpenClaw cron | ✅ Aktif | `ataraxia-task-runner.timer` disabled; OpenClaw cron tek scheduler |
| İkinci Beyin vault | ✅ Aktif | `vault-sync.sh` OpenClaw→Obsidian snapshot; `vault-inbox-to-openclaw.sh` Obsidian→shared-notes |
| OpenViking pilot | 🧪 Aktif local | Server `127.0.0.1:1933`, embedding `127.0.0.1:1934`, OpenClaw contextEngine değişmedi |
| RAM | ⚠️ Baskı altında | Swap ve I/O wait gözlendi; ağır ajanlar sırayla çalışmalı |
| Legacy Telegram bot | ✅ Görünmüyor | Ayrı `telegram_bot.py` süreci ve root `telegram-bot.service` aktif görünmüyor |

### 2026-04-30 Hizalama Bulguları

| Bulgu | Durum | Sıradaki iş |
|---|---|---|
| Plugin izolasyonu | browser/device-pair/phone-control/talk-voice kapalı; browser sidecar portu dinlemiyor | Mevcut durum korunur |
| `memory-core dreaming` | A/B test başarısız; backup ile geri alındı | Tek başına kök neden değil |
| `alfred-task-runner` | Cron job mevcut fakat `enabled:false`; geçmiş NO_TASK runları ortalama ~215 sn | T-089 politika tamamlandı |
| Model routing | Default ve Alfred/MAIT/MERCER primary `opencode-go/kimi-k2.5`; loglar bunu doğruluyor | T-086 done |
| Cron/tool sandbox | `cron-failure-alert` agentTurn içinde `host=sandbox` seçiyor; doğrudan script bug'ı değil | T-093 done; T-094 pending |
| OpenViking | Pilot sağlıklı; production `contextEngine` değişmedi | KPI izleme sürer |

---

## Dashboard — Mevcut Bileşenler

> Mimari, auth ve güvenlik detayları için → `31-dashboard-state.md`

| Sekme/Bileşen | İçerik |
|---|---|
| Overview | 2-kolon grid: Alfred durum, SprintStatus, Docker (sol); DailySummary (canlı BTC/ETH/SOL), Görevler, DeFi özet (sağ) |
| DeFi APM → DeFi APM sekmesi | Sistem özeti, alert, portföy, potansiyel havuzlar |
| DeFi APM → Top Pools sekmesi | Top APY / Potansiyel / Watchlist, tıklanabilir detay |
| DeFi APM → Autopilot sekmesi | Config + toggle, vault durumu, aksiyon geçmişi, onay butonu |
| DeFi APM → Autopilot geçmiş özeti | Son aksiyon zamanı, çalıştı/yapılmadı sayıları, reason dağılımı |

---

## Güvenlik Durumu

| İş | Durum |
|----|-------|
| Telegram bot token rotate | ✅ Tamamlandı (Sefa, BotFather) |
| scripts/.env token sync | ✅ Tamamlandı (evening-report fix) |
| Gemini OpenClaw token sync | ✅ Tamamlandı (CLI→auth-profiles kopyalandı) |
| `gateway.controlUi.allowInsecureAuth` | ✅ false (LAN-only kabul edildi) |

---

## Hafıza ve Obsidian Entegrasyonu

| Akış | Durum | Kaynak → Hedef |
|---|---|---|
| Kanonik hafıza | ✅ Aktif | `~/.openclaw/workspace/memory/` |
| OpenClaw → Obsidian | ✅ Aktif | `~/alfred-hub/scripts/vault-sync.sh` → `/home/sefa/ikinci-beyin` |
| Obsidian → OpenClaw | ✅ Aktif | `/home/sefa/ikinci-beyin/alfred/inbox/pending/*.md` → `memory/inbox/shared-notes.md` |
| Shared notes ingest | ✅ Aktif | `command-center/cron/shared-notes-ingest.sh` → vault |

Alfred bir şeyi “kaydet / hatırla / not et” denildiğinde önce `memory/inbox/shared-notes.md` kullanır. Kalıcı karar veya mimari bilgi ilgili kanonik memory dosyasına yazılır. Obsidian doğrudan tek kanonik kaynak değildir; görünür vault ve manuel ikinci beyin katmanıdır.

---

## Backlog Durumu

Kanonik liste: `~/alfred-hub/command-center/backlog.md`

| ID | Durum | Blokaj |
|---|---|---|
| B-020 | ✅ Tamamlandı | Live Execution onaylandı ve başlatıldı. |
| B-068→B-078 | ✅ Tamamlandı | Tüm İkinci Beyin iyileştirme işleri (11 adet) bitti. |
| B-079 | 🧪 Başladı | OpenViking Alfred hafıza pilotu; önce shadow/read-only test. |

`TASKS.json` anlık icra kuyruğudur. 2026-05-01 itibarıyla açık sıra: T-085 (Codex, in_progress), T-090 (Claude, pending). T-086, T-087, T-088, T-089, T-091, T-092, T-093, T-094 tamamlandı.

OpenViking pilot notları:
- Plan: `~/alfred-hub/command-center/docs/openviking-pilot.md`
- Import adayları: `/home/sefa/.openviking-alfred-pilot/imports/candidates.md`
- Test seti: `/home/sefa/.openviking-alfred-pilot/reports/t078-retrieval-testset.md`
- T-079 skor raporu: `/home/sefa/.openviking-alfred-pilot/reports/t079-retrieval-score.md`
- T-079 sonucu: strict `ov find` 7/10; production `contextEngine` için yeterli değil.
- T-080 sonucu: hybrid retrieval wrapper 10/10, P0 5/5; rapor `/home/sefa/.openviking-alfred-pilot/reports/t080-hybrid-retrieval-report.md`
- T-081 sonucu: Alfred memory adapter dry-run 10/10, P0 5/5; rapor `/home/sefa/.openviking-alfred-pilot/reports/t081-adapter-report.md`
- Adapter: `/home/sefa/.openviking-alfred-pilot/scripts/alfred-memory-query.sh`
- T-082 sonucu: Dashboard MemoryView içinde OpenViking pilot health + dry-run query paneli eklendi (`/api/openviking/health`, `/api/openviking/query`).
- T-084 sonucu: OpenViking KPI ölçüm hattı eklendi (`~/openclaw/logs/openviking-kpi.jsonl`, `/api/openviking/kpi`, MemoryView KPI kartı).
- 2026-04-29 performans tanısı: Telegram gecikmesinin ana nedeni tek model değil; `openclaw-gateway` yüksek CPU/RSS, restart sonrası çakışan cron missed-job koşuları, legacy `telegram_bot.py` systemd servisi ve shell cold-start maliyeti birlikte etkiliyor.
- Uygulanan hafifletmeler: OpenClaw cron dakikaları stagger edildi, stale `runningAtMs` marker'ları temizlendi, `.bashrc` nvm/completion lazy hale getirildi, `.bash_aliases` eski `/usr/bin/claude` yolundan PATH tabanlı komuta alındı, `discovery.mdns.mode=off` eklendi, OpenClaw skill symlink uyarısı için `huashu-design` gerçek klasör olarak kopyalandı.
- Kalan blokaj: `/etc/systemd/system/telegram-bot.service` dosyası pasif moda alındı ancak root `systemctl daemon-reload && disable --now` polkit onayı gerektiriyor.
- Model routing notu: T-086 doğrulamasına göre `agents.defaults` ve Alfred/MAIT/MERCER primary `opencode-go/kimi-k2.5`; `/models` UI seçiminin session-local override etkisi ayrı canlı test konusu olabilir.
- Not: endpointler ve UI kodu hazır; canlı panel etkisi için dashboard servisinin yeni kodla çalışıyor olması gerekir.
- Güvenlik: `config/ov.runtime.conf` secret içerdiği için import dışı ve `600`; config dizini `700`.

---

## Ajan Referansları

| Ajan | Workspace | Notlar |
|------|-----------|--------|
| MAIT | `~/mait-workspace/` | Ev işleri; cron job besliyor |
| Mercer | `~/mercer-workspace/` | E-posta tarama |
| alfred | `~/.openclaw/agents/alfred/` | Ana ajan |

---

## Çalışma İlkesi

- Bu dosyayı okuyan ajan: önce görev bul, yoksa sessizce dur.
- Yeni kararlar → `50-decisions.md` ve `inbox/shared-notes.md`
- Büyük değişiklik → bu dosyayı güncelle
