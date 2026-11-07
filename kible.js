import { getSettings } from './lib.js';
import { el } from './ui.js';

// Kâbe'nin konumu
const KABE = { lat: 21.4225, lon: 39.8262 };
const YONLER = ['Kuzey', 'Kuzeydoğu', 'Doğu', 'Güneydoğu', 'Güney', 'Güneybatı', 'Batı', 'Kuzeybatı'];

const rad = (x) => (x * Math.PI) / 180;
const der = (x) => (x * 180) / Math.PI;

// Gerçek kuzeyden saat yönünde, bulunulan yerden Kâbe'ye olan yön (0-360 derece).
export function kibleAcisi(lat, lon) {
  const f1 = rad(lat);
  const f2 = rad(KABE.lat);
  const dl = rad(KABE.lon - lon);
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return (der(Math.atan2(y, x)) + 360) % 360;
}

// Kâbe'ye kuş uçuşu mesafe (km)
export function mesafeKm(lat, lon) {
  const R = 6371;
  const dLat = rad(KABE.lat - lat);
  const dLon = rad(KABE.lon - lon);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(rad(lat)) * Math.cos(rad(KABE.lat)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export function yonAdi(aci) {
  return YONLER[Math.round(aci / 45) % 8];
}

// İki yön arasındaki işaretli fark (-180..180)
export function yonFarki(hedef, yon) {
  return ((hedef - yon + 540) % 360) - 180;
}

async function kayitliKonum(ayarlar) {
  if (ayarlar.coords) return { lat: ayarlar.coords.lat, lon: ayarlar.coords.lon, kaynak: 'ayar' };
  const { kibleKonum } = await chrome.storage.local.get('kibleKonum');
  const k = kibleKonum;
  if (k && Number.isFinite(k.lat) && Number.isFinite(k.lon) && Math.abs(k.lat) <= 90 && Math.abs(k.lon) <= 180) {
    return { lat: k.lat, lon: k.lon, kaynak: 'kayit' };
  }
  return null;
}

export async function baslat(kap) {
  const ayarlar = await getSettings();
  let konum = await kayitliKonum(ayarlar);
  let kible = null;

  const bilgi = el('div', { class: 'kible-bilgi' });
  const durum = el('div', { class: 'kible-durum' });
  const mesaj = el('div', { class: 'not' });

  // Pusula: kadran gerçek kuzeye göre döner; kıble ibresi kadranın üzerinde sabit durur.
  const ibre = el('div', { class: 'kible-ibre' }, el('span', { class: 'kible-kabe', text: '🕋' }), el('span', { class: 'kible-cizgi' }));
  const kadran = el(
    'div',
    { class: 'pusula-kadran' },
    el('span', { class: 'pusula-etiket k', text: 'K' }),
    el('span', { class: 'pusula-etiket d', text: 'D' }),
    el('span', { class: 'pusula-etiket g', text: 'G' }),
    el('span', { class: 'pusula-etiket b', text: 'B' }),
    ibre,
  );
  const pusula = el('div', { class: 'pusula' }, el('div', { class: 'pusula-isaret' }), kadran);

  const baslatBtn = el('button', { type: 'button', text: 'Pusulayı başlat' });
  const konumBtn = el('button', { type: 'button', class: 'ikincil', text: '📍 Konumumu bul' });

  function kadranDondur(aci) {
    kadran.style.transform = `rotate(${(-aci).toFixed(1)}deg)`;
  }

  function hesapla() {
    if (!konum) {
      kible = null;
      bilgi.textContent = 'Kıble yönünü bulmak için konumunuz gerekli.';
      return;
    }
    kible = kibleAcisi(konum.lat, konum.lon);
    ibre.style.transform = `rotate(${kible.toFixed(1)}deg)`;
    const km = Math.round(mesafeKm(konum.lat, konum.lon)).toLocaleString('tr-TR');
    bilgi.textContent = `Kıble: ${Math.round(kible)}° (${yonAdi(kible)}) · Kâbe'ye ${km} km`;
  }

  let yonSuz = null;
  let sonOlay = 0;

  function olayIsle(e) {
    if (kap.hidden) return;
    let h = null;
    if (typeof e.webkitCompassHeading === 'number' && !Number.isNaN(e.webkitCompassHeading)) {
      h = e.webkitCompassHeading; // iPhone: kuzeyden saat yönünde
    } else if (e.alpha != null && (e.absolute || e.type === 'deviceorientationabsolute')) {
      h = (360 - e.alpha) % 360; // Android: alfa saat yönünün tersine ölçülür
    }
    if (h === null) return;
    sonOlay = Date.now();
    // Titremeyi azaltmak için dairesel yumuşatma
    if (yonSuz === null) yonSuz = h;
    else yonSuz = (yonSuz + yonFarki(h, yonSuz) * 0.25 + 360) % 360;
    kadranDondur(yonSuz);

    if (kible !== null) {
      const fark = yonFarki(kible, yonSuz);
      const hizali = Math.abs(fark) <= 4;
      pusula.classList.toggle('hizali', hizali);
      durum.textContent = hizali
        ? 'Kıble yönündesiniz ✓'
        : `Telefonu ${fark > 0 ? 'sağa' : 'sola'} çevirin (${Math.abs(Math.round(fark))}°)`;
    }
  }

  let dinleniyor = false;
  async function pusulaBaslat() {
    if (dinleniyor) return;
    mesaj.textContent = '';
    try {
      // iPhone sensör izni ister (kullanıcı dokunuşuyla istenmeli)
      if (typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
        const sonuc = await DeviceOrientationEvent.requestPermission();
        if (sonuc !== 'granted') {
          mesaj.textContent = 'Pusula izni verilmedi. Ayarlar ▸ Safari ▸ “Hareket ve Yön Erişimi”ni açıp tekrar deneyin.';
          return;
        }
      }
    } catch {
      mesaj.textContent = 'Pusula izni alınamadı.';
      return;
    }
    const olay = 'ondeviceorientationabsolute' in window ? 'deviceorientationabsolute' : 'deviceorientation';
    window.addEventListener(olay, olayIsle, true);
    dinleniyor = true;
    baslatBtn.hidden = true;
    durum.textContent = 'Pusula çalışıyor… Telefonu yatay tutun.';
    setTimeout(() => {
      if (!sonOlay) {
        mesaj.textContent = 'Bu cihazdan pusula verisi gelmiyor. Yukarıda yazan dereceyi (kuzeyden saat yönünde) bir pusulayla kullanabilirsiniz.';
        durum.textContent = '';
      }
    }, 3000);
  }

  baslatBtn.addEventListener('click', pusulaBaslat);

  konumBtn.addEventListener('click', () => {
    if (!navigator.geolocation) { mesaj.textContent = 'Bu cihaz konum özelliğini desteklemiyor.'; return; }
    mesaj.textContent = 'Konum alınıyor…';
    navigator.geolocation.getCurrentPosition(
      async (p) => {
        konum = { lat: Math.round(p.coords.latitude * 1000) / 1000, lon: Math.round(p.coords.longitude * 1000) / 1000, kaynak: 'kayit' };
        await chrome.storage.local.set({ kibleKonum: { lat: konum.lat, lon: konum.lon } });
        mesaj.textContent = '';
        hesapla();
        konumBtn.hidden = true;
      },
      (hata) => {
        mesaj.textContent = hata && hata.code === 1
          ? 'Konum izni verilmedi. İzin verip tekrar deneyin.'
          : 'Konum alınamadı. Tekrar deneyin.';
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 },
    );
  });

  kap.replaceChildren(
    bilgi,
    pusula,
    durum,
    el('div', { class: 'satir ara' }, baslatBtn, konumBtn),
    mesaj,
    el('div', {
      class: 'not',
      text: 'Telefonu yere paralel tutun, metal ve mıknatıstan uzak durun. Pusula bir miktar hata yapabilir (birkaç derece); emin olmak için sekiz çizerek kalibre edin. Kâbe simgesi üstteki işaretle hizalanınca kıble yönündesiniz.',
    }),
  );
  konumBtn.hidden = Boolean(konum);
  hesapla();
}
