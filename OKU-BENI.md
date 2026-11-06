# Vakit – Telefon Uygulaması (PWA)

Android ve iPhone'da ana ekrana eklenen, tam ekran açılan, internetsiz de açılan bir web uygulamasıdır.
Uzantıyla aynı kodu kullanır: vakitler, ezan, takvim, dualar, Esmâ, zikir ve Kur'an.

## 1) Yayınlama (bir kez yapılır)
Uygulamanın telefona kurulabilmesi için dosyalar **HTTPS** bir adreste durmalıdır (servis çalışanı ve bildirim için şart).
Ücretsiz seçenekler: Netlify Drop (klasörü sürükle-bırak), GitHub Pages, Cloudflare Pages.
Bu klasörün **içindekileri** (index.html, app.js, sw.js, icons/ ...) sitenin ana dizinine koyun.

Yerelde denemek için: `python3 -m http.server 8000` ile bu klasörü sunup bilgisayarda http://localhost:8000 adresini açın.

## 2) Telefona kurma
- **Android (Chrome):** adresi açın → sayfadaki "Uygulamayı yükle" düğmesi ya da menü ▸ "Uygulamayı yükle / Ana ekrana ekle".
- **iPhone (Safari):** adresi açın → Paylaş ▸ "Ana Ekrana Ekle". (iPhone'da bildirimler yalnızca ana ekrana eklenen uygulamada çalışır.)

İlk açılışta "Bildirimleri aç" düğmesine basıp izin verin. Ezan için Ayarlar'dan kendi ses dosyanızı yükleyin.

## Sınırlar
- Bildirim ve ezan, uygulama açıkken ya da telefon uygulamayı arka planda canlı tuttuğu sürece çalışır. Uygulama tamamen kapatılınca web uygulamaları vakit hatırlatması yapamaz. Bunun için yerel (native) Android uygulaması gerekir.
- Ezan sesi, tarayıcının kuralı gereği ekrana en az bir kez dokunulmuş bir oturumda kendiliğinden çalar; çalmazsa "Ezanı çal" düğmesi çıkar.

## Güvenlik
- Katı İçerik Güvenlik Politikası: harici betik yok, `eval` yok, `innerHTML` yok.
- Ağ erişimi yalnızca api.aladhan.com, api.alquran.cloud ve cdn.islamic.network adreslerine, yalnızca https.
- Gelen veriler doğrulanır; ayarlar doğrulanarak okunur ve yazılır. Ezan dosyası yalnızca telefonda kalır.
- Kişisel veri toplanmaz. Konum adı yalnızca vakit hesabı için Aladhan'a gönderilir.

## Güncelleme
Dosyaları aynı adrese yeniden yükleyin. Uygulama bir sonraki açılışta yeni sürümü alır (gerekirse bir kez kapatıp açın).
Önbellek sürümünü sw.js içindeki `SURUM` değerini artırarak yenileyebilirsiniz.
