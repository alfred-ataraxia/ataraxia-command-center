# Home Assistant Sistem Kurulumu ve Modern Dashboard Tasarımı (Best Practices)

**Hazırlayan:** Robin (Research & Intelligence Agent)
**Sunulan:** Master Sefa

Bu rapor, akıllı ev sistemlerinin merkezi olan Home Assistant (HA) için en iyi sistem kurulum uygulamalarını, modern bir dashboard'un nasıl tasarlanması gerektiğini (UI/UX prensipleri), kullanılması gereken eklenti/kartları ve sektörde kabul görmüş otomasyon kurgularını içermektedir.

---

## 1. Modern ve Kullanışlı Dashboard Tasarımı: UI/UX Prensipleri

Akıllı ev kontrol panellerinin temel amacı, kullanıcının bilişsel yükünü (cognitive load) en aza indirmek ve en sık kullanılan işlemleri 1-2 dokunuş mesafesinde tutmaktır.

*   **Minimalizm ve Sadelik (Clutter-Free):** Dashboard'da sadece o an gerekli olan bilgiler gösterilmelidir. "Her şeyi tek ekrana sığdırma" hatasından kaçınılmalıdır. Conditional (Koşullu) kartlar kullanılarak, sadece bir cihaz açıkken veya bir sorun olduğunda (örn. çamaşır makinesi bittiğinde, nem oranı yükseldiğinde) ilgili kartın görünmesi sağlanmalıdır.
*   **Hiyerarşi ve Navigasyon (Room-based vs Function-based):** 
    *   **Ana Ekran (Home):** Tüm evin genel özeti. Aktif cihazların sayısı, hava durumu, kritik uyarılar ve genel modlar (Evde/Dışarıda/Gece).
    *   **Alt Sekmeler:** Odalara göre (Salon, Yatak Odası) veya işlevlere göre (Işıklar, İklimlendirme, Güvenlik) ayrılmış görünümler. Mobil cihazlar için kaydırmalı (swipe) veya alt bar navigasyonu tercih edilmelidir.
*   **Mobil Odaklı Tasarım (Mobile-First):** Dashboard'ların %80'i telefonlardan kontrol edilir. Bu nedenle tasarım öncelikle dikey ekranlara (mobil) göre yapılmalı, tablet ve kiosk ekranlar (duvar panelleri) için `layout-card` gibi eklentilerle "Adaptive" (uyarlanabilir) tasarımlar geliştirilmelidir.
*   **Renk, İkonografi ve Tutarlılık:** Göz yormayan, cihaz durumunu net gösteren ikonlar ve renkler kullanılmalıdır (örn. açık ışıklar için sarı, kapalılar için gri). Gece/Gündüz (Dark/Light) modlarının ikisini de destekleyen temalar seçilmelidir.

---

## 2. Gerekli Eklentiler ve Kartlar (Frontend Stack)

Modern ve estetik bir Home Assistant arayüzü elde etmek için varsayılan (default) görünümlerden ziyade topluluk tarafından geliştirilen eklentiler standart haline gelmiştir.

### Mushroom Cards
Son yılların tartışmasız en popüler UI eklentisidir. Behance (7ahang) tasarımlarından ilham alarak geliştirilmiştir.
*   **Avantajı:** Kurulumu ve yapılandırması arayüz (UI) üzerinden çok kolaydır. Karmaşık YAML kodları yazmaya gerek kalmadan yuvarlak hatlı, modern, renkli ve minimalist kartlar sunar.
*   **Kullanım:** Işık, fan, kişi, alarm ve medya oynatıcı gibi temel öğeler için kendi özel kartları vardır. "Template Card" ile tamamen özelleştirilebilir.

### UI Lovelace Minimalist
Mushroom'un atası sayılan, çok daha esnek fakat yapılandırması zor olan bir temadır.
*   **Avantajı:** "Behance" stili arayüzün orijinal halidir. Özel componentler ile çok kompleks kartlar tek bir YAML satırıyla çağrılabilir.
*   **Dezavantajı:** Yönetimi genellikle YAML üzerinden yapılır, bakım maliyeti Mushroom'a göre daha yüksektir.

### Kiosk Mode
Duvara monte tabletler (Wall Panels) veya her zaman açık kalması gereken kontrol ekranları için kritik bir eklentidir.
*   **İşlevi:** Home Assistant'ın üst (header) ve yan (sidebar) menülerini gizleyerek uygulamanın tam ekran bir smart panel gibi görünmesini sağlar. Kullanıcıya (örn. sadece "Tablet" kullanıcısına) göre spesifik gizleme kuralları yazılabilir.

### Yardımcı Kartlar ve Modüller
*   **Layout-Card:** Masonry düzeni yerine CSS Grid sistemini getirerek tablet ve mobil tasarımları birbirinden bağımsız ve kusursuz dizayn etmeyi sağlar.
*   **Bubble Card / Swipe Card:** Özellikle mobil görünümlerde pop-up menüler (Bubble) ve kaydırılabilir kart grupları (Swipe) oluşturarak ekrandan tasarruf sağlar.

---

## 3. Sektördeki En İyi Otomasyon Kurguları (Best Practices)

İyi bir akıllı ev, kullanıcının müdahalesine gerek kalmadan arka planda kendi kendine çalışan evdir. Modern otomasyon mimarilerinde şu kurgular öne çıkar:

### A. Varlık Algılama (Presence Detection 2.0)
Geleneksel PIR (hareket) sensörlerinin en büyük sorunu, insan sabit durduğunda (koltukta kitap okurken, çalışırken) ışıkları kapatmasıdır.
*   **Kurgu:** **mmWave Radar Sensörleri** (örn. ESPresence, Aqara FP2) ile mikro hareketler (nefes alma dahil) algılanarak gerçek "Oda Varlığı" (Room Presence) tespit edilir.
*   **Wasp in a Box (Kutudaki Arı) Mantığı:** Kapı sensörleri ve hareket sensörleri harmanlanarak bir odanın dolu olup olmadığı kesin olarak hesaplanır. Kapı açılmadığı sürece odadaki varlık durumu "dolu" olarak kilitlenir.

### B. Enerji Tasarrufu ve Verimlilik
*   **Hayalet Tüketim Engelleme:** Ev "Dışarıda" (Away) moduna geçtiğinde veya gece "Uyku" modunda iken, standby modunda elektrik çeken cihazların (TV, eğlence sistemleri, kahve makinesi) akıllı prizlerle tamamen kapatılması.
*   **Dinamik İklimlendirme:** Cam veya kapı açıkken (kapı sensörü ile tespit) klimanın veya kombinin otomatik olarak duraklatılması (örn. 2 dakika açık kalırsa).
*   **Gün Işığı Hasadı (Daylight Harvesting):** Işık sensörleri (Illuminance) kullanılarak, odanın doğal ışığı yeterliyse hareket olsa bile ışıkların yakılmaması veya ışık şiddetinin (dim) dışarıdaki hava durumuna göre ayarlanması.

### C. Gelişmiş Sabah ve Gece Rutinleri
*   **Sabah Rutini (Wake-up Light):** Alarm saatinden 30 dakika önce yatak odası ışıklarının %1'den %100'e yavaşça (fade-in) sıcak tonlarda açılması. Alarm çaldığında hava durumuna göre panjurların/perdelerin açılması ve sabah kahvesi için mutfak aletlerinin enerjilendirilmesi.
*   **Gece Rutini (Good Night):** "İyi Geceler" butonuna basıldığında veya yatağa yatıldığında (yatak basınç sensörü vb. ile tespit edildiğinde): Tüm ışıkların ve medyanın kapanması, dış kapı kilitlerinin (akıllı kilit) kontrol edilmesi/kilitlenmesi, alarm sisteminin "Gece" modunda kurulması ve varsa robot süpürgenin şarja dönmesi.

### D. Otomasyon Yönetim Prensipleri
*   **Modülerlik:** Bir otomasyon içine her şeyi yığmak yerine, otomasyonları modüler tutmak (örn. "Hareket Algılandığında Işığı Yak" ayrı, "Hareket Bittiğinde Işığı Kapat" ayrı veya Blueprint kullanarak standartlaştırmak).
*   **Node-RED vs. Native HA:** Native HA otomasyonları son yıllarda (Trace özelliği ve arayüz geliştirmeleri ile) çok güçlenmiştir. Çok karmaşık dallanmalar (branching) gerekmedikçe performans ve sadelik için Home Assistant'ın kendi otomasyon motoru tercih edilmelidir.

---

## Sonuç

Master Sefa için kurgulanacak en optimal sistem; **Mushroom Cards** ve **Layout-Card** kombinasyonu ile oluşturulmuş, mobil cihazlarda tek elle yönetilebilecek kadar sade, tablet/kiosk ekranlarda ise **Kiosk Mode** ile tüm ekranı kullanan bir arayüzdür. Otomasyon tarafında ise PIR sensörlerden **mmWave sensörlere** geçiş yapılıp, enerji odaklı ve "kullanıcı müdahalesi gerektirmeyen" akıllı rutinler inşa edilmelidir. Yüksek bakım maliyeti yaratacak karmaşık YAML tasarımlarından kaçınılmalı, UI üzerinden yönetilebilir eklentiler seçilmelidir.
