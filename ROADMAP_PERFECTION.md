# Ataraxia Sistem Mükemmelleştirme Yol Haritası (System Perfection Roadmap)

**Başlangıç Tarihi:** 2 Mayıs 2026
**Vizyon:** Mevcut çalışan sistemi, hata toleransı en üst düzeyde olan, otonom kararlar alabilen, "Enterprise Grade" (kurumsal standartlarda) bir akıllı ev/asistan ve finans ekosistemine dönüştürmek.

Bu doküman, sistemin tüm parçalarını ayrıştırır. Her bir modüle sırayla odaklanılacak, o modülün kodları, logları ve konfigürasyonları derinlemesine taranacak, özel bir eylem planı çıkarılacak ve tamamlandıkça işaretlenecektir.

---

## 🗂️ MODÜL 1: Ajan Ekosistemi & Orkestrasyon (Agent Ecosystem)
*Ajanların izolasyonu, rolleri, OpenClaw/ClauDEx entegrasyonu ve model yönlendirmesi.*
- [ ] **1.1. Kimlik ve Yetki İzolasyonu:** Alfred, MAIT, MERCER için tam bağımsız `agent.json`, `SOUL.md` ve `TOOLS.md` yapılandırmalarının taranması.
- [ ] **1.2. Model Yönlendirme (Routing) Verimliliği:** Kimi, MiniMax, Gemini, Claude arasındaki görev dağılımının token maliyeti ve hız (latency) açısından derin analizi.
- [ ] **1.3. OpenClaw Gateway & Lattice IPC:** Ajanlar arası mesajlaşmanın (socket, IPC) çökme toleransı ve zombi process oluşumuna karşı denetimi.

## 🧠 MODÜL 2: Kanonik Hafıza & İkinci Beyin (Memory Engine)
*Obsidian vault ile OpenClaw bellek yönetiminin kusursuz senkronizasyonu.*
- [ ] **2.1. OpenViking Hibrit Arama:** Dry-run modundan çıkartılıp, RAG (Retrieval-Augmented Generation) mimarisinin sistemin tüm arama süreçlerine (hybrid retrieval) entegre edilmesi.
- [ ] **2.2. Veri Sıkıştırma (Compaction):** `compaction.sh` ve `archive.sh` scriptlerinin veri kaybı riskine karşı denetlenmesi ve LLM'e giren "Master Memory" boyutunun token optimizasyonu.
- [ ] **2.3. Vault-Sync Çatışma Çözümü:** Obsidian ile OpenClaw arasındaki iki yönlü (bi-directional) sekronizasyonun (git merge conflict, override) güvenliğinin sağlanması.

## 🖥️ MODÜL 3: Etkileşim Katmanı (Dashboard & Telegram)
*Sefa'nın sistemle konuştuğu arayüzlerin (UX/UI) güçlendirilmesi.*
- [ ] **3.1. Dashboard API & Rate Limiting:** Express API (`server.cjs`) mimarisinin yük testlerinden geçirilmesi, SSE (Server-Sent Events) log akışının stabilitesi.
- [ ] **3.2. Telegram Otonomisi:** `telegram_bot.py` üzerinden gönderilen komutların Markdown hatalarına düşmemesi, rate-limit yememesi ve native OpenClaw channel entegrasyonu ile çakışmamasının garantilenmesi.
- [ ] **3.3. Dashboard UX/UI Mükemmelliği:** QuickCapture (Hızlı Not) widget'ının anında geri bildirim vermesi, offline çalışma toleransı ve arayüz tepkiselliğinin artırılması.

## 💰 MODÜL 4: Finansal Otonomi (DeFi APM & Mercer)
*Varlık yönetimi, bütçe ve on-chain otonomi.*
- [ ] **4.1. DeFi APM Risk Motoru (Risk Engine):** Hard-risk kurallarının (stablecoin depeg, TVL drop) deterministik matematik modellerinin test case'ler (Vitest) ile yüzde yüz doğrulanması.
- [ ] **4.2. DeFi APM Autopilot (Phase 2):** Live execution onayı verilmeden önceki test-in-prod adımları (simülasyon doğruluğu, gas fee limitleri).
- [ ] **4.3. BudgetBakers Ledger Analizi:** Mercer'ın `wallet-check.sh` ve `expense_report.py` scriptlerinin anomali tespit (Machine Learning/Heuristic) zekasının artırılması.

## 🏠 MODÜL 5: Ev Otomasyonu & IoT (Home Assistant)
*Akıllı ev aletlerinin, ağın ve IoT sensörlerinin Alfred ile entegrasyonu.*
- [ ] **5.1. HA API Güvenilirliği:** Dashboard'un Home Assistant API (`/api/ha/devices`) çağrılarının zaman aşımı (timeout) yönetimi ve offline cihaz tespiti.
- [ ] **5.2. Çevresel Farkındalık:** MAIT ajanının (Ev İşleri Yöneticisi) Home Assistant sensör verilerini kullanarak proaktif kararlar alabilmesi (ör. sıcaklık analizi, güvenlik uyarısı).

## ⚙️ MODÜL 6: Operasyon, Loglama ve Felaket Kurtarma (Enterprise Ops)
*Sistemin kendi kendine yetebilmesi, otomatik tamir ve audit logları.*
- [ ] **6.1. Cron ve Task Runner (Orchestration):** `task-runner.sh` ve cron job'ların çökme anında kendini yeniden başlatma (auto-healing) ve bildirim mekanizmaları.
- [ ] **6.2. Log Rotasyonu ve Disk Analizi:** Raspberry Pi'nin SD kart/disk ömrünü uzatmak için log rotasyon politikaları (logrotate) ve tmpfs kullanımı.
- [ ] **6.3. Tam Felaket Kurtarma (Disaster Recovery):** `alfred-backup.sh` sisteminin sadece kodları değil, SQlite veritabanlarını (`runs.sqlite`, `defi-apm.sqlite`) da güvenle (lock olmadan) yedeklemesi ve geri dönüş prosedürünün test edilmesi.

## 💸 MODÜL 7: Bütçe Optimizasyonu, Kota Yönetimi ve Ücretsiz API Entegrasyonu (Cost & Quota Management)
*Azalan bütçelerin ve token kotalarının merkezi yönetimi, ücretsiz API'ların sisteme entegrasyonu.*
- [x] **7.1. Merkezi Kota Dashboard'u:** Telegram botuna `/kota` komutu ve `quota-manager.py` scripti eklendi. Son 24 saatlik token kullanımı ve hesap durumları raporlanabiliyor.
- [ ] **7.2. Ücretsiz Katman (Free Tier) Maksimizasyonu:** Groq (Llama 3), Google AI Studio (Gemini Flash), OpenRouter (Free tier) ve ClauDEx'teki ücretsiz modellerin (Z.ai vb.) sisteme güvenli, hızlı ve fallback destekli entegrasyonu.
- [ ] **7.3. Akıllı Model Yönlendirmesi (Cost-Aware Routing):** Görevin zorluğuna göre (ör. "Ev işi" veya "Özetleme" için tamamen ücretsiz modeller; çok derin kod mimarisi analizi için limiti az kalmış premium modeller) anlık karar veren bütçe farkındalığına sahip bir routing algoritması tasarımı.
ller) anlık karar veren bütçe farkındalığına sahip bir routing algoritması tasarımı.
hip bir routing algoritması tasarımı.
