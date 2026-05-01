# Multi-AI Workspace Plan

Tarih: 2026-05-01  
Durum: Plan kaydi; runtime/config degisikligi yapilmadi.  
Hedef: Claude Code, Codex, Gemini CLI, OpenCode Go, OpenClaw/Alfred ve ucretsiz provider havuzunu ayni proje dosyalari ve ortak hafiza etrafinda verimli kullanmak.

2026-05-01 ek karar: Kullanici manuel arac degistirmek istemiyor. Bu nedenle hedef "Claude Code ana yuzey"den "Claude Code tek operasyon konsolu"na yukseltildi. Ayrintili plan: `~/alfred-hub/command-center/docs/claude-code-single-console-plan.md`.

## Karar Ozeti

Tek bir arac icine her seyi zorla gommek yerine, tek bir calisma sistemi kurulacak:

- OpenClaw/Alfred: orkestrasyon, Telegram, dashboard, TASKS ve hafiza otoritesi.
- Claude Code: ana interaktif gelistirme yuzeyi.
- Codex: kod degisikligi, refactor, schema, test odakli ikinci gelistirme yuzeyi.
- Gemini CLI: arastirma, uzun rapor, ikinci gorus.
- OpenCode Go: cok-model coding havuzu ve alternatif execution surface.
- Ucretsiz providerlar: dusuk riskli arastirma, ozet, fikir, model karsilastirma havuzu.

Claude Code merkezi komut deneyimi icin iyi bir aday, ama tum providerlari Claude Code protokolune cevirip production kullanmak kirilgan. Daha saglam model: Claude Code ana yuzey olsun; OpenClaw ortak hafiza/gorev sistemi olsun; OpenCode Go ve diger CLI'lar uzman worker olarak baglansin.

## Mevcut Gercekler

- `claude`, `codex`, `gemini`, `opencode` kurulu ve global npm dizininden calisiyor.
- Claude Code surumu: `2.1.123`.
- OpenCode surumu: `1.4.10`.
- OpenClaw routing dogrulamasi: Alfred/MAIT/MERCER primary `opencode-go/kimi-k2.5`; fallbacklar OpenCode Go + MiniMax agirlikli.
- `~/.claude/settings.json` aktif; `~/alfred-hub/command-center/claude-config/` tasinabilir config kopyasi var ama `CLAUDE_CONFIG_DIR` ile aktif baglanmis gorunmuyor.
- `~/alfred-hub/command-center/skills/free-ride/` OpenRouter free model havuzu icin mevcut, fakat OpenClaw config ve gateway restart etkisi oldugu icin otomatik calistirilmayacak.
- Kanonik gorev kuyrugu `~/alfred-hub/command-center/TASKS.json`; `cron/task-worker.sh` icindeki eski `$WORKSPACE/TASKS.json` beklentisi ayri dogrulama/dzeltme gerektiriyor.

## Kaynak Arastirma Sonucu

- Claude Code resmi olarak `ANTHROPIC_BASE_URL`, `ANTHROPIC_API_KEY`, `ANTHROPIC_AUTH_TOKEN` ve `CLAUDE_CONFIG_DIR` ile farkli endpoint/profil kullanabiliyor.
- `ANTHROPIC_API_KEY` set edilirse Claude Pro/Max/Team/Enterprise login yerine API key kullanimi one gecebilir; bu yuzden subscription ve API profilleri ayrilmali.
- OpenCode resmi dokumantasyona gore `/connect` ile provider key ekliyor, credentiallari `~/.local/share/opencode/auth.json` icinde tutuyor ve 75+ provider destekliyor.
- OpenCode Go dusuk maliyetli, beta, acik kodlama modelleri icin abonelikli model havuzu; OpenClaw tarafinda runtime provider id `opencode-go` olarak korunmali.
- `claudex` yaklasimi Claude Code'un env override mekanizmasini kullanan multi-profile yardimci arac olarak mantikli, ama cok yeni/kucuk repo; once pilot, sonra karar.
- `free-llm-api-resources` iyi bir provider katalogu; runtime bagimliligi yapilmayacak.

Kaynaklar:

- https://code.claude.com/docs/en/env-vars
- https://opencode.ai/docs/providers/
- https://opencode.ai/docs/tr/go/
- https://open-claw.bot/docs/providers/opencode-go/
- https://github.com/sasdsamatt123/claudex
- https://github.com/cheahjs/free-llm-api-resources

## Hedef Mimari

### Katman 1: Ortak Hakikat

- Hafiza: `~/.openclaw/workspace/memory/`
- Handoff: `~/.openclaw/workspace/memory/inbox/shared-notes.md`
- Gorev kuyrugu: `~/alfred-hub/command-center/TASKS.json`
- Sprint/backlog: `~/alfred-hub/command-center/sprints/`, `~/alfred-hub/command-center/backlog.md`
- Obsidian gorunum: `/home/sefa/ikinci-beyin`

Her arac once bu dosyalara bakacak. Araclarin kendi session/history/cache dosyalari kanonik hafiza sayilmayacak.

### Katman 2: Profil ve Wrapper

Ilk fazda yeni proxy/router kurmadan wrapper profilleri kullan:

| Profil | Amac | Yuzey | Risk |
|---|---|---|---|
| `claude-main` | Claude Pro/subscription ile ana gelistirme | Claude Code | Dusuk |
| `claude-workspace` | `CLAUDE_CONFIG_DIR=~/alfred-hub/command-center/claude-config` pilotu | Claude Code | Orta |
| `codex-main` | ChatGPT Plus/Codex bagli kodlama | Codex CLI | Dusuk |
| `gemini-research` | Google/Gemini Plus kaynakli arastirma | Gemini CLI | Dusuk |
| `opencode-go` | Cok-model kodlama havuzu | OpenCode | Dusuk/orta |
| `free-lab` | Ucretsiz provider denemeleri | OpenRouter/OpenCode/free list | Orta/yuksek |

### Katman 3: Model Kullanım Politikasi

- Kritik repo degisikligi: Claude Code veya Codex.
- Alternatif kodlama/model denemesi: OpenCode Go.
- Arastirma ve uzun rapor: Gemini CLI.
- Ucretsiz provider: ozet, fikir, karsilastirma, halka acik bilgi; secret/private repo/diff yok.
- Telegram Alfred: hizli orkestrasyon ve durum; agir kodlama isini dogrudan Telegram session icinde yaptirmamak.

## Uygulama Fazlari

### Faz 1: Envanter ve Profil Iskeleti

- Mevcut CLI/login durumlari secretsiz envanterlenecek.
- `~/alfred-hub/command-center/docs/ai-provider-inventory.md` olusturulacak.
- Shell wrapper taslagi hazirlanacak; aktif alias/profile degisikligi onayla yapilacak.
- `claude-config` pilotu `CLAUDE_CONFIG_DIR` ile manuel test edilecek.

### Faz 2: Ortak Calisma Protokolu

- `AGENTS.md`, `CLAUDE.md`, `CODEX.md` ve OpenClaw memory ayni calisma protokolune hizalanacak.
- Her arac icin oturum basi: master memory oku, TASKS kontrol et, sonunda shared note yaz.
- TASKS kuyrugundaki assignee degerleri netlestirilecek: `Claude`, `Codex`, `Gemini`, `Alfred`, `Master Sefa`.
- `cron/task-worker.sh` eski TASKS yolu dogrulanacak; gerekirse sadece yol/config duzeltmesi yapilacak.

### Faz 3: OpenCode Go ve Ucretsiz Havuz

- OpenCode Go modelleri hiz/dogruluk icin test edilecek: Kimi, MiniMax, GLM, Mimo.
- OpenRouter/free kaynaklari kataloglanacak ama default routing'e alinmayacak.
- `free-ride` sadece manuel/onayli deney olarak tutulacak; gateway restart gerektirdigi icin otomasyon disi kalacak.
- Provider health dosyasi olusturulacak: son basari, son hata, tahmini kota, kullanim alani.

### Faz 4: Dashboard Gorunurlugu

- Dashboard Agent/Automation sekmelerine "AI Provider Matrix" karti eklenecek.
- Gosterilecek alanlar: arac, aktif profil, son calisma, son hata, guven seviyesi, kullanim alani.
- TASKS tarafinda ajan atamasi ve son notlar daha okunur hale getirilecek.

### Faz 5: Kontrollu Otomasyon

- Otomatik calisma sadece `auto:true`, dusuk risk, allowlist path ve tek ajan sirasi ile olacak.
- Ucretsiz providerlar private repo/secret iceren islerde otomatik kullanilmayacak.
- OpenClaw cron tabani korunacak; koklu runtime degisikligi onay olmadan yapilmayacak.
- Gateway/model routing degisiklikleri once dokumante edilecek, sonra manuel test, sonra kalici config.

## Ilk Is Listesi

| Oncelik | Is | Cikti | Not |
|---|---|---|---|
| P0 | Provider envanteri | `docs/ai-provider-inventory.md` | Secret yazilmaz |
| P0 | Wrapper tasarimi | `scripts/ai-profile.sh` taslagi | Aktif etme onayla |
| P0 | TASKS yolu dogrulama | Kisa rapor veya duzeltme | Kopukluk riski var |
| P1 | Claude config pilot | `claude-workspace` manuel test | `CLAUDE_CONFIG_DIR` |
| P1 | OpenCode Go benchmark | Kisa hiz/dogruluk tablosu | Telegram degil CLI |
| P1 | Free provider katalogu | Free pool policy | Sadece dusuk risk |
| P2 | Dashboard provider matrix | UI kartlari | Canli health sonra |
| P2 | OpenClaw integration | Onayli minimal baglanti | Base runtime korunur |

## Risk Kurallari

- Secret/API key markdown'a yazilmayacak.
- Subscription hesaplari 7/24 otomasyon havuzu gibi kullanilmayacak.
- Ucretsiz providerlara private repo, token, finansal veri veya credential iceren prompt gonderilmeyecek.
- RPi 400'de ayni anda agir Claude/Codex/Gemini/OpenCode calistirilmayacak.
- OpenClaw base sistem, cron ve model routing koklu degistirilmeyecek; once plan + onay.

## Basari Kriteri

- Sefa tek proje klasorlerinde calisir; hangi AI calisirsa calissin ayni TASKS/memory/sprint durumunu gorur.
- Claude Code ana gelistirme yuzeyi olur; Codex/Gemini/OpenCode ayni proje durumu ile devreye girer.
- OpenClaw/Alfred Telegram ve dashboard tarafinda gorevleri ve provider durumunu gorunur kilar.
- Ucretsiz imkanlar maliyeti dusurur ama kritik islerde kalite/gizlilik riski yaratmaz.
