// Servis çalışanı: uygulamayı çevrimdışı açar ve bildirime tıklanınca uygulamayı öne getirir.
// Yalnızca kendi dosyalarını önbelleğe alır; API ve ses istekleri ağdan gider.

const SURUM = 'vakit-v3';
// Uygulamanın çalışması için şart olan dosyalar: biri bile eksikse kurulum başarısız olur.
const DOSYALAR = [
  './', 'index.html', 'app.css', 'app.js', 'platform.js', 'lib.js', 'guvenlik.js', 'hicri.js', 'ses.js', 'ui.js',
  'takvim.js', 'esma.js', 'esma-verisi.js', 'zikir.js', 'zikir-verisi.js', 'zikirEsma.js', 'kuran.js', 'dua.js',
  'dua-verisi.js', 'ayarlar.js', 'kible.js', 'gunun.js', 'ikonlar.js', 'kuranSekme.js', 'ogren.js', 'ogren-verisi.js', 'manifest.webmanifest',
];

// Harf sesleri (çevrimdışı çalışsın diye önbelleğe alınır; eksik olsa da uygulama kurulur).
const SESLER = ['0627', '0628', '062A', '062B', '062C', '062D', '062E', '062F', '0630', '0631', '0632', '0633', '0634', '0635', '0636', '0637', '0638', '0639', '063A', '0641', '0642', '0643', '0644', '0645', '0646', '0647', '0648', '064A'].map((k) => `ses/harf/${k}.mp3`);

// İkonlar isteğe bağlıdır: yüklenmemiş olsalar bile uygulama kurulur ve çalışır.
const IKONLAR = [
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/maskable-512.png', 'icons/apple-touch-icon.png',
  'icons/ikon-hilal-180.png', 'icons/ikon-hilal-192.png', 'icons/ikon-kubbe-180.png', 'icons/ikon-kubbe-192.png',
  'icons/ikon-gece-180.png', 'icons/ikon-gece-192.png', 'icons/ikon-altin-180.png', 'icons/ikon-altin-192.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(SURUM)
      .then(async (c) => {
        await c.addAll(DOSYALAR);
        await Promise.all([...IKONLAR, ...SESLER].map((f) => c.add(f).catch(() => {})));
      })
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((anahtarlar) => Promise.all(anahtarlar.filter((k) => k !== SURUM).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Safari ses/video dosyalarını parça parça (Range) ister; önbellekteki dosyadan 206 yanıtı üretir.
async function aralikYaniti(yanit, aralik) {
  const m = /^bytes=(\d*)-(\d*)$/.exec(aralik);
  if (!m || (m[1] === '' && m[2] === '')) return yanit;
  const govde = await yanit.clone().arrayBuffer();
  const toplam = govde.byteLength;
  let bas;
  let son;
  if (m[1] === '') { bas = Math.max(0, toplam - Number(m[2])); son = toplam - 1; }
  else { bas = Number(m[1]); son = m[2] === '' ? toplam - 1 : Math.min(Number(m[2]), toplam - 1); }
  if (bas > son || bas >= toplam) {
    return new Response(null, { status: 416, headers: { 'Content-Range': `bytes */${toplam}` } });
  }
  return new Response(govde.slice(bas, son + 1), {
    status: 206,
    headers: {
      'Content-Type': yanit.headers.get('Content-Type') || 'audio/mpeg',
      'Content-Range': `bytes ${bas}-${son}/${toplam}`,
      'Content-Length': String(son - bas + 1),
    },
  });
}

// Önce önbellekten ver, arkada güncelle (bir sonraki açılışta yeni sürüm gelir).
self.addEventListener('fetch', (e) => {
  const istek = e.request;
  if (istek.method !== 'GET') return;
  const adres = new URL(istek.url);
  if (adres.origin !== self.location.origin) return;

  e.respondWith(
    caches.open(SURUM).then(async (cache) => {
      const kayitli = await cache.match(istek, { ignoreSearch: true });
      const ag = fetch(istek)
        .then((yanit) => {
          if (yanit && yanit.ok) cache.put(istek, yanit.clone());
          return yanit;
        })
        .catch(() => null);
      if (kayitli) {
        const aralik = istek.headers.get('range');
        return aralik ? aralikYaniti(kayitli, aralik) : kayitli;
      }
      const yanit = await ag;
      if (yanit) return yanit;
      if (istek.mode === 'navigate') return (await cache.match('index.html')) || Response.error();
      return Response.error();
    }),
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((liste) => {
      for (const c of liste) if ('focus' in c) return c.focus();
      return self.clients.openWindow('./');
    }),
  );
});
