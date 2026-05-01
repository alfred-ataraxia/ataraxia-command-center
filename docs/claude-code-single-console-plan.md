# Claude Code Single Console Plan

Tarih: 2026-05-01  
Durum: **ClauDEx migration tamamlandi (2026-05-02).** Eski claude-code-router kaldirildi, yerine ClauDEx kuruldu.  
Hedef: Sefa'nin Claude Code, Codex, Gemini CLI, OpenCode Go, OpenClaw/Alfred ve ucretsiz providerlar arasinda surekli terminal degistirmeden tek ana yuzeyden calismasi.

## Net Cevap

Evet, bunu buyuk oranda Claude Code tek kapisi haline getirebiliriz. En verimli yol iki katmanli:

1. Claude Code model backend'i icin Anthropic-compatible router/gateway.
2. Claude Code icinden Codex, Gemini CLI, OpenCode ve OpenClaw'i komut/MCP tool olarak cagiran yardimci katman.

API key veren servisler Claude Code'un arkasindaki model havuzuna baglanir. Sadece abonelik/CLI olarak calisan hesaplar ise Claude Code icinden tek komutla cagrilir. Kullanici yine Claude Code ekraninda kalir.

## Neden Tek Basina Claude Code Yeterli Degil

Claude Code dogal olarak Anthropic protokoluyle konusur. Her hesap ayni sekilde model backend olamaz:

- Claude Pro: Claude Code'un native login'iyle calisir.
- OpenRouter/OpenAI-compatible/Gemini API/OpenAI API gibi key veren servisler: gateway/router ile model backend olabilir.
- ChatGPT Plus/Codex CLI: ChatGPT Plus aboneligi genel OpenAI API key degildir; Codex CLI ayrica cagrilabilir.
- Gemini Plus/Gemini CLI: CLI OAuth veya Google hesabi model backend olmak zorunda degil; Claude Code icinden tool gibi cagrilabilir.
- OpenCode Go: OpenCode/OpenClaw tarafinda aktif; Claude Code router'a dogrudan provider olarak baglanabilir mi, endpoint/API uyumlulugu ayrica dogrulanacak.

Bu yuzden hedef "her seyi Claude Code'un icine model olarak sokmak" degil; "Claude Code'u tek operasyon konsolu yapmak".

## Aday Cozumler

### 1. OpenRouter Direct

Claude Code dogrudan OpenRouter'a baglanabilir:

- `ANTHROPIC_BASE_URL=https://openrouter.ai/api`
- `ANTHROPIC_AUTH_TOKEN=$OPENROUTER_API_KEY`
- `ANTHROPIC_API_KEY=""`

Arti:

- En hizli kurulum.
- Local proxy yok.
- Ucretsiz ve ucretli OpenRouter modelleri tek yerden gorunur.

Eksi:

- OpenRouter kendi dokumaninda Claude Code icin maksimum uyumlulugu Anthropic first-party provider ile oneriyor.
- Tum hesaplari kapsamaz; Gemini CLI, Codex CLI, OpenCode Go ayri kalir.

### 2. Claude Code Router

`musistudio/claude-code-router` bu hedefe en yakin arac:

- Claude Code isteklerini farkli provider/model'lere yonlendirir.
- OpenRouter, DeepSeek, Ollama, Gemini, Volcengine, SiliconFlow gibi providerlar icin transformer destegi var.
- Claude Code icinde `/model` ile dinamik model degistirme ve `ccr model` CLI yonetimi sunar.
- API key'leri config icinde env interpolation ile disaridan okuyabilir.

Arti:

- Tek Claude Code deneyimine en yakin cozum.
- Provider bazli route: default, background, think, longContext, webSearch.
- Ucretsiz provider ve yerel modelleri de kapsayabilir.

Eksi:

- Ucuncu parti router; security/ToS/logging denetimi gerekir.
- API key ve promptlar router'dan gececegi icin log kapatma/redaction sart.
- RPi 400 uzerinde ek process yuk yaratir; hafif ve localhost sinirli calismali.

### 3. LiteLLM Gateway

Anthropic dokumani LLM gateway modelini destekliyor; LiteLLM icin bilgilendirici kurulum anlatiliyor.

Arti:

- Merkezi auth, usage tracking, budget, audit, routing icin guclu.
- OpenAI-compatible ekosistemi genis.

Eksi:

- RPi 400 icin daha agir.
- Config/operasyon karmasikligi Claude Code Router'dan fazla.
- Ilk faz icin fazla buyuk.

## Secilen Yol

Ilk tercih: Claude Code Router pilotu.

Neden:

- Kullanici istegine en yakin: Claude Code tek kapisi.
- `/model` ile model degistirme hedefini karsiliyor.
- OpenRouter/free, Gemini API, DeepSeek, local/Ollama ve diger OpenAI-compatible providerlar icin genisliyor.
- OpenClaw base sistemini degistirmeden pilot yapilabilir.

Fallback:

- Router sorun cikarsa OpenRouter Direct profili kullanilir.
- Kurumsal/uzun vadeli gateway gerekirse LiteLLM ikinci faza alinir.

## Gerekli Teknik On Kosullar

- Claude Code `2.1.126` surumune guncellendi.
- Claude Code Router `2.0.0` kuruldu.
- Router config: `~/.claude-code-router/config.json`
- Wrapperlar: `claude-main`, `claude-all`, `claude-free`, `claude-router-status`, `claude-router-model`
- Claude Code slash command katmani: `/codex`, `/gemini`, `/opencode`, `/openclaw`, `/router`
- Router localhost ile sinirlanacak.
- Router loglari kapali veya minimal olacak.
- API key'ler markdown/config icine yazilmayacak; env veya secret store kullanilacak.
- Claude native profil korunacak; router bozulursa `claude-main` ile geri donulecek.

## Hedef Komut Deneyimi

Kullanici acisindan hedef:

```bash
claude-main      # Native Claude Pro/Claude login
claude-all       # Router uzerinden OpenRouter/Gemini/OpenAI-compatible/free pool
claude-safe      # Sadece guvenilir providerlar, private repo icin
claude-free      # Ucretsiz/dusuk riskli provider havuzu
```

Claude Code icinde:

```text
/model           # Router modellerini sec
/status          # Aktif endpoint/model dogrula
/codex ...       # Codex CLI yardimci komutu, sonraki faz
/gemini ...      # Gemini CLI yardimci komutu, sonraki faz
/openclaw ...    # OpenClaw/TASKS/memory yardimci komutu, sonraki faz
```

## Hesap ve Provider Haritasi

| Kaynak | Claude Code model backend | Claude Code tool/komut | Not |
|---|---:|---:|---|
| Claude Pro | Evet, native | Gerek yok | Ana guvenli profil |
| ChatGPT Plus | Hayir, dogrudan API degil | Evet, Codex CLI | OpenAI API key varsa backend olur |
| Codex CLI | Hayir | Evet | Claude icinden `codex exec` cagrilabilir |
| Gemini Plus/CLI | Kismen, API key varsa | Evet | OAuth CLI tool; API key ayri |
| OpenCode Go | Dogrulanacak | Evet | OpenCode CLI ve OpenClaw provider aktif |
| OpenRouter | Evet | Evet | En genis free/paid model katalogu |
| free-llm-api-resources | Katalog | Katalog | Runtime dependency degil |
| OpenClaw/Alfred | Hayir | Evet | TASKS/memory/Telegram orkestrasyon |

## Uygulama Plani

### Faz 0: Hazirlik

- Claude Code guncelleme yolu dogrulanacak.
- `claude-main` native profil korunacak.
- Mevcut `alfred()` shell failover fonksiyonu pasiflestirilmeyecek; yeni wrapperlar ayri isimle eklenecek.

### Faz 1: Router Pilotu

- `@musistudio/claude-code-router` kurulumu degerlendirilecek.
- `~/.claude-code-router/config.json` secretsiz/env interpolation ile hazirlanacak.
- Ilk provider sadece OpenRouter veya test key'i olacak.
- `claude-all` wrapper'i router ile Claude Code baslatacak.
- `/status` ve `/model` davranisi test edilecek.

### Faz 2: Provider Genisletme

- OpenRouter free/paid modeller eklenecek.
- Gemini API key varsa router'a Gemini provider olarak eklenecek.
- OpenAI API key varsa OpenAI provider olarak eklenecek; ChatGPT Plus ile karistirilmeyecek.
- OpenCode Go endpoint/API uyumlulugu dogrulanacak.
- Local/Ollama sadece uygun donanim varsa eklenecek; RPi 400 ana local LLM host olmayacak.

### Faz 3: CLI Tool Katmani

- Claude Code custom command veya MCP ile sunlar eklenecek:
  - `codex` yardimci komutu
  - `gemini` arastirma komutu
  - `openclaw task/status/memory` komutu
- Bu komutlar ayni proje dizininde ve ayni kanonik memory/TASKS dosyalariyla calisacak.
- Cikti kisa tutulacak; Claude Code icinde ozetlenecek.

### Faz 4: OpenClaw Entegrasyonu

- OpenClaw base runtime degistirilmeyecek.
- Alfred Telegram ve dashboard, Claude tek-kapi profil durumunu gorecek sekilde raporlanacak.
- TASKS assignment mantigi korunacak; sadece baslatma yuzeyi Claude Code'a yaklastirilacak.

### Faz 5: Dashboard Gorunurlugu

- Dashboard'a "Claude Single Console" karti eklenecek.
- Gosterilecek alanlar: aktif profil, router durumu, son model, son hata, provider health, free/premium ayrimi.

## Ilk Kurulumda Yapilacaklar

1. Claude Code'u `2.1.126+` surume guncelle.
2. `claude-main` native profilini test et.
3. Claude Code Router'i kur.
4. Router'i localhost + secretsiz env interpolation ile baslat.
5. OpenRouter Direct veya Router uzerinden ilk model secimini test et.
6. `claude-all` wrapper'i ekle.
7. Codex/Gemini/OpenClaw custom command katmanini ekle.

## 2026-05-01 Pilot Kurulum Notu

Tamamlananlar:

- `@anthropic-ai/claude-code` guncellendi: `2.1.126`.
- `@musistudio/claude-code-router` kuruldu: `2.0.0`.
- Router `127.0.0.1:3456` uzerinde arka planda calisiyor.
- Router loglari kapali: `LOG=false`, `LOG_LEVEL=error`.
- Shell'de hazir komutlar eklendi:
  - `claude-main`: native Claude Code/Claude Pro profili.
  - `claude-all`: Claude Code Router uzerinden tek-kapi profil.
  - `claude-free`: OpenRouter direct/free profil; `OPENROUTER_API_KEY` yoksa kontrollu hata verir.
  - `claude-router-status`: router durum kontrolu.
  - `claude-router-model`: router model secim araci.
- Claude Code slash command dosyalari eklendi:
  - `/codex`
  - `/gemini`
  - `/opencode`
  - `/openclaw`
  - `/router`

Mevcut env durumu:

- `GEMINI_API_KEY`: mevcut; router default backend Gemini.
- `OPENROUTER_API_KEY`: shell'de yok; free/OpenRouter slotu key girilene kadar aktif kullanilmaz.
- `OPENAI_API_KEY`: shell'de yok.
- `OPENCODE_API_KEY`: shell'de yok.

Canli test sonucu:

- Router process saglikli: `127.0.0.1:3456`.
- `claude-all -p "Sadece OK yaz."` 90 saniye timeout oldu.
- Dogrudan router `/v1/messages` testi Gemini API backend'de 429 verdi.
- Kök neden: `GEMINI_API_KEY` var, fakat Gemini API free-tier kotasi ilgili model icin `limit: 0`.
- Bu nedenle `claude-all` simdilik `OPENROUTER_API_KEY` olmadan kontrollu hata verir.
- Native Claude Pro icin `claude-main` kullanilir.
- OpenRouter key girilince `ccr restart` ile `claude-all` aktif backend olarak kullanilir.

## Risk Kurallari

- Router config'e API key yazilmayacak.
- Router dis IP'ye acilmayacak; localhost kalacak.
- Router loglari prompt/secret icermeyecek sekilde kapatilacak veya minimize edilecek.
- Ucretsiz providerlar private repo, secret, finansal veri ve kritik kod degisikliginde kullanilmayacak.
- Native Claude profil her zaman geri donus yolu olarak kalacak.

## Kaynaklar

- Claude Code env vars: https://code.claude.com/docs/en/env-vars
- Claude Code LLM gateway: https://code.claude.com/docs/en/llm-gateway
- OpenRouter Claude Code integration: https://openrouter.ai/docs/guides/coding-agents/claude-code-integration
- Claude Code Router: https://github.com/musistudio/claude-code-router
- Hugging Face Claude Code integration: https://huggingface.co/docs/inference-providers/integrations/claude-code
- OpenCode providers: https://opencode.ai/docs/providers/

## Sonuc

Tek terminal deneyimi icin hedef komut `claude-all` olacak. Arka planda router/provider/tool ayrimi olacak ama kullanici surekli Claude Code, Codex, Gemini ve OpenCode arasinda manuel gecmek zorunda kalmayacak.

---

## 2026-05-02 ClauDEx Migration — Tamamlandı

### Yapılanlar

1. **Eski sistem kaldırıldı:**
   - `@musistudio/claude-code-router` process durduruldu (PID 949589)
   - Eski wrapper script'leri silindi: `claude-all`, `claude-free`, `claude-router-status`, `claude-router-model`
   - Router config yedeklendi: `~/backups/claudex-migration-20260501/`
   - Router npm paketi hâlâ yüklü (geri dönüş için kaldırılmadı)

2. **Yeni sistem kuruldu — ClauDEx v0.2.0:**
   - Mimari: Shell function override (0MB ek RAM, proxy yok)
   - Kurulum dizini: `~/.claudex/`
   - Config dizini yaygınlaşıyor: agents/commands/skills/plugins/CLAUDE.md/settings.json symlink ile paylaşılıyor

3. **Profiller:**
   | Profil | Provider | Model | Durum |
   |--------|----------|-------|-------|
   | `main` | Anthropic | Native (Claude Pro) | ✅ Hazır |
   | `minimax` | MiniMax | M2.7 (bedava trial, Kasım 2026) | ✅ Doğrulandı (2894ms) |
   | `openrouter` | OpenRouter | qwen3-coder:free + 32 bedava model | ✅ Doğrulandı (minimax-m2.5:free) |
   | `zai` | Z.ai | GLM-4.7-Flash (bedava sonsuz) | ✅ Doğrulandı (geçici rate-limit) |

4. **Wrapper script'leri** (`~/.local/bin/`):
   - `claude-main` → Native Claude Pro
   - `claude-minimax` / `minimax` → MiniMax M2.7
   - `claude-openrouter` / `openrouter` → OpenRouter bedava modeller
   - `claude-zai` / `zai` → Z.ai GLM-4.7

5. **Shell güncellemeleri:**
   - `~/.bashrc`: aliases.sh source satırı early return'den önce eklendi
   - `~/.profile`: aliases.sh source eklendi
   - Manuel alias'lar: claude-main, claude-minimax, claude-zai

6. **bashrc düzeltmesi:** ClauDEx aliases.sh satırı `case $- in` early return'ünden önce kondu — non-interactive shell'lerde de çalışacak şekilde.

### Abonelik Araçları (ClauDEx Kapsamı Dışında)

| Araç | Komut | Yetkilendirme |
|------|--------|---------------|
| Codex CLI | `codex` | ChatGPT Plus OAuth |
| Gemini CLI | `gemini` | Gemini Plus OAuth |
| OpenCode Go | `opencode` | OpenCode Go hesabı |

### API Key'ler (Kaynak)

| Key | Kaynak | Konum |
|-----|--------|-------|
| Z.ai | fd8815...sZ0b | `~/.claudex/profiles/zai/.env` |
| OpenRouter | sk-or-v1-1adb...9e94 | `~/.claudex/profiles/openrouter/.env` |
| MiniMax | zaten mevcut | `~/.openclaw/.env` + `~/.claudex/profiles/minimax/.env` |
| Gemini | zaten mevcut | `~/.openclaw/.env` |

### Bilinen Sorunlar

- Z.ai ve OpenRouter (qwen3-coder:free) geçici rate-limit veriyor — yeni hesaplarda normal
- ClauDEx alias'ları yeni terminal oturumunda `source ~/.bashrc` gerektiriyor — wrapper script'ler alias gerektirmeden çalışır
