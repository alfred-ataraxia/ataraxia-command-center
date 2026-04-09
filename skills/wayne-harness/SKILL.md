---
name: wayne-harness
description: Wayne Ağı meta-skill. Alfred'in Lucius/Netrunner/Robin alt-ajanlarını koordine eden harness. Gelen görevi analiz eder, doğru ajana yönlendirir, çıktıları konsolide eder. Tetikleyiciler: "lucius", "netrunner", "robin", "dispatch", "delegate", "ajan çağır".
role: orchestrator
scope: meta
output-format: structured
---

# Wayne Harness — Alt-Ajan Koordinasyon Meta-Skill

Alfred'in Wayne Ağı ekibini (Lucius / Netrunner / Robin) koordine eden harness katmanı.  
Görevi doğru ajana yönlendirir, prompt şablonunu oluşturur, çıktıyı konsolide eder.

---

## Ajan Yönlendirme Matrisi

| Tetikleyici Anahtar Kelimeler | Ajan | Model Önerisi |
|-------------------------------|------|---------------|
| kur, entegre et, araştır teknoloji, framework, API, yeni araç, fizibilite | **Lucius** | Sonnet (varsayılan) |
| tara, güvenlik, kontrol et, hardening, log, saldırı, API key rotasyon, sağlık | **Netrunner** | Haiku (yeterli çoğu analiz için) |
| araştır, rapor yaz, hazırla, analiz, sunum, strateji, e-posta taslağı | **Robin** | Sonnet (doküman kalitesi için) |

Belirsizlik varsa: Alfred önce görevi sınıflandırır, sonra dispatch eder.

---

## Çalışma Protokolü

### Adım 1 — Görev Analizi

Gelen görevi şu 3 boyutta değerlendir:

```
Boyut          | Soru
---------------|------------------------------------------
Konu           | Teknoloji mi? Güvenlik mi? Araştırma mı?
Çıktı türü     | Aksiyon? Rapor? Kod? Yapılandırma?
Aciliyet       | Anlık mı? Cron'a mı atar?
```

### Adım 2 — Ajan Seçimi

Kurallar:
- Tek bir net alan → tek ajan.
- Çakışan alan (ör: yeni güvenlik aracı) → önce Lucius keşfeder, sonra Netrunner doğrular.
- Birden fazla ajan gerekiyorsa → paralel başlat, çıktıları konsolide et.

### Adım 3 — Prompt Şablonu

Her alt-ajan çağrısında bu yapıyı kullan:

```
Sen [AJAN_ADI]'sun — [ROL_TANIMI].

## Görev
[GÖREV_AÇIKLAMASI]

## Bağlam
- Sistem: ataraxia (RPi 400, Debian Trixie, aarch64)
- Sprint: [AKTİF_SPRINT]
- İlgili dosyalar: [DOSYA_YOLLARI — varsa]

## Kısıtlar
- Çıktı Türkçe olacak.
- Yıkıcı komut öncesi onay al.
- Sonuçları [ÇIKTI_YOLU] dosyasına yaz.
- Alfred'e özet rapor dön.

## Beklenen Çıktı
[ÇIKTI_FORMATI — madde listesi / dosya / komut seti]
```

### Adım 4 — Çıktı Konsolidasyonu

Alt-ajan tamamladıktan sonra Alfred şunları yapar:
1. Çıktı dosyasını oku.
2. Ana bulguları ≤5 maddeyle özetle.
3. Gerekiyorsa TASKS.json'u güncelle.
4. Kritik bulgu varsa → Telegram bildirim taslağı hazırla, Sefa'ya sun.

---

## Hızlı Dispatch Komutları

Alfred kendi kendine veya Sefa tarafından tetiklenebilir:

```
# Lucius'a teknoloji görevi
wayne-harness dispatch lucius "Raspberry Pi için en iyi lokal LLM inference tool'u araştır, kaynakları kıyasla"

# Netrunner'a güvenlik taraması
wayne-harness dispatch netrunner "Pi-hole DNS sorgularında anormallik var mı? Son 24 saati tara"

# Robin'e araştırma görevi
wayne-harness dispatch robin "İş Bankası için AI governance framework raporu hazırla — BCG lens"

# Çoklu ajan (sıralı)
wayne-harness dispatch lucius+netrunner "WireGuard yeni peer ekleme — Lucius kur, Netrunner doğrula"
```

---

## Koordinasyon Kuralları

### Paralel vs Sıralı
- **Paralel:** Bağımsız görevler (ör: Lucius teknoloji araştırır, Robin aynı anda rapor yazar).
- **Sıralı:** Bir ajanın çıktısı diğerinin girdisi (ör: Lucius keşif → Netrunner doğrulama).

### Çakışma Önleme
- Her ajan kendi `workspace/[ajan_adı]/` dizinine yazar.
- Alfred merkezi koordinatördür; ajanlar doğrudan birbirini tetiklemez.

### Hata Yönetimi
- Ajan 3 denemede başarısız → Alfred'e eskalasyon.
- Alfred bildirim taslağı hazırlar, Sefa'ya sunar.
- Görev TASKS.json'da `blocked` olarak işaretlenir.

---

## Token & Maliyet Kuralları

| Durum | Model Seçimi |
|-------|-------------|
| Basit tarama / log analizi | Haiku (Netrunner) |
| Kod üretimi / entegrasyon | Sonnet (Lucius) |
| Uzun rapor / strateji | Sonnet (Robin) |
| Görev >$1 maliyet tahmini | Sefa onayı al |

---

## Çıktı Dizinleri

```
alfred-hub/command-center/
  workspace/
    lucius/     ← teknoloji raporları, entegrasyon notları
    netrunner/  ← güvenlik tarama raporları, sağlık logları
    robin/      ← araştırma raporları, strateji dokümanları
    consolidated/ ← Alfred'in birleştirilmiş çıktıları
```

---

## İlgili Belgeler

- `AGENTS.md` — Ajan rol tanımları ve sorumlulukları
- `SOUL.md` — Temel çalışma prensipleri ve maliyet kuralları
- `MODEL-ROUTING.md` — Model seçim kriterleri
- `GUARDRAILS.md` — Güvenlik kısıtları
