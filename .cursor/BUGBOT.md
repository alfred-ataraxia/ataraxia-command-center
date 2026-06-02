# Bugbot kuralları — alfred-ataraxia org

## Odak

- Güvenlik: secret/token hardcode, `.env` commit, zayıf auth
- Veri kaybı: conflict overwrite, migration rollback eksikliği
- Operasyon: cron yarışı, servis restart döngüsü, hatalı systemd unit
- Finans: DeFi live-mode, wallet key exposure

## Ignore

- Markdown typo, Obsidian wikilink formatı
- `_templates/`, `arsiv/` altındaki stale notlar
- Generated lockfile-only diff (onaylı güncelleme)

## Repo bağlamı

| Repo | Not |
|------|-----|
| ikinci-beyin | Vault; secret asla commit edilmez |
| ataraxia-* | Pi servisleri; production restart dikkat |
| defi-apm | Finansal risk — live mode kararı kullanıcıya ait |
| kaizen | Masaüstü asistan; Ataraxia'ya yazma onaylı |

## Dil

Review yorumları Türkçe veya İngilizce olabilir; bulgu net, aksiyon maddeli olsun.
