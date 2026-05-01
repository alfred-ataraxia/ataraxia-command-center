# Sprint 07

**Hedef:** Dashboard görsel iyileştirme (Claude Design), sistem bakımı
**Tarih:** 2026-04-27 (Pazar) → 2026-05-10 (Cumartesi)
**Durum:** Aktif

---

## Sprint Hedefleri

1. Claude Design ile dashboard UI revizyonu
2. Sistem bakımı ve küçük iyileştirmeler

---

## Sprint Backlog

| # | Görev | Puan | Durum | Atanan | Notlar |
|---|-------|------|-------|--------|--------|
| S7-01 | Claude Design — dashboard tasarım sistemi kur ve öneriler al | 2 | ✅ Done | Sefa | Warm Obsidian yönü seçildi |
| S7-02 | Dashboard UI revizyonu — Claude Design çıktısını uygula | 5 | ✅ Done | Claude | Warm Obsidian palette, neon kaldırıldı, commit 0edf8bf |
| S7-03 | İkinci Beyin şablon seti — daily, weekly, project, research, meeting, decision | 2 | ✅ Done | Gemini | B-069, 6 şablon oluşturuldu |
| S7-04 | YAML metadata standardizasyonu — tüm vault dosyalarına status/aliases ekle | 2 | ✅ Done | Gemini | B-070, 74 dosya güncellendi |
| S7-05 | MOC (Maps of Content) sayfaları — her alana Dataview indeks + ana MOC | 3 | ✅ Done | Codex | B-068, 11 indeks sayfası oluşturuldu |
| S7-06 | Dashboard bileşen tutarlılığı — Memory/Agents/Automation/Logs/Approvals | 3 | ✅ Done | Claude | Header normalizasyonu, AgentStatus dead code silindi, Territory Studio + Fathom HUD redesign — commit 8ca2268 |
| S7-07 | OpenViking Alfred hafıza pilotu — shadow/read-only kurulum | 3 | 🔄 Devam ediyor | Codex | T-082/T-083/T-084 tamamlandı; KPI takip aşaması |
| S7-08 | DeFi eylem geçmişi — Autopilot log dashboard | 2 | ✅ Done | Codex | T-074 tamamlandı; Autopilot sekmesine eylem özeti + neden dağılımı eklendi |
| S7-09 | Alfred sistem analizi ile canlı tarama bulgularını hizala | 2 | ✅ Done | Codex | T-087 tamamlandı; ALFRED_PROJECT_STATE ve 40-active-work hizalandı |
| S7-10 | OpenClaw performans karar paketi | 2 | ✅ Done | Codex | T-088 tamamlandı; karar paketi docs/openclaw-memory-core-dreaming-decision.md |
| S7-11 | Alfred task-runner çalışma politikası | 2 | ✅ Done | Codex | T-089 tamamlandı; docs/alfred-task-runner-policy.md |
| S7-12 | Telegram latency kapanış doğrulaması | 2 | 🔄 In Progress | Codex | T-085; memory-core A/B başarısız, odak Telegram lane/transport ve fast path |
| S7-13 | OpenClaw cron/tool sandbox hatası analizi | 2 | ✅ Done | Codex | T-093; rapor `docs/openclaw-cron-tool-sandbox-analysis.md`, config değişmedi |
| S7-14 | cron-failure-alert LLM yükünü azalt | 3 | ⏳ Pending | Codex | T-094; onayla hafif/LLM'siz yol tasarlanacak |
| S7-15 | Multi-AI workspace planı | 2 | 🧭 Planned | Codex | Plan `docs/multi-ai-workspace-plan.md`; Claude Code ana yüzey, OpenClaw orkestrasyon, OpenCode Go çok-model havuz |

---

## Sıradaki Uygulama Sırası

1. **Plan/hafıza hizalama:** T-087 tamamlandı; Alfred raporu, canlı tarama ve backlog/TASKS durumu aynı hatta çekildi.
2. **Performans karar paketi:** T-088 tamamlandı; `memory-core dreaming` için 24 saatlik geçici kapatma A/B testi önerildi, uygulama onay bekler.
3. **Görev çalıştırma politikası:** T-089 tamamlandı; `alfred-task-runner` kapalı/manual kalsın, sonraki iyileştirme LLM'siz watcher olsun.
4. **Model routing:** T-086 tamamlandı; default ve Alfred/MAIT/MERCER primary `opencode-go/kimi-k2.5` doğrulandı.
5. **Cron/tool hata ayrıştırması:** T-093 tamamlandı; `cron-failure-alert` agentTurn + `host=sandbox` kök nedeni raporlandı.
6. **Kapanış ve azaltma işleri:** T-085 canlı Telegram latency testleriyle sürecek; T-094 için onaylı hafif/LLM'siz cron yolu tasarlanacak.
7. **Multi-AI workspace:** S7-15 planı doğrultusunda provider envanteri, profil wrapper'ları, TASKS/memory hizalaması ve dashboard görünürlüğü sırayla ele alınacak.
8. **Karar işleri:** T-092 DeFi live mode, T-090 MERCER tasarımı ve T-091 BudgetBakers yenileme planı Sprint-08'e taşınabilecek adaylar olarak tutulacak.

---

## Blokajlar

| # | Blokaj | Karar Veren |
|---|--------|-------------|
| B-052 | Google Calendar OAuth — `gcalcli` kuruldu, entegrasyon tamamlandı | ✅ Çözüldü |
| B-020 | DeFi Faz 3 — Live Execution aktif, private key oluşturuldu | ✅ Çözüldü |

---

## Tanımlar

- **1p:** <15dk, tek adım
- **2p:** 15-60dk, birkaç adım
- **3p:** 1-4 saat, plan gerektirir
- **5p:** Yarım gün+, bölünmeli
