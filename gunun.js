// Ana ekrandaki "Günün ayeti" ve "Günün duası" kartları.
import { getSettings } from './lib.js';
import { guvenliJson } from './guvenlik.js';
import { DUALAR } from './dua-verisi.js';
import { el } from './ui.js';

const API = 'https://api.alquran.cloud/v1';

// Teselli, şükür, sabır ve tevekkül üzerine kısa ayetler (sure:ayet). Günlük sırayla döner.
const AYETLER = [
  '94:5', '2:152', '2:153', '13:28', '39:53', '3:139', '93:3', '93:5', '16:128', '33:41',
  '14:7', '65:3', '2:186', '57:4', '50:16', '12:87', '2:195', '3:159', '94:6', '2:45',
];

// Günlük okunmaya uygun genel dualar (uygulama notu gerektiren, sadece belirli yerde okunanlar dışarıda).
const DUA_IDLERI = [
  'ilim-artir', 'dunya-ahiret', 'kalp-sebat', 'la-tuzig', 'huda-tuka', 'kabul', 'tevbe', 'anne-baba',
  'anne-baba-mu', 'aile', 'yunus', 'hasbunallah', 'sabir', 'afiyet-beden', 'afve-afiye', 'rusd',
  'hayirli-is', 'rizik-helal', 'ya-hayyu', 'ilim-fayda', 'rabbisrah',
];

const AYET_DESEN = /^\d{1,3}:\d{1,3}$/;
const ED_DESEN = /^[a-z0-9._-]{3,40}$/i;

export function gunNumarasi(d) {
  return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(d.getFullYear(), 0, 0)) / 86400000);
}

export function gununAyetReferansi(d) {
  return AYETLER[gunNumarasi(d) % AYETLER.length];
}

export function gununDuasi(d) {
  const secili = DUA_IDLERI[gunNumarasi(d) % DUA_IDLERI.length];
  return DUALAR.find((x) => x.id === secili) || null;
}

const iki = (n) => String(n).padStart(2, '0');
const tarihAnahtari = (d) => `${d.getFullYear()}-${iki(d.getMonth() + 1)}-${iki(d.getDate())}`;

async function ayetGetir(ref, meal) {
  if (!AYET_DESEN.test(ref) || !ED_DESEN.test(meal)) throw new Error('Geçersiz ayet isteği.');
  const [arapca, turkce] = await Promise.all([
    guvenliJson(`${API}/ayah/${ref}/quran-uthmani`),
    guvenliJson(`${API}/ayah/${ref}/${meal}`),
  ]);
  const a = arapca && arapca.data;
  const t = turkce && turkce.data;
  if (!a || typeof a.text !== 'string' || !t || typeof t.text !== 'string') throw new Error('Ayet alınamadı.');
  const sure = a.surah || {};
  return {
    ref,
    ar: a.text,
    meal: t.text,
    sure: Number.isInteger(sure.number) ? sure.number : Number(ref.split(':')[0]),
    ad: String(sure.englishName ?? ''),
    no: Number.isInteger(a.numberInSurah) ? a.numberInSurah : Number(ref.split(':')[1]),
  };
}

async function gununAyeti(d, meal) {
  const gun = tarihAnahtari(d);
  const { gununAyetiOnbellek: o } = await chrome.storage.local.get('gununAyetiOnbellek');
  const ref = gununAyetReferansi(d);
  if (o && o.gun === gun && o.meal === meal && o.veri && o.veri.ref === ref) return o.veri;
  const veri = await ayetGetir(ref, meal);
  await chrome.storage.local.set({ gununAyetiOnbellek: { gun, meal, veri } });
  return veri;
}

function ayetKarti(kap, d, meal) {
  const govde = el('div', { class: 'not', text: 'Yükleniyor…' });
  const kart = el('div', { class: 'dua gunun-kart' }, el('div', { class: 'dua-ad', text: 'Günün ayeti' }), govde);
  kap.append(kart);

  async function yukle() {
    govde.className = 'not';
    govde.textContent = 'Yükleniyor…';
    try {
      const v = await gununAyeti(d, meal);
      govde.replaceChildren(
        el('div', { class: 'ar dua-ar', text: v.ar }),
        el('div', { class: 'esma-anlam', text: v.meal }),
        el('div', { class: 'dua-kaynak', text: `${v.ad ? v.ad + ' ' : ''}${v.sure}:${v.no} · Kaynak: alquran.cloud` }),
      );
      govde.className = '';
    } catch {
      govde.className = 'not';
      govde.replaceChildren(
        el('div', { text: 'Günün ayeti için internet bağlantısı gerekli.' }),
        el('button', { type: 'button', class: 'kucuk', text: 'Tekrar dene', onclick: yukle }),
      );
    }
  }
  yukle();
}

function duaKarti(kap, d) {
  const dua = gununDuasi(d);
  if (!dua) return;
  kap.append(
    el(
      'div',
      { class: 'dua gunun-kart' },
      el('div', { class: 'dua-ad', text: 'Günün duası' }),
      el('div', { class: 'esma-okunus', text: dua.ad }),
      el('div', { class: 'ar dua-ar', text: dua.ar }),
      el('div', { class: 'esma-okunus', text: dua.okunus }),
      el('div', { class: 'esma-anlam', text: dua.anlam }),
      dua.kaynak ? el('div', { class: 'dua-kaynak', text: `Kaynak: ${dua.kaynak}` }) : null,
      el('button', {
        type: 'button',
        class: 'kucuk gunun-tum',
        text: 'Tüm dualar',
        onclick: () => document.dispatchEvent(new CustomEvent('sekme-ac', { detail: 'dua' })),
      }),
    ),
  );
}

export async function baslat(kap) {
  const ayarlar = await getSettings();
  const bugun = new Date();
  kap.replaceChildren();
  duaKarti(kap, bugun);
  ayetKarti(kap, bugun, ayarlar.kuran.meal);
}
