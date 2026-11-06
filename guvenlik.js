// Güvenlik yardımcıları: ağ istekleri yalnızca izinli adreslere gider,
// gelen veri doğrulanır, kullanıcı girdisi temizlenir.

const IZINLI_HOSTLAR = new Set(['api.aladhan.com', 'api.alquran.cloud']);
const MAKS_BOYUT = 5 * 1024 * 1024; // 5 MB

function izinliMi(adres) {
  return adres.protocol === 'https:' && IZINLI_HOSTLAR.has(adres.hostname);
}

// Yalnızca https ve izinli sunuculara, zaman aşımı ve boyut sınırıyla JSON isteği yapar.
export async function guvenliJson(url, zamanAsimi = 10000) {
  let adres;
  try {
    adres = new URL(url);
  } catch {
    throw new Error('Geçersiz adres.');
  }
  if (!izinliMi(adres)) throw new Error('İzin verilmeyen adres engellendi.');

  const ctrl = new AbortController();
  const sayac = setTimeout(() => ctrl.abort(), zamanAsimi);
  try {
    const r = await fetch(adres.href, {
      signal: ctrl.signal,
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
    });
    // Yönlendirme sonrası da izinli sunucuda mıyız?
    if (r.url && !izinliMi(new URL(r.url))) throw new Error('İzin verilmeyen yönlendirme engellendi.');
    if (!r.ok) throw new Error(`Sunucu hata verdi (${r.status}).`);
    const uzunluk = Number(r.headers.get('content-length') || 0);
    if (uzunluk > MAKS_BOYUT) throw new Error('Yanıt çok büyük, reddedildi.');
    const metin = await r.text();
    if (metin.length > MAKS_BOYUT) throw new Error('Yanıt çok büyük, reddedildi.');
    try {
      return JSON.parse(metin);
    } catch {
      throw new Error('Sunucudan beklenmeyen bir yanıt geldi.');
    }
  } catch (e) {
    if (e && e.name === 'AbortError') throw new Error('Sunucu zamanında yanıt vermedi.');
    throw e;
  } finally {
    clearTimeout(sayac);
  }
}

// Serbest metni temizler: kontrol karakterlerini ve < > işaretlerini atar, uzunluğu sınırlar.
export function temizMetin(s, maks = 100) {
  return String(s ?? '')
    .replace(/[\u0000-\u001f\u007f<>]/g, '')
    .trim()
    .slice(0, maks);
}

// Sayıyı tam sayıya çevirip [min, max] aralığına sıkıştırır.
export function sinirla(n, min, max) {
  const x = Math.trunc(Number(n));
  return Math.min(max, Math.max(min, Number.isFinite(x) ? x : 0));
}
