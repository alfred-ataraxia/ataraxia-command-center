# Sprint 06 — Sistem Geneli Backlog Oturumu (S6-02)

**Tarih:** 2026-04-20
**Amaç:** Alfred/MAIT/HA/Homepage yuzeylerinde acik isleri netlestirip bir sonraki adimlari cikarmak.

---

## Durum

- Sprint-04 ve Sprint-05 tamam (dokumanlar mevcut).
- Sprint-06 aktif: S6-01 done (Autopilot dashboard paneli), S6-02 bekliyor.

---

## Bulgu: Dashboard calistirma / restart yolu

- Systemd unit (system scope): ` /etc/systemd/system/ataraxia-dashboard.service `
  - `ExecStart`: `node /home/sefa/alfred-hub/command-center/dashboard/server.cjs`
  - `.env`: `/home/sefa/alfred-hub/command-center/dashboard/.env`
- User unit (legacy): `~/.config/systemd/user/ataraxia-dashboard.service`

Not: Bu ortamda systemd bus erisimi kisitli olabilir; restart islemi icin Pi tarafinda komut calistirmak gerekebilir.

---

## Bulgu: DeFi kritik alert tasklari

- `DEFI-089` ve `DEFI-090` pending (auto:false) ve manuel triage gerektiriyor.
- Gorevler `Master Sefa`'ya atanacak sekilde normalize edildi (priority=high, tags=defi/alert).

---

## Bulgu: Homepage config

- `~/homepage/config/services.yaml` icinde Alfred Dashboard (4173) ve DeFi APM (4180) widget'lari var.
- Tokenlar env var ile geciyor (inline secret yok).

---

## Bulgu: MAIT yuzeyi

- `~/mait-workspace/` mevcut ama eski notlardaki `~/mait/` yolu yok.
- MAIT'in operasyonel TODO/EV-LIST/ALISVERIS yuzeyi eksik (ihtiyac varsa eklenecek).

---

## Next Actions (S6-02 icin aday)

1. Dashboard servisinin gercek calisma modu: systemd mi OpenClaw supervisor mu? (tek kaynaga indir)
2. DeFi task triage: DEFI-089/090 icin "ack + archive" proseduru
3. MAIT icin operasyonel dosyalar: `TODO.md`, `EV-LIST.md`, `ALISVERIS.md` (ihtiyac varsa)
4. Homepage: uptime/health widget'larinda refresh interval ve endpoint tutarliligi kontrol

