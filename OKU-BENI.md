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

## Yeni özellikler (sürüm 2)

- **Günün duası ve ayeti**: Vakit ekranının altında. Dua uygulamanın içinden, ayet alquran.cloud'dan gelir (internet gerekir, günlük önbelleğe alınır). Ayetler ve duaların günlük sırası uygulama içinde sabit bir listeden döner.
- **Kıble pusulası**: Kıble sekmesi. Konumdan Kâbe yönü ve mesafe hesaplanır; "Pusulayı başlat" ile telefonun sensörü kullanılır. iPhone'da hareket/yön izni ister. Telefonu yere paralel tutun; birkaç derece sapma olabilir.
- **Konumumu bul (GPS)**: Ayarlar ▸ Konum. Koordinatla vakit çeker. İzin verilmezse şehir adı kullanılır.
- **Uygulama ikonu**: Ayarlar ▸ Uygulama ikonu (4 seçenek). Seçim ana ekrana ekleme sırasında kullanılır; eklenmiş uygulamanın ikonu sonradan değişmez, silip yeniden ekleyin.

## Güncelleme nasıl yapılır
GitHub'da repoya girin ▸ Add file ▸ Upload files ▸ bu klasördeki tüm dosyaları ve `icons` klasörünü sürükleyin ▸ Commit changes. Birkaç dakika sonra uygulamayı kapatıp açın (yeni sürüm bir sonraki açılışta gelir).

## Okumayı öğren (sürüm 3)
Kur'an sekmesi ▸ "Okumayı öğren": 28 harf (dokununca adını sesli okur, başta/ortada/sonda biçimleri, "öğrendim" işareti), harekeler (üstün, esre, ötre, cezm, şedde, tenvin, med), namaz sureleri (Fâtiha, İhlâs, Felak, Nâs, Kevser, Asr: Arapça + okunuş + anlam) ve 10 soruluk sınav.
- Harf sesleri uygulamanın içindedir (`ses/harf/`), internet gerekmez. Kaynak: elsanussi-s-mneina/arabic-alphabet-audio-speller-html-js (MIT lisansı, `ses/harf/LICENSE.txt`). Kayıtlar harflerin adlarını okur.
- Hece, kelime ve ayet seslendirmesi yoktur. Ayetleri dinlemek için Kur'an ▸ Sureler kullanılır (internet gerekir).
- Sure metinleri ve okunuşları elle yazılmıştır; Kur'an ▸ Sureler ile ya da bir hocayla karşılaştırın.
- GitHub'a yüklerken yeni `ses` klasörünü de sürükleyin.
