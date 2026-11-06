// Tarayıcı uyarlayıcısı: uzantı kodunun kullandığı chrome.storage ve chrome.runtime çağrılarını
// telefon uygulamasında localStorage ve basit bir mesaj kanalına bağlar. Böylece ortak modüller aynen çalışır.

const ON = 'vakit:';
const dinleyiciler = new Set();

function tumAnahtarlar() {
  const sonuc = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(ON)) sonuc.push(k.slice(ON.length));
    }
  } catch {
    // depolama kapalı olabilir
  }
  return sonuc;
}

function oku(anahtar) {
  try {
    const ham = localStorage.getItem(ON + anahtar);
    return ham === null ? undefined : JSON.parse(ham);
  } catch {
    return undefined;
  }
}

const local = {
  async get(anahtarlar) {
    const varsayilan = anahtarlar && typeof anahtarlar === 'object' && !Array.isArray(anahtarlar) ? anahtarlar : null;
    let liste;
    if (anahtarlar === null || anahtarlar === undefined) liste = tumAnahtarlar();
    else if (typeof anahtarlar === 'string') liste = [anahtarlar];
    else if (Array.isArray(anahtarlar)) liste = anahtarlar;
    else liste = Object.keys(anahtarlar);
    const cikti = {};
    for (const k of liste) {
      const v = oku(k);
      if (v !== undefined) cikti[k] = v;
      else if (varsayilan && k in varsayilan) cikti[k] = varsayilan[k];
    }
    return cikti;
  },
  async set(nesne) {
    for (const [k, v] of Object.entries(nesne)) {
      try {
        localStorage.setItem(ON + k, JSON.stringify(v));
      } catch {
        throw new Error('Veri kaydedilemedi (depolama dolu ya da kapalı).');
      }
    }
  },
  async remove(anahtarlar) {
    for (const k of Array.isArray(anahtarlar) ? anahtarlar : [anahtarlar]) {
      try {
        localStorage.removeItem(ON + k);
      } catch {
        // yok say
      }
    }
  },
};

const uyarlayici = {
  storage: { local },
  runtime: {
    id: 'vakit-pwa',
    async sendMessage(mesaj) {
      for (const f of dinleyiciler) f(mesaj);
    },
  },
};

Object.defineProperty(globalThis, 'chrome', { value: uyarlayici, configurable: true, writable: true });

export function mesajDinle(f) {
  dinleyiciler.add(f);
}
