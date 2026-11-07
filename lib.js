// Ortak mantık: ayarlar, vakit çekme, önbellek, sıradaki vakti bulma.
import { guvenliJson, temizMetin, sinirla } from './guvenlik.js';
import { hicriTarih } from './hicri.js';

export { HICRI_AYLAR, hicriMetin } from './hicri.js';

export const VAKITLER = [
  { key: 'imsak', ad: 'İmsak', api: 'Imsak' },
  { key: 'sabah', ad: 'Sabah', api: 'Fajr' },
  { key: 'gunes', ad: 'Güneş', api: 'Sunrise' },
  { key: 'ogle', ad: 'Öğle', api: 'Dhuhr' },
  { key: 'ikindi', ad: 'İkindi', api: 'Asr' },
  { key: 'aksam', ad: 'Akşam', api: 'Maghrib' },
  { key: 'yatsi', ad: 'Yatsı', api: 'Isha' },
];

export const AYLAR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];
export const GUNLER = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

export const DEFAULTS = {
  address: 'Gebze, Kocaeli, Turkey',
  coords: null, // GPS ile bulunan konum: { lat, lon }
  hijriAdj: 0,
  hanefi: false,
  offsets: {},
  notify: { imsak: true, sabah: true, gunes: true, ogle: true, ikindi: true, aksam: true, yatsi: true },
  ezan: {
    vakitler: { imsak: false, sabah: true, gunes: false, ogle: true, ikindi: true, aksam: true, yatsi: true },
    ses: 0.8,
  },
  kuran: { sure: 1, meal: 'tr.diyanet' },
};

// Enlem/boylamı doğrular; geçersizse null döner. 3 basamağa yuvarlanır (yaklaşık 100 m).
function temizKoordinat(c) {
  if (!c || typeof c !== 'object' || c.lat == null || c.lon == null) return null;
  const lat = Number(c.lat);
  const lon = Number(c.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  return { lat: Math.round(lat * 1000) / 1000, lon: Math.round(lon * 1000) / 1000 };
}

// Depodan gelen ya da kullanıcıdan alınan ayarları doğrular; bozuk değerleri düzeltir.
export function temizleAyarlar(ham) {
  const k = ham && typeof ham === 'object' ? ham : {};
  const out = {
    address: temizMetin(k.address, 100) || DEFAULTS.address,
    coords: temizKoordinat(k.coords),
    hijriAdj: sinirla(k.hijriAdj, -3, 3),
    hanefi: Boolean(k.hanefi),
    offsets: {},
    notify: {},
    ezan: { vakitler: {}, ses: DEFAULTS.ezan.ses },
    kuran: { sure: sinirla(k.kuran?.sure ?? 1, 1, 114), meal: DEFAULTS.kuran.meal },
  };
  for (const v of VAKITLER) {
    out.offsets[v.key] = sinirla(k.offsets?.[v.key], -30, 30);
    const n = k.notify?.[v.key];
    out.notify[v.key] = n === undefined ? DEFAULTS.notify[v.key] : Boolean(n);
    const e = k.ezan?.vakitler?.[v.key];
    out.ezan.vakitler[v.key] = e === undefined ? DEFAULTS.ezan.vakitler[v.key] : Boolean(e);
  }
  const ses = Number(k.ezan?.ses);
  if (Number.isFinite(ses)) out.ezan.ses = Math.min(1, Math.max(0, ses));
  const meal = String(k.kuran?.meal ?? '');
  if (/^[a-z0-9._-]{3,40}$/i.test(meal)) out.kuran.meal = meal;
  if (out.kuran.sure < 1) out.kuran.sure = 1;
  return out;
}

export async function getSettings() {
  const { ayarlar } = await chrome.storage.local.get('ayarlar');
  return temizleAyarlar(ayarlar);
}

export async function saveSettings(s) {
  await chrome.storage.local.set({ ayarlar: temizleAyarlar(s) });
}

const pad = (n) => String(n).padStart(2, '0');

export function dateStr(d) {
  return `${pad(d.getDate())}-${pad(d.getMonth() + 1)}-${d.getFullYear()}`;
}

export function addDays(d, n) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n, 12, 0, 0);
}

export function vakitAdi(v, date) {
  return v.key === 'ogle' && date.getDay() === 5 ? 'Cuma' : v.ad;
}

// Belirli bir günün vakitlerini getirir (önbellekli, doğrulamalı).
export async function fetchDay(d, settings) {
  const ds = dateStr(d);
  const konum = settings.coords ? `${settings.coords.lat},${settings.coords.lon}` : settings.address;
  const key = `gun2|${konum}|${settings.hanefi ? 1 : 0}|${ds}`;
  const cached = await chrome.storage.local.get(key);
  if (cached[key]) return cached[key];

  const okul = settings.hanefi ? 1 : 0;
  let url;
  if (settings.coords) {
    // GPS konumu: saat dilimi olarak cihazın dilimi verilir, böylece vakitler telefonun saatine göre gelir.
    let dilim = '';
    try { dilim = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch { dilim = ''; }
    url =
      `https://api.aladhan.com/v1/timings/${ds}` +
      `?latitude=${settings.coords.lat}&longitude=${settings.coords.lon}&method=13&school=${okul}` +
      (dilim ? `&timezonestring=${encodeURIComponent(dilim)}` : '');
  } else {
    url =
      `https://api.aladhan.com/v1/timingsByAddress/${ds}` +
      `?address=${encodeURIComponent(settings.address)}&method=13&school=${okul}`;
  }
  const j = await guvenliJson(url);
  if (!j || j.code !== 200 || !j.data || typeof j.data.timings !== 'object') {
    throw new Error('Vakitler alınamadı. Konum adını kontrol edin.');
  }

  const times = {};
  for (const v of VAKITLER) {
    const m = /^(\d{1,2}):(\d{2})/.exec(String(j.data.timings[v.api] ?? ''));
    if (!m || Number(m[1]) > 23 || Number(m[2]) > 59) {
      throw new Error('Vakit verisi beklenmedik biçimde geldi.');
    }
    times[v.key] = `${pad(Number(m[1]))}:${m[2]}`;
  }

  const out = { times };
  await chrome.storage.local.set({ [key]: out });
  pruneCache(d);
  return out;
}

// Eski günlerin ve eski sürümün önbelleğini temizler.
async function pruneCache(today) {
  const all = await chrome.storage.local.get(null);
  const t0 = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const sil = [];
  for (const k of Object.keys(all)) {
    if (k.startsWith('gun|')) {
      sil.push(k);
    } else if (k.startsWith('gun2|')) {
      const [dd, mm, yy] = k.split('|').pop().split('-').map(Number);
      if (new Date(yy, mm - 1, dd).getTime() < t0 - 86400000) sil.push(k);
    }
  }
  if (sil.length) await chrome.storage.local.remove(sil);
}

function buildList(d, data, settings) {
  return VAKITLER.map((v) => {
    const [h, m] = data.times[v.key].split(':').map(Number);
    const off = Number(settings.offsets[v.key] || 0);
    const date = new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m + off, 0);
    return { key: v.key, ad: vakitAdi(v, d), date };
  });
}

// Şu anki durum: günün listesi, içinde bulunulan vakit ve sıradaki vakit.
export async function getState(now, settings) {
  const today = await fetchDay(now, settings);
  const list = buildList(now, today, settings);

  let next = list.find((v) => v.date > now);
  if (!next) {
    const tm = addDays(now, 1);
    next = buildList(tm, await fetchDay(tm, settings), settings)[0];
  }

  let current = null;
  for (const v of list) if (v.date <= now) current = v;
  if (!current) {
    const yd = addDays(now, -1);
    const yl = buildList(yd, await fetchDay(yd, settings), settings);
    current = yl[yl.length - 1];
  }

  return { now, list, current, next, hijri: hicriTarih(now, settings.hijriAdj) };
}

export function formatHMS(ms) {
  const s = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${pad(m)}:${pad(sec)}`;
}

export function formatHM(d) {
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function miladiMetin(d) {
  return `${d.getDate()} ${AYLAR[d.getMonth()]} ${d.getFullYear()} ${GUNLER[d.getDay()]}`;
}
