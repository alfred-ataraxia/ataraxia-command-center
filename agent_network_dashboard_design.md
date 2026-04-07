# Wayne Enterprises Intelligence Network: Agent Dashboard Design Report

**Prepared for:** Master Sefa  
**Project:** AG Network Management Dashboard  
**Status:** Advanced Design & Research Phase  
**Model Verified:** Claude Opus (anthropic/claude-opus-4-6) - Strategic Intelligence Mode

---

## 1. Görsel Tasarım & UI/UX Rehberi (Command Center)

Wayne Enterprises vizyonuna uygun olarak, dashboard'un estetiği **"Batcave Tactical Console"** ve **"Modern Corporate Intelligence"** hibriti olmalıdır.

### Renk Paleti ve Tema
- **Arka Plan:** `#0A0E14` (Deep Space Black)
- **Vurgu Renkleri:** `#00D1FF` (Cyan Tech), `#1890FF` (Wayne Blue), `#FF4D4F` (Alert Red)
- **Kartlar:** `#141921` (Kömür Gri) %80 Opaklık (Glassmorphism etkisi için).
- **Yazı Tipi:** 'Roboto Mono' veya 'Orbitron' (Teknik veri hissi için).

### UI Bileşenleri
- **Glassmorphism:** Kartlarda `backdrop-filter: blur(10px)` kullanılarak derinlik hissi yaratılmalı.
- **Neon Sınırlar:** Aktif operasyonlar sırasında kart kenarlarında hafif bir mavi parıltı (box-shadow).
- **Veri Yoğunluğu:** Boşluklardan ziyade kritik verilere odaklanan "High-Density" yerleşim.

---

## 2. Fonksiyonellik: JIRA/Kanban Yapısı

Ajanların görevlerini takip etmek için Home Assistant üzerinde dinamik bir Kanban yapısı kurulacaktır.

### Kanban Sütunları
1.  **Backlog (Talimat Bekleyen):** Master Sefa'dan gelen ancak henüz atanmamış veya sıradaki görevler.
2.  **In Progress (Aktif Operasyon):** O an bir ajan tarafından işlenen (thinking/executing) görevler.
3.  **Done (Tamamlanan):** Son 24 saat içinde başarıyla raporlanmış işler.

### Teknik Entegrasyon
- **Veri Kaynağı:** Ajanlar workspace içindeki `TASKS.json` dosyasını günceller.
- **HA Sensor:** `command_line` veya `file` platformu ile bu JSON okunur.
- **Görselleştirme:** `custom:kanban-board-card` (HACS) kullanılarak bu veriler sürükle-bırak (isteğe bağlı) veya salt okunur kartlara dönüştürülür.

---

## 3. Home Assistant Entegrasyonu (Kart ve Araçlar)

Dashboard'un inşasında kullanılacak temel Lovelace kartları:

| Kart Tipi | Kullanım Amacı | Özellik |
| :--- | :--- | :--- |
| **Custom Layout Card** | Grid sistemi | Dashboard'u 12 sütunlu teknik bir yapıya böler. |
| **Custom Button Card** | Ajan Durumları | Ajan aktifken "Pulse" (nabız) animasyonu ve ikon değişimi. |
| **Lovelace Markdown** | Canlı Log Akışı | `tail -n 5` komutuyla ajanların son aktivitelerini anlık gösterir. |
| **Mini Graph Card** | Maliyet/Token | Günlük ve haftalık API harcamalarını grafiksel sunar. |
| **State Guard** | Sistem Sağlığı | VPS (Ataraxia) kaynak kullanımını (CPU/RAM) izler. |

---

## 4. Çoklu Fonksiyonlar: Tek Merkezli İzleme

Dashboard sadece bir görüntü değil, yaşayan bir kontrol paneli olacaktır:

- **Ajan Anlık Durumu:** Alfred, Lucius, Netrunner ve Robin'in her birinin yanında "Thinking...", "Idle" veya "Error" durumları.
- **Maliyet Takibi (Financials):** OpenRouter/Claude/Gemini API kullanımlarının dolar cinsinden anlık dökümü ve günlük bütçe sınırı uyarısı.
- **Sistem Sağlığı:** Ataraxia'nın sıcaklığı, disk doluluğu ve ağ gecikmesi (Ping).
- **Aktif Operasyon İzleme:** O an çalışan sub-agent sayısı ve hangi dosya üzerinde işlem yapıldığı bilgisi.

---

## 5. Uygulama Adımları (Teknik Yol Haritası)

### Adım 1: Altyapı Hazırlığı (HACS & Temalar)
- Home Assistant Community Store (HACS) üzerinden `layout-card`, `button-card` ve `kanban-card` kurulur.
- `wayne_intel_theme.yaml` dosyası oluşturularak sisteme tanıtılır.

### Adım 2: Telemetri Köprüsü (MQTT)
- OpenClaw tarafında her görev başlangıcı ve bitişinde MQTT üzerinden `openclaw/agents/{name}/status` konusuna mesaj gönderen küçük bir script entegre edilir.
- HA tarafında bu veriler `sensor` olarak tanımlanır.

### Adım 3: UI Tasarımı (YAML)
- `views` altında `Wayne Command Center` isminde yeni bir sekme oluşturulur.
- Sidebar gizlenerek tam ekran "Kiosk Mode" tasarımı uygulanır.

### Adım 4: Otomasyon ve Uyarılar
- Maliyet $4'ü geçerse veya bir ajan 10 dakikadan uzun süre "Thinking" durumunda kalırsa Telegram üzerinden Master Sefa'ya kritik uyarı gönderilmesi.

---

**Not:** Bu rapor, Master Sefa'nın stratejik vizyonuna uygun olarak, sistemin sadece bir "araç" değil, bir "karar destek merkezi" olması için hazırlanmıştır.

*Wayne Enterprises Intelligence Network - Operasyonel Mükemmeliyet.*
