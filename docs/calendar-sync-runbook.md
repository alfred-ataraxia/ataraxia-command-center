# Calendar Sync Runbook

**Durum:** Dosya entegrasyonu hazir. Kalan is: `gog` kurulumu ve Google OAuth.
**Kapsam:** Morning briefing icine bugunun Google Calendar kayitlarini eklemek.

## Mevcut Entegrasyon

- Script: `~/alfred-hub/scripts/morning-briefing.sh`
- Davranis: `gog` komutu PATH icinde varsa `gog calendar today` ciktisini alir ve brifinge `Takvim (Bugun)` bolumu olarak ekler.
- Fallback: `gog` yoksa veya takvim bos ise brifing takvim bolumu olmadan devam eder.

## Kurulum Karari

`gog` Google OAuth gerektirir. OAuth token veya refresh token repo icine, markdown notlara veya chat'e yazilmaz.

Onerilen token konumu:

- Kullanici runtime/config dizini: `~/.config/gog/`
- Repo disi secret/config dosyasi: `~/.secrets/` altinda, `chmod 600`

## Manuel Kurulum Akisi

1. `gog` CLI kurulumu yapilir.
2. Google OAuth login akisi kullanici tarafindan tamamlanir.
3. Takvim erisimi dogrulanir:
   ```bash
   gog calendar today
   ```
4. Brifing syntax kontrolu yapilir:
   ```bash
   bash -n ~/alfred-hub/scripts/morning-briefing.sh
   ```
5. Manuel dry-run sadece kullanici onayi ile calistirilir; script Telegram'a mesaj gonderir.

## Kabul Kriterleri

- `gog calendar today` token veya hata basmadan bugunun takvimini dondurur.
- Morning briefing, `gog` mevcutken takvim bolumunu ekler.
- `gog` mevcut degilken briefing fail etmez.
- OAuth/credential dosyalari git'e girmez.

