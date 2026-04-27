# EPIC: Ataraxia Command Center

**Son guncelleme:** 2026-04-27 · Codex

## VIZYON
Sistemin otonom çıktılarını, sistem sağlığını ve proje ilerlemesini (Scrum) interaktif yönetebileceğimiz merkezi kontrol kulesi.

## PHASES

### Phase 1: Gözlem ve Durum Ekranı (MVP) [TAMAMLANDI ✅]
- **Hedef:** OpenClaw ajanlarının durumunu (last-updated), kritik sistem metriklerini ve Backlog durumunu tek ekrandan görüntülemek.
- **Entegrasyon:** React + Vite + Tailwind CSS v4 (Scaffolded with Claude Code).
- **Sprint-01 Task:** Dashboard iskeleti kuruldu, build alındı.

### Phase 2: İnteraktif Komuta [TAMAMLANDI ✅]
- **Hedef:** Arayüz üzerinden komut giriş paneli (metin girişi, hazır görev butonları).
- **Entegrasyon:** Dashboard görev UI, approvals, feedback, token widget, ajan görünürlüğü.

### Phase 3: Scrum/Proje Yönetim Paneli [TAMAMLANDI ✅]
- **Hedef:** Dashboard üzerinden Sprint ilerlemesi, backlog yönetimi ve otomatik raporlama.
- **Entegrasyon:** `TASKS.json`, `backlog.md`, sprint görünürlüğü, morning/evening raporları.

### Phase 4: Operator-Controlled Autopilot [AKTIF]
- **Hedef:** DeFi APM kararlarını operatör onayıyla güvenli şekilde yönetmek.
- **Entegrasyon:** DeFi APM Autopilot paneli, approval queue, private key file desteği.

### Phase 5: Approval-Gated Autonomous Runner [PLANLI]
- **Hedef:** Dashboard "Başlat" aksiyonunu güvenli runner/playbook akışına bağlamak.
- **Kural:** Onay mekanizması, allowlist ve secret izolasyonu olmadan tam otonom execution açılmaz.

---
## PRIORITIES
- P0: B-020 live execution policy + cüzdan/private RPC kararı
- P1: B-052 calendar sync için `gog` + OAuth kurulumu
- P2: Approval-gated runner tasarımı
