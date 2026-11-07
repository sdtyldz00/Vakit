// Uygulama ikonu seçenekleri. Seçilen ikon, ana ekrana ekleme sırasında (özellikle iPhone'da) kullanılır.

export const IKONLAR = [
  { id: 'hilal', ad: 'Yeşil hilal' },
  { id: 'kubbe', ad: 'Cami' },
  { id: 'gece', ad: 'Gece' },
  { id: 'altin', ad: 'Altın' },
];

export function ikonBul(id) {
  return IKONLAR.find((k) => k.id === id) || IKONLAR[0];
}

// Sayfadaki ikon bağlantılarını seçilen ikona çevirir.
export function ikonUygula(id) {
  const k = ikonBul(id);
  const apple = document.querySelector('link[rel="apple-touch-icon"]');
  if (apple) apple.href = `icons/ikon-${k.id}-180.png`;
  const sekme = document.querySelector('link[rel="icon"]');
  if (sekme) sekme.href = `icons/ikon-${k.id}-192.png`;
  return k;
}
