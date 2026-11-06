import { getSettings, saveSettings } from './lib.js';
import { guvenliJson } from './guvenlik.js';
import { el } from './ui.js';

const API = 'https://api.alquran.cloud/v1';
const ED_DESEN = /^[a-z0-9._-]{3,40}$/i;

// Ses adresini biz kurarız (API'den gelen adrese güvenmeyiz); ayet numarası 1-6236 olmalı.
function sesAdresi(no) {
  if (!Number.isInteger(no) || no < 1 || no > 6236) return null;
  return `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${no}.mp3`;
}

async function onbellekli(anahtar, getir) {
  const o = await chrome.storage.local.get(anahtar);
  if (Array.isArray(o[anahtar]) && o[anahtar].length) return o[anahtar];
  const v = await getir();
  await chrome.storage.local.set({ [anahtar]: v });
  return v;
}

function sureler() {
  return onbellekli('kuranSureler2', async () => {
    const j = await guvenliJson(`${API}/surah`);
    if (!j || !Array.isArray(j.data)) throw new Error('Sure listesi alınamadı.');
    const l = j.data
      .map((s) => ({ n: Number(s.number), ar: String(s.name ?? ''), en: String(s.englishName ?? '') }))
      .filter((s) => Number.isInteger(s.n) && s.n >= 1 && s.n <= 114);
    if (l.length !== 114) throw new Error('Sure listesi eksik geldi.');
    return l;
  });
}

async function mealler() {
  const yedek = [{ id: 'tr.diyanet', ad: 'Diyanet İşleri' }];
  try {
    return await onbellekli('kuranMealler2', async () => {
      const j = await guvenliJson(`${API}/edition?format=text&language=tr&type=translation`);
      if (!j || !Array.isArray(j.data)) throw new Error('Meal listesi alınamadı.');
      const l = j.data
        .map((e) => ({ id: String(e.identifier ?? ''), ad: String(e.name || e.englishName || e.identifier || '') }))
        .filter((e) => ED_DESEN.test(e.id));
      if (!l.length) throw new Error('Meal listesi boş.');
      return l;
    });
  } catch {
    return yedek;
  }
}

async function sureGetir(n, edisyon) {
  if (!ED_DESEN.test(edisyon)) throw new Error('Geçersiz kaynak.');
  const j = await guvenliJson(`${API}/surah/${n}/${edisyon}`);
  const a = j && j.data && j.data.ayahs;
  if (!Array.isArray(a)) throw new Error('Sure alınamadı.');
  return a
    .map((x) => ({ no: Number(x.number), sira: Number(x.numberInSurah), metin: String(x.text ?? '') }))
    .filter((x) => Number.isInteger(x.no) && Number.isInteger(x.sira) && x.no >= 1 && x.no <= 6236);
}

export async function baslat(kap) {
  const ayarlar = await getSettings();
  let sure = ayarlar.kuran.sure;
  let meal = ayarlar.kuran.meal;

  const sureSecim = el('select', { class: 'metin' });
  const mealSecim = el('select', { class: 'metin' });
  const durumEl = el('div', { class: 'not' });
  const liste = el('div', { class: 'ayet-liste' });
  const kunye = el('div', { class: 'not' });

  const ses = new Audio();
  let ayetler = [];
  let satirlar = [];
  let calan = -1;
  let surekli = false;

  const dinleBtn = el('button', { type: 'button', text: '▶ Sureyi dinle' });
  const durdurBtn = el('button', { type: 'button', class: 'ikincil', text: '■ Durdur' });

  function vurgu() {
    satirlar.forEach((s, i) => s.classList.toggle('calan', i === calan));
  }

  function durdur() {
    ses.pause();
    surekli = false;
    calan = -1;
    vurgu();
  }

  function cal(i, sirali) {
    const a = ayetler[i];
    const adres = a && sesAdresi(a.no);
    if (!adres) { durdur(); return; }
    calan = i;
    surekli = sirali;
    ses.src = adres;
    ses.play().catch(() => {
      durumEl.textContent = 'Ses çalınamadı (internet bağlantısını kontrol edin).';
      durdur();
    });
    vurgu();
    satirlar[i].scrollIntoView({ block: 'nearest' });
  }

  ses.addEventListener('ended', () => {
    if (surekli && calan + 1 < ayetler.length) cal(calan + 1, true);
    else durdur();
  });

  dinleBtn.addEventListener('click', () => { if (ayetler.length) cal(calan >= 0 ? calan : 0, true); });
  durdurBtn.addEventListener('click', durdur);

  async function yukle() {
    durdur();
    liste.replaceChildren(el('div', { class: 'not', text: 'Yükleniyor…' }));
    durumEl.textContent = '';
    try {
      const [arapca, turkce] = await Promise.all([sureGetir(sure, 'quran-uthmani'), sureGetir(sure, meal)]);
      const mealHarita = new Map(turkce.map((x) => [x.sira, x.metin]));
      ayetler = arapca;
      satirlar = arapca.map((a, i) =>
        el(
          'div',
          { class: 'ayet' },
          el(
            'div',
            { class: 'ayet-ust' },
            el('span', { class: 'ayet-no', text: String(a.sira) }),
            el('button', { type: 'button', class: 'kucuk', text: '▶', title: 'Bu ayeti dinle', onclick: () => cal(i, false) }),
          ),
          el('div', { class: 'ar ayet-ar', text: a.metin }),
          el('div', { class: 'ayet-meal', text: mealHarita.get(a.sira) ?? '' }),
        ),
      );
      liste.replaceChildren(...satirlar);
      const secili = mealSecim.options[mealSecim.selectedIndex];
      kunye.textContent = `Metin ve meal: Islamic Network (alquran.cloud)${secili ? ' · Meal: ' + secili.textContent : ''} · Ses: Mishary Alafasy (cdn.islamic.network)`;
    } catch (e) {
      ayetler = [];
      satirlar = [];
      liste.replaceChildren(el('div', { class: 'hata', text: e.message }));
    }
  }

  async function secimKaydet() {
    const a = await getSettings();
    a.kuran = { sure, meal };
    await saveSettings(a);
  }

  kap.replaceChildren(el('div', { class: 'not', text: 'Yükleniyor…' }));

  try {
    const [sl, ml] = await Promise.all([sureler(), mealler()]);
    for (const s of sl) sureSecim.append(el('option', { value: String(s.n), text: `${s.n}. ${s.en} (${s.ar})` }));
    for (const m of ml) mealSecim.append(el('option', { value: m.id, text: m.ad }));
    if (!ml.some((m) => m.id === meal)) meal = ml[0].id;
    sureSecim.value = String(sure);
    mealSecim.value = meal;
  } catch (e) {
    kap.replaceChildren(el('div', { class: 'hata', text: e.message + ' İnternet bağlantınızı kontrol edin.' }));
    return;
  }

  sureSecim.addEventListener('change', () => { sure = Number(sureSecim.value); secimKaydet(); yukle(); });
  mealSecim.addEventListener('change', () => { meal = mealSecim.value; secimKaydet(); yukle(); });

  kap.replaceChildren(
    sureSecim,
    mealSecim,
    el('div', { class: 'satir ara' }, dinleBtn, durdurBtn),
    durumEl,
    liste,
    kunye,
  );
  yukle();
}
