# AI Tooling And Routing

## Aktif Araçlar

- **OpenClaw** — Ana otomasyon motoru, Alfred task-runner, Telegram entegrasyonu. Gateway: localhost:18789
- **Claude Code** — İnteraktif geliştirme, dosya düzenleme, mimari kararlar
- **Codex CLI** — Kod yazma, refactor, schema ve test odaklı ikinci geliştirme yüzeyi
- **Gemini CLI** — Araştırma, rapor (Robin rolü). `/usr/bin/gemini`, OAuth: `~/.gemini/oauth_creds.json`
- **OpenCode Go** — Çok-model coding havuzu; OpenClaw tarafında `opencode-go` provider olarak kullanılır

## Alfred (OpenClaw Agent)

- Model: `opencode-go/kimi-k2.5` primary; MiniMax/OpenCode Go fallbacks
- Cron: Her 30 dakikada TASKS.json kontrol eder (`~/.openclaw/cron/jobs.json`)
- Sonuçlar Telegram'a iletilir: @blocksefa (ID: 963702150)
- Run geçmişi: `~/.openclaw/cron/runs/alfred-task-runner.jsonl`

## 2026-05-01 Multi-AI Workspace Kararı

- Amaç tüm ücretli ve ücretsiz AI imkanlarını aynı proje dosyaları, `TASKS.json` ve kanonik memory etrafında kullanmak.
- Claude Code ana interaktif çalışma yüzeyi olacak; OpenClaw/Alfred orkestrasyon, Telegram, dashboard ve hafıza otoritesi olarak kalacak.
- OpenCode Go çok-model kodlama havuzu olarak değerlendirilecek; Gemini CLI araştırma/rapor, Codex kod/refactor yüzeyi olarak kullanılacak.
- Ücretsiz providerlar düşük riskli araştırma/özet/fikir işleri için kataloglanacak; private repo, secret, finansal veri ve kritik kod değişikliklerinde default olmayacak.
- Plan: `~/alfred-hub/command-center/docs/multi-ai-workspace-plan.md`

### 2026-05-02 ClauDEx Migration

- **Eski:** claude-code-router (musistudio) → HTTP proxy, +100-200MB RAM, process gerekiyordu
- **Yeni:** ClauDEx (sasdsamatt123) → Shell function override, 0MB ek RAM, proxy yok
- **Neden:** RPi 400'de RAM kısıtlı; router ayrı process olarak RAM baskısı yaratıyordu
- **Kurulum:** v0.2.0, `~/.claudex/` altında profiller
- **Aktif profiller:** `main` (Anthropic native ✅), `minimax` (MiniMax M2.7 ✅ 2894ms), `openrouter` (32 bedava model ✅ minimax-m2.5:free doğrulandı), `zai` (GLM-4.7-Flash ✅ geçici rate-limit)
- **Abonelik araçları (ClauDEx dışı):** Codex CLI, Gemini CLI, OpenCode Go — shell alias ile erişilebilir
- **Yedek:** Router config → `~/backups/claudex-migration-20260501/`
- **Eski wrapper'lar kaldırıldı:** `claude-all`, `claude-free`, `claude-router-status`, `claude-router-model`
- **Yeni komutlar:** `claude-main` (native Pro), `claude-minimax` / `minimax` (MiniMax M2.7), `claude-openrouter` / `openrouter` (32 bedava model), `claude-zai` / `zai` (GLM-4.7)
- **bashrc güncellendi:** aliases.sh early return'den önce, .profile'a da eklendi
- **Wrapper script'ler:** ~/.local/bin/ altında 4 adet (alias bağımlılığı yok, direkt çalıştırılabilir)
- **Key'ler:** Z.ai (fd88...), OpenRouter (sk-or-v1-1adb...), MiniMax (.openclaw/.env), Gemini (.openclaw/.env)
- **Eski router process kapatıldı** (PID 949589), npm paketi hâlâ yüklü (geri dönüş için)

## Wayne Ağı — Ajan Rolleri

| Ajan | Model | Tetikleyici | Sorumluluk |
|------|-------|-------------|------------|
| **Alfred** | minimax-m2.7 (OpenClaw) | Her mesaj, cron, 07:00 | Orkestrasyon, görev yönlendirme, Telegram brifing |
| **MAIT** | minimax-m2.7 | Ev işleri, alışveriş, ev bakım | Ev takibi, hatırlatma, görev organize (fiziksel iş yapamaz) |
| **MERCER** | minimax-m2.7 | Finans, ekstre, rapor | Email kontrol, PDF analiz, finans raporu |
| **Lucius** | — | "kur", "entegre et", teknoloji araştır | Yeni araç/API/framework keşfi, Tech Radar (Cuma) |
| **Netrunner** | — | "tara", "güvenlik", 03:00 cron | Güvenlik denetimi, sistem sağlık, API key rotasyonu |
| **Robin** | gemini-2.5-pro | "araştır", "rapor", "hazırla" | Araştırma, strateji belgesi, exec sunum |
| **Claude** | claude-sonnet-4-6 | Geliştirme oturumu | Kod düzenleme, mimari, dashboard geliştirme |
| **Codex** | ChatGPT/Codex CLI | Geliştirme oturumu | Kod yazma, refactor, schema, test |
| **OpenCode** | opencode-go | Manuel/pilot | Çok-model coding alternatifi |
| **Master Sefa** | — | — | Karar, yönlendirme, onay |

### Takım Felsefesi
- İkinci beyin: sistem Master Sefa'nın zihinsel uzantısıdır
- Tek merkez: tüm iletişim Alfred üzerinden akar
- Onay zorunluluğu: kritik kararlar Master Sefa'ya sorulur
- Sıfır fluff: doğrudan, net, iş değeri odaklı

## Kanonik Hafıza

- **Tek kaynak:** `~/.openclaw/workspace/memory/`
- Araç içi özel geçmiş kanonik hafızanın yerine geçmez
- Oturum başında `40-active-work.md` okunmalı
- Önemli kararlar `50-decisions.md` ve `inbox/shared-notes.md` içine yazılmalı

## Alt Ajan Konumları (OpenClaw agents/)

```
~/.openclaw/agents/
├── alfred/      ← Ana orkestratör
├── main/        ← OpenClaw main agent
├── mait/        ← Ev işleri takibi
├── mercer/      ← Finansal denetçi
└── opencode/    ← Kod editörü
```

- MAIT workspace: `/home/sefa/mait-workspace/`
- MERCER workspace: `/home/sefa/mercer-workspace/`

## Claude Code Operasyon Notları

- Güncelleme: `sudo npm install -g claude-code@latest`
- `/dream` komutu hafıza konsolidasyonu için mevcut

## Gemini Geçiş Modeli

- `ai-switch.sh` scripti 2026-04-17'de silindi (Codex güncellemesini engelliyordu, kullanılmıyordu)
- RPi 400'de eşzamanlı Claude + Gemini bellek baskısı yaratıyor; manuel geçiş yapılmalı
