// Kullanıcının yüklediği ezan dosyasının yerel (IndexedDB) deposu. Hiçbir yere gönderilmez.

const DB_AD = 'vakit-ses';
const DEPO = 'ses';
const ANAHTAR = 'ezan';

function ac() {
  return new Promise((coz, red) => {
    const r = indexedDB.open(DB_AD, 1);
    r.onupgradeneeded = () => r.result.createObjectStore(DEPO);
    r.onsuccess = () => coz(r.result);
    r.onerror = () => red(r.error);
  });
}

async function islem(mod, calistir) {
  const db = await ac();
  try {
    return await new Promise((coz, red) => {
      const tx = db.transaction(DEPO, mod);
      const istek = calistir(tx.objectStore(DEPO));
      tx.oncomplete = () => coz(istek ? istek.result : undefined);
      tx.onerror = () => red(tx.error);
      tx.onabort = () => red(tx.error);
    });
  } finally {
    db.close();
  }
}

export const sesKaydet = (blob) => islem('readwrite', (d) => d.put(blob, ANAHTAR));
export const sesGetir = () => islem('readonly', (d) => d.get(ANAHTAR));
export const sesSil = () => islem('readwrite', (d) => d.delete(ANAHTAR));
