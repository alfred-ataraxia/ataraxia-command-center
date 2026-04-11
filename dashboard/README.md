# Ataraxia Dashboard

Ataraxia icin merkezi komuta paneli. React tabanli arayuz ile `server.cjs` ayni origin altinda calisir ve sistem metrikleri, gorev kuyruu, aktivite akisi, bildirimler ve otomasyon yuzeylerini tek noktada sunar.

## Temel Yetenekler

- Sistem metrikleri: CPU, RAM, Disk, Swap, uptime ve zaman serisi grafik
- Gorev yonetimi: `TASKS.json` uzerinden CRUD, durum degisikligi, not ekleme
- Operasyon gorunurlugu: aktivite akisi, bildirimler, kritik uyarilar
- Home Assistant entegrasyonu: cihaz listesi ve toggle aksiyonlari
- Guvenlik: bearer token korumasi, rate limit, security headers, startup validation

## Dizinler

- `src/`: React arayuzu
- `server.cjs`: API + static serving + operasyonel entegrasyonlar
- `logs/`: uygulama loglari ve `stats-history.json`
- `dist/`: build ciktilari
- `.env.example`: gerekli ortam degiskenleri

## Gelistirme

```bash
cd /home/sefa/alfred-hub/command-center/dashboard
npm run dev
```

Prod benzeri calistirma:

```bash
cd /home/sefa/alfred-hub/command-center/dashboard
npm run build
node server.cjs
```

## Onemli Ortam Degiskenleri

- `PORT`: dashboard portu, varsayilan `4173`
- `DASHBOARD_TOKEN`: hassas API rotalari icin bearer token
- `HA_URL` / `HA_TOKEN`: Home Assistant entegrasyonu
- `TELEGRAM_BOT_TOKEN` / `TELEGRAM_CHAT_ID`: gorev ve saglik bildirimleri
- `STATS_HISTORY_INTERVAL`: metrik kayit ve health-check araligi

## API Ozet

- `GET /api/stats`: anlik sistem istatistikleri
- `GET /api/stats/history`: zaman serisi metrikleri
- `GET /api/tasks`: gorev listesi
- `POST /api/tasks`: yeni gorev olustur
- `PUT /api/tasks/:id`: gorev guncelle
- `POST /api/tasks/:id/notes`: goreve not ekle
- `GET /api/activity`: son operasyonel olaylar
- `GET /api/notifications`: bildirim akisi
- `GET /api/alerts`: aktif operasyon uyarilari
- `GET /api/ha/devices`: Home Assistant cihazlari

## Mevcut Sonraki Adimlar

- `TASKS.json` ve `scrum/` arasinda tek kaynak secmek
- `telegram_bot.py` ile dashboard notification modelini birlestirmek
- `command-center` ve ust repo sahipligini netlestirmek
