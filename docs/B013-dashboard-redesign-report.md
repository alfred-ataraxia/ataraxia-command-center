# B-013 Dashboard Redesign — Analiz ve Öneri Raporu

**Tarih:** 2026-04-19  
**Hazırlayan:** Claude (Robin modunda)  
**Kapsam:** `dashboard/src/` kaynak kodu + canlı API analizi  
**Amaç:** Mevcut sorunları tespit et, öncelikli iyileştirmeleri sun, uygulama yol haritası ver.

---

## 1. Mevcut Durum Tespiti

### Mimari

| Katman | Teknoloji | Not |
|--------|-----------|-----|
| Frontend | React 19 + Vite + Tailwind 4 | Solid |
| İkonlar | Lucide React | Solid |
| Fontlar | Inter + JetBrains Mono | Solid |
| Tema | CSS custom properties, dark/light toggle | Solid |
| State | Local `useState` + fetch, polling | Yeterli (küçük app) |
| Auth | ~~DASHBOARD_TOKEN~~ → **kaldırıldı 2026-04-19** | Artık LAN-only |

### Navigasyon (8 ekran)

```
Kokpit → Görevler → Ajanlar → Otomasyon → Hafıza → Logs → DeFi APM → Top Pools
```

---

## 2. Tespit Edilen Sorunlar

### 🔴 Kritik — Düzeltilmesi Zorunlu

#### S1 — LoginModal ölü kod
`App.jsx` satır 9: `LoginModal` import ediliyor, 32: render ediliyor.  
`getToken()` → her zaman `null` döner (token kaldırıldı) → modal her açılışta render edilir ama içeride butona basmak gerekmez mi diye test edilmeli.  
**Risk:** UX bozukluğu, boş state tutma, gereksiz bundle.

#### S2 — Hardcoded model isimleri
- `Overview.jsx` L44: `model: 'MiniMax-M2.7'` — `/api/ai-status` cevabından alınıyor ama fallback hardcode.
- `OrchestrationView.jsx` L5–10: AGENTS dizisi tamamen statik; Claude/Gemini model isimleri kodda gömülü.  
**Risk:** Model güncellendiğinde UI yanlış bilgi gösterir.

#### S3 — DeFi alert'leri aktivite akışını kirletiyor
`Overview.jsx` L96–115: CRITICAL DeFi alert'leri "Son Görevler" akışına enjekte ediliyor.  
**Risk:** Sprint-04'te 45 DeFi alarmı arşivlendi; alarm dolumu aktivite akışını örtüyor. Ayrı bir "DeFi Uyarıları" widget'ı olmalı.

---

### 🟡 Orta — Sprint içi düzeltilebilir

#### S4 — Sprint/Backlog ekranı yok
Dashboard'da aktif sprint (sprint-04.md), story point durumu, tamamlanan/bekleyen oran görünmüyor.  
Sprint durumunu görmek için terminal açmak gerekiyor — Kokpit'in işlevini zedeliyor.

#### S5 — Overview grid'i mobil dostu değil
Tek sütun, dikey akış, tüm widget'lar eşit genişlik.  
Tablet/geniş ekranda boşluk israfı. Grid layout önerilecek.

#### S6 — Top Pools ayrı ekran gereksiz
`toppools` view'u `DefiView` ile içerik örtüşüyor; önemsiz bir tab olarak sidebar'ı şişiriyor.  
DeFi APM ekranına sekme (tab) olarak taşınabilir.

#### S7 — Morning Briefing / Günlük özet widget'ı yok
`morning-briefing` scripti Telegram'a özet gönderiyor ama Dashboard'da görünmüyor.  
Kokpit'e "Bugünün Özeti" kartı eklenebilir — sprint ilerleme + sistem özet + DeFi durumu.

---

### 🟢 Düşük — Backlog'a alınacak

#### S8 — Otomasyon ekranı Home Assistant ile derinleşebilir
Şu an HA otomasyon sayısı + durum gösteriyor. Son tetikleme zamanı, başarı/hata geçmişi eklenebilir.

#### S9 — Hafıza ekranı shared-notes.md dışı dosyaları göstermiyor
`MemoryView` tek dosyayı gösteriyor; `~/.openclaw/workspace/memory/` altındaki tüm dosyalar listelenebilir.

#### S10 — Açık kayıt silme (task delete) animasyon eksik
`TaskQueue.jsx` confirm-delete akışı var ama silme sonrası liste animasyonsuz refresh yapıyor.

---

## 3. Öncelik Matrisi

| # | Sorun | Efor | Değer | Sıra |
|---|-------|------|-------|------|
| S1 | LoginModal kaldır | 15 dk | Yüksek | **1** |
| S2 | Model isimleri dinamik yap | 30 dk | Yüksek | **2** |
| S3 | DeFi alert'leri ayır | 1 saat | Orta | **3** |
| S4 | Sprint widget ekle | 2 saat | Yüksek | **4** |
| S5 | Overview grid | 1 saat | Orta | **5** |
| S6 | Top Pools → DeFi tab | 30 dk | Düşük | **6** |
| S7 | Günlük özet kartı | 2 saat | Orta | **7** |
| S8 | HA otomasyon derinlik | 3 saat | Düşük | Backlog |
| S9 | Memory view genişlet | 2 saat | Düşük | Backlog |
| S10 | Delete animasyon | 30 dk | Düşük | Backlog |

---

## 4. Uygulama Yol Haritası

### Faz 1 — Temizlik (S1 + S2 + S3) · ~2 saat · Hemen yapılabilir

```
1. App.jsx → LoginModal import + render satırlarını kaldır
2. apiFetch.js → getToken() ve setToken() fonksiyonlarını kaldır (kullanılmıyor)
3. LoginModal.jsx → dosyayı sil
4. Overview.jsx → activeAI.model → /api/ai-status'tan gel, hardcode kaldır
5. OrchestrationView.jsx → AGENTS dizisini /api/ai-status'tan populate et
6. Overview.jsx → DeFi alert + aktivite birleştirme mantığını ayır;
   "Son Görevler" sadece TASKS.json aktiviteleri göstersin
```

### Faz 2 — Sprint Widget (S4) · ~2 saat · Bu sprint içi

```
Yeni component: SprintStatus.jsx
- /api/sprint endpoint → sprint-XX.md'den parse et (server.cjs'e ekle)
- Göster: sprint adı, bitiş tarihi, ✅/⏸/⏳ sayıları, progress bar
- Kokpit'te ALFRED DURUMU bloğunun altına yerleştir
```

### Faz 3 — Layout & UX (S5 + S6) · ~1.5 saat

```
- Overview: 2-kolon grid (sol: sistem metrikleri + alfred durumu, sağ: görevler + git)
- Top Pools → DefiView'e tab olarak taşı; Sidebar'dan "Top Pools" kaldır (7 → 7 nav item kalır)
```

### Faz 4 — Günlük Özet (S7) · ~2 saat

```
Yeni component: DailySummary.jsx
- /api/daily-summary endpoint → morning-briefing verilerini döndür
- Göster: tarih, toplam görev özeti, DeFi durumu, önemli uyarılar
- Kokpit en üstüne banner olarak ekle (sadece sabah saatlerinde veya her zaman)
```

---

## 5. API Eklentileri (server.cjs)

Faz 2 ve Faz 4 için server.cjs'e eklenmesi gereken endpoint'ler:

```js
// GET /api/sprint
// sprint-04.md okur, parse eder, JSON döner
{ sprintName, endDate, total, done, inProgress, deferred }

// GET /api/daily-summary  
// morning-briefing output'unu veya son run log'unu döner
{ date, systemOk, tasksTotal, tasksDone, defiStatus, alerts }
```

---

## 6. Sefa'nın Onayına Sunulan Kararlar

| Karar | Seçenek A | Seçenek B |
|-------|-----------|-----------|
| **Sprint widget formatı** | Mini progress bar (Kokpit'te) | Tam ekran "Sprint" tab'ı |
| **Top Pools** | DeFi APM içine al (sidebar temizle) | Sidebar'da bırak |
| **Günlük özet** | Her zaman görünür banner | Sadece sabah 06-12 arası |
| **Faz sırası** | Faz 1 → 2 → 3 → 4 (öneri) | Sadece Faz 1 yap, rest backlog |

---

## 7. Teknik Riskler

| Risk | Olasılık | Etki | Önlem |
|------|----------|------|-------|
| Sprint MD parse kırılması | Düşük | Orta | Regex yerine satır bazlı parse, hata toleranslı |
| /api/ai-status format değişikliği | Orta | Düşük | Fallback değerleri koy |
| Server.cjs'e yeni endpoint — port çakışması | Yok | — | Aynı 4173 portu, yeni route |
| DeFi ayırma — aktivite akışı boşalır | Düşük | Düşük | "Henüz aktivite yok" UI zaten mevcut |

---

*Bu rapor B-013 gereği hazırlanmıştır. Sefa onay verirse Faz 1 bu session'da uygulanabilir.*
