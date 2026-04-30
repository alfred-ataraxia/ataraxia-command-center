# BudgetBakers Token Yenileme Runbook

## Genel Bilgi
- **Hizmet:** BudgetBakers Wallet API (MCP Server)
- **Ajan:** MERCER (Finansal Denetçi)
- **Token Tipi:** JWT Bearer Token
- **Konum:** `~/.claude.json` → `mcpServers.wallet.headers.Authorization`

## Token Durumu
| Özellik | Değer |
|---------|-------|
| Email | sefkaraoglu@gmail.com |
| User ID | 3252afa1-08f0-47bb-afa6-6f5eb9e23615 |
| Client ID | f3162ad5-46b0-4ba7-a8f3-239110d78d68 |
| Yayınlanma | 2026-04-29 09:42:41 |
| Sona Erme | **2026-05-29 09:42:41** |
| Kalan Süre | ~29 gün |

## Yenileme Adımları

### 1. Yeni Token Alma
BudgetBakers Wallet uygulamasından veya developer portalından yeni token al:

```bash
# 1. BudgetBakers Wallet web/e-posta ile giriş yap
# URL: https://web.budgetbakers.com/ veya https://my.wallet.budgetbakers.com/

# 2. Developer/API bölümüne git
# Ayarlar → Gelişmiş → API Erişimi

# 3. Yeni API token oluştur
# Veya mevcut token'ı yenile

# 4. Token'ı kopyala (JWT formatında olmalı)
```

### 2. Token'ı Yapılandırmaya Yaz

```bash
# Yedek al
cp ~/.claude.json ~/.claude.json.bak.$(date +%Y%m%d)

# Yeni token'ı ekle ( Manuel edit - güvenlik nedeniyle otomatik yapılmaz )
# ~/.claude.json dosyasını aç ve şu bölümü güncelle:
```

```json
{
  "mcpServers": {
    "wallet": {
      "type": "http",
      "url": "https://mcp.wallet.budgetbakers.com/",
      "headers": {
        "Authorization": "Bearer YENI_TOKEN_BURAYA"
      }
    }
  }
}
```

### 3. Doğrulama

```bash
# 1. mcporter ile bağlantıyı test et
mcporter list

# 2. Wallet API'yi çağır
cd /home/sefa/.openclaw/agents/mercer
./scripts/wallet-check.sh

# 3. Log kontrolü
tail -20 /home/sefa/.openclaw/agents/mercer/logs/wallet.log
```

## Otomatik Hatırlatma Planı

### Hatırlatma Takvimi
| Tarih | Eylem | Kanal |
|-------|-------|-------|
| 2026-05-22 | 7 gün uyarısı | Telegram + Dashboard |
| 2026-05-26 | 3 gün uyarısı | Telegram (yüksek öncelik) |
| 2026-05-28 | 1 gün uyarısı | Telegram (acil) |
| 2026-05-29 | Son gün | Telegram (son uyarı) |

### Otomasyon Kurulumu (Master Sefa Onayı Gerektirir)

```bash
# Cron job ekleme - SEFA ONAYI GEREKLİ
# Aşağıdaki komutları SEFA ONAYI olmadan ÇALIŞTIRMA

# 1. Hatırlatma scripti
mkdir -p /home/sefa/alfred-hub/scripts/reminders
cat > /home/sefa/alfred-hub/scripts/reminders/budgetbakers-token-check.sh << 'SCRIPT'
#!/bin/bash
TOKEN_FILE="$HOME/.claude.json"
EXPIRY=$(grep -o '"exp":[0-9]*' "$TOKEN_FILE" | cut -d: -f2)
NOW=$(date +%s)
DAYS_LEFT=$(( (EXPIRY - NOW) / 86400 ))

echo "BudgetBakers token $DAYS_LEFT gün içinde sona erecek."

if [ "$DAYS_LEFT" -le 7 ]; then
  # Telegram bildirimi gönder
  curl -s -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -d "chat_id=${TELEGRAM_CHAT_ID}" \
    -d "text=⚠️ BudgetBakers token $DAYS_LEFT gün içinde sona erecek! Yenileme runbook: /home/sefa/alfred-hub/command-center/runbooks/budgetbakers-token-renewal.md"
fi
SCRIPT
chmod +x /home/sefa/alfred-hub/scripts/reminders/budgetbakers-token-check.sh

# 2. Cron ekle (günde bir kontrol)
# crontab -e
# 0 9 * * * /home/sefa/alfred-hub/scripts/reminders/budgetbakers-token-check.sh
```

## Troubleshooting

### Hata: "401 Unauthorized"
**Nedeni:** Token süresi dolmuş  
**Çözüm:** Yeni token al ve yapılandırmayı güncelle

### Hata: "403 Forbidden"
**Nedeni:** API erişim yetkisi kaldırılmış olabilir  
**Çözüm:** BudgetBakers hesap ayarlarından API erişimini kontrol et

### Hata: MCP server connection failed
**Nedeni:** mcporter yapılandırması bozuk  
**Çözüm:**
```bash
mcporter list
mcporter config get wallet
```

## Bağımlı Sistemler
Bu token aşağıdaki sistemleri etkiler:
- MERCER ajanı (wallet-check.sh)
- Günlük bütçe raporları
- Dashboard finans widget'ı
- Telegram bütçe bildirimleri

## İletişim
- BudgetBakers Destek: https://support.budgetbakers.com/
- Developer Portal: https://developers.budgetbakers.com/
- Runbook Sahibi: Alfred (Sistem Ajanı)
- Onay Gerektiğinde: Master Sefa

---
*Son güncelleme: 2026-04-30*  
*Bir sonraki yenileme: 2026-05-29 öncesi*
