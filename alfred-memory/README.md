# Master Memory

Bu dizin `/home/sefa` çalışma alanı için kanonik ortak hafızadır.

Amaç:

- Codex, Claude Code ve Gemini için tek doğru kaynak oluşturmak
- Disk üzerindeki paylaşılan bilgiyi araç içi özel geçmişten ayırmak
- Projeler, kullanıcı tercihleri, sistem durumu ve aktif işleri aynı yerde tutmak

Öncelikli okunacak dosyalar:

1. `00-canonical-profile.md`
2. `10-operating-rules.md`
3. `40-active-work.md`

Gerekirse:
4. `20-system-landscape.md` — sistem bileşenleri
5. `21-system-analysis.md` — **sistem analizi (tüm ajanlar için okunmalı)**
6. `30-projects.md` — proje referansları

Detay modülleri:

- `31-dashboard-state.md` — Dashboard mimari, auth, güvenlik detayları
- `32-ai-tooling-and-routing.md` — Ajan ağı, model seçimi, yönlendirme
- `33-automation-and-budget-risks.md` — Otomasyon riskleri, bütçe kuralları

Arşivlendi (stub — sadece yönlendirme içerir):

- `70-agent-sync-protocol.md` → `10-operating-rules.md` kullan
- `90-migration-report.md` → `archived/90-migration-report.md`

Kaynak ilkesi:

- `master-memory` altındaki özet dosyalar kanoniktir.
- `60-source-map.md` yalnızca kaynağın nereden türetildiğini gösterir.
- `inbox/shared-notes.md` ajanların hızlı not bıraktığı ekleme alanıdır.
- Araçların kendi session/history/cache dizinleri doğrudan kanonik hafıza sayılmaz.

Güncelleme modeli:

- Kalıcı bilgi: ilgili kanonik dosyaya yaz
- Geçici ama önemli gözlem: `inbox/shared-notes.md`
- Otomasyon: `scripts/append-shared-note.sh`

Son oluşturma:

- 2026-04-11
