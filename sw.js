// Servis çalışanı: uygulamayı çevrimdışı açar ve bildirime tıklanınca uygulamayı öne getirir.
// Yalnızca kendi dosyalarını önbelleğe alır; API ve ses istekleri ağdan gider.

const SURUM = 'vakit-v2';
// Uygulamanın çalışması için şart olan dosyalar: biri bile eksikse kurulum başarısız olur.
const DOSYALAR = [
  './', 'index.html', 'app.css', 'app.js', 'platform.js', 'lib.js', 'guvenlik.js', 'hicri.js', 'ses.js', 'ui.js',
  'takvim.js', 'esma.js', 'esma-verisi.js', 'zikir.js', 'zikir-verisi.js', 'zikirEsma.js', 'kuran.js', 'dua.js',
  'dua-verisi.js', 'ayarlar.js', 'kible.js', 'gunun.js', 'ikonlar.js', 'manifest.webmanifest',
];

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
        await Promise.all(IKONLAR.map((f) => c.add(f).catch(() => {})));
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
      if (kayitli) return kayitli;
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
