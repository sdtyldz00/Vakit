import { ZIKIRLER } from './zikir-verisi.js';
import { el } from './ui.js';

const HEDEFLER = [33, 99, 100, 0]; // 0 = sınırsız

async function oku() {
  const { zikir } = await chrome.storage.local.get('zikir');
  const z = zikir && typeof zikir === 'object' ? zikir : {};
  const idx = Number.isInteger(z.idx) && z.idx >= 0 && z.idx < ZIKIRLER.length ? z.idx : 0;
  const sayac = Number.isInteger(z.sayac) && z.sayac >= 0 && z.sayac < 1000000 ? z.sayac : 0;
  const hedef = HEDEFLER.includes(z.hedef) ? z.hedef : 33;
  return { idx, sayac, hedef };
}

export async function baslat(kap) {
  const d = await oku();
  const kaydet = () => chrome.storage.local.set({ zikir: { ...d } });

  const secim = el('select', { class: 'metin' });
  ZIKIRLER.forEach((z, i) => secim.append(el('option', { value: String(i), text: z.ad })));
  secim.value = String(d.idx);

  const hedefSecim = el('select', { class: 'metin kisa' });
  for (const h of HEDEFLER) hedefSecim.append(el('option', { value: String(h), text: h === 0 ? 'Sınırsız' : `Hedef: ${h}` }));
  hedefSecim.value = String(d.hedef);

  const ar = el('div', { class: 'ar zikir-ar' });
  const okunus = el('div', { class: 'esma-okunus' });
  const anlam = el('div', { class: 'esma-anlam' });
  const sayiEl = el('div', { class: 'sayi' });
  const bilgi = el('div', { class: 'etiket' });
  const say = el('button', { type: 'button', class: 'say-btn', text: 'SAY' });
  const sifirla = el('button', { type: 'button', class: 'ikincil', text: 'Sıfırla' });

  function ciz() {
    const z = ZIKIRLER[d.idx];
    ar.textContent = z.ar;
    okunus.textContent = z.okunus;
    anlam.textContent = z.anlam;
    sayiEl.textContent = String(d.sayac);
    if (d.hedef && d.sayac >= d.hedef) bilgi.textContent = `Hedef tamamlandı (${d.hedef}) ✓`;
    else bilgi.textContent = d.hedef ? `Kalan: ${d.hedef - d.sayac}` : '';
  }

  secim.addEventListener('change', () => { d.idx = Number(secim.value); d.sayac = 0; kaydet(); ciz(); });
  hedefSecim.addEventListener('change', () => { d.hedef = Number(hedefSecim.value); kaydet(); ciz(); });
  say.addEventListener('click', () => { d.sayac += 1; kaydet(); ciz(); });
  sifirla.addEventListener('click', () => { d.sayac = 0; kaydet(); ciz(); });

  kap.replaceChildren(
    el('div', { class: 'satir' }, secim),
    el('div', { class: 'kart' }, ar, okunus, anlam),
    el('div', { class: 'zikir-sayac' }, sayiEl, bilgi, say),
    el('div', { class: 'satir ara' }, hedefSecim, sifirla),
  );
  ciz();
}
