# Projects

## Genel Çerçeve

- Bu çalışma alanında proje, araç ve operasyon notları birlikte bulunuyor.
- Scrum kayıtları: `~/alfred-hub/command-center/sprints/` ve `backlog.md`

## alfred-hub

- Yol: `/home/sefa/alfred-hub`
- Üst repo; içinde `command-center` alt reposu var.
- Klasörlerde logs, reports, scripts içerikleri mevcut.
- `scripts/evening-report.sh` — her gece 23:00 Telegram raporu (token: scripts/.env)

## command-center

- Yol: `/home/sefa/alfred-hub/command-center`
- Ayrı git deposu
- Ana operasyon dosyaları: `TASKS.json`, `dashboard/`, `sprints/`, `backlog.md`

## Dashboard

- Yol: `/home/sefa/alfred-hub/command-center/dashboard`
- Stack: React 19 + Vite + Tailwind 4 + Node HTTP (server.cjs)
- Port: 4173, systemd servis (`ataraxia-dashboard.service`, system unit)
- Stack: React 19 + Vite + Tailwind 4 + Node HTTP (server.cjs)
- API endpoint'leri: `/api/sprint`, `/api/daily-summary` (CoinGecko canlı), `/api/defi/*` (proxy→4180)
- Sekmeler: Overview, Görevler, Ajanlar, Otomasyon, Onaylar, Hafıza, Logs, DeFi APM
- Scrum: `~/alfred-hub/command-center/sprints/` (aktif sprint dosyasına bak)

## DeFi APM

- Yol: `/home/sefa/defi-apm`
- Stack: TypeScript, SQLite, Express, DeFiLlama + Beefy API
- Port: 4180, systemd servis aktif
- **Faz 1 (Gözcü): AKTİF** — 111 havuz izleniyor, beefy_only, Base chain
- **Faz 2 (UI): TAMAMLANDI** — Top APY / Potansiyel / Watchlist sekmeleri, tıklanabilir detay
- **Faz 3 (Autopilot):** Dashboard paneli hazır (S6-01 ✅); on-chain execution için cüzdan setup gerekli (B-020)
- Autopilot durumu: `enabled=true`, `execute=false`, `simulateOnly=true`, `requireApproval=true`
- Portföy adresi: `0xe2ffa01227834f6dd46e798814c79beca4d3864f` (Base)
- Modüller: indexer, risk-engine, scoring, autopilot, alpha, portfolio, api, notifications

## OpenClaw

- Versiyon: 2026.4.11-beta.1
- Ajanlar: alfred (minimax-portal), mait (minimax-portal), mercer, main (codex)
- Cron: 17 job aktif, `ataraxia-task-runner.timer` disabled (OpenClaw cron tek scheduler)
- Telegram: @ataraxia_alfred_bot (token: ~/.openclaw/.env)

## OpenViking Pilot

- Yol: `/home/sefa/.openviking-alfred-pilot`
- Amaç: Alfred/OpenClaw için OpenViking'i production context-engine yapmadan önce kontrollü hafıza pilotu olarak denemek.
- Durum: local pilot aktif; OpenViking server `127.0.0.1:1933`, embedding server `127.0.0.1:1934`.
- Kapsam: `~/.openclaw/workspace/memory/` ve `/home/sefa/ikinci-beyin` içinden seçili read-only snapshot import; OpenClaw `contextEngine` slot'u ilk fazda değiştirilmez.
- Riskler: RPi 400 RAM baskısı, ek OpenViking HTTP servisi, Rust/C++ bağımlılıkları, plugin/API uyumsuzluğu ve memory semantic queue bug'ları.
- Başarı kriteri: Alfred'in kanonik hafıza + Obsidian notlarını daha doğru geri çağırması, token/context maliyetinin düşmesi, queue/log tarafında şişme olmaması.
- Plan: `~/alfred-hub/command-center/docs/openviking-pilot.md`
- Import/test dosyaları: `/home/sefa/.openviking-alfred-pilot/imports/candidates.md`, `/home/sefa/.openviking-alfred-pilot/reports/t078-retrieval-testset.md`

## Homepage

- Yol: `/home/sefa/homepage`
- Docker, port 3000
- Alfred Dashboard + DeFi APM widget eklenmiş (B-007 ✅)

## remotion-test

- Yol: `/home/sefa/remotion-test/`
- Remotion video üretim altyapısı (kurulu, hazır)
- Olası kullanım: sistem raporu videoları, haftalık özet

## ikinci-beyin

- Yol: `/home/sefa/ikinci-beyin`
- Obsidian vault / ikinci beyin kasası aktif entegredir.
- OpenClaw → Obsidian sync: `~/alfred-hub/scripts/vault-sync.sh`
  - Günlük not, sistem durumu, sprint snapshot, kanonik hafıza snapshot, shared-notes ingest ve GitHub push üretir.
  - Günlük cron: `vault-sync-daily` (`~/.openclaw/cron/jobs.json`)
  - Haftalık cron: `vault-sync-weekly` + `alfred-weekly-summary`
- Obsidian → OpenClaw inbox köprüsü: `~/alfred-hub/command-center/cron/vault-inbox-to-openclaw.sh`
  - Kaynak: `/home/sefa/ikinci-beyin/alfred/inbox/pending/*.md`
  - Hedef: `~/.openclaw/workspace/memory/inbox/shared-notes.md`
- Kanonik gerçeklik hâlâ `~/.openclaw/workspace/memory/` tarafındadır; Obsidian snapshot, görünür ikinci beyin ve manuel not yüzeyidir.
