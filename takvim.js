import { getSettings, AYLAR, miladiMetin } from './lib.js';
import { hicriTarih, HICRI_AYLAR, mubarekGunler } from './hicri.js';
import { el } from './ui.js';

const GUN_KISA = ['PZT', 'SAL', 'ÇAR', 'PER', 'CUM', 'CMT', 'PAZ'];
const AY_KISA = ['Muh.', 'Saf.', 'R.Evv', 'R.Ahr', 'C.Evv', 'C.Ahr', 'Rec.', 'Şab.', 'Ram.', 'Şev.', 'Zilk.', 'Zilh.'];

const iki = (n) => String(n).padStart(2, '0');

function gunFarki(tarih, bugun) {
  const a = new Date(bugun.getFullYear(), bugun.getMonth(), bugun.getDate());
  return Math.round((tarih - a) / 86400000);
}

export async function baslat(kap) {
  const ayarlar = await getSettings();
  const adj = ayarlar.hijriAdj;
  const bugun = new Date();
  let yil = bugun.getFullYear();
  let ay = bugun.getMonth();

  const baslikAy = el('div', { class: 'takvim-ay' });
  const baslikHicri = el('div', { class: 'takvim-hicri' });
  const onceki = el('button', { type: 'button', class: 'kucuk', text: '‹', title: 'Önceki ay' });
  const sonraki = el('button', { type: 'button', class: 'kucuk', text: '›', title: 'Sonraki ay' });
  const grid = el('div', { class: 'takvim-grid' });

  function ciz() {
    baslikAy.textContent = `${AYLAR[ay]} ${yil}`;
    const h1 = hicriTarih(new Date(yil, ay, 1), adj);
    const h2 = hicriTarih(new Date(yil, ay + 1, 0), adj);
    baslikHicri.textContent =
      h1.month === h2.month
        ? `${HICRI_AYLAR[h1.month - 1]} ${h1.year}`
        : `${HICRI_AYLAR[h1.month - 1]} – ${HICRI_AYLAR[h2.month - 1]} ${h2.year}`;

    grid.replaceChildren();
    for (const g of GUN_KISA) grid.append(el('div', { class: 'takvim-gun-adi', text: g }));

    const bosluk = (new Date(yil, ay, 1).getDay() + 6) % 7;
    for (let i = 0; i < 42; i++) {
      const d = new Date(yil, ay, 1 - bosluk + i);
      const h = hicriTarih(d, adj);
      const hucre = el(
        'div',
        { class: 'takvim-hucre' },
        el('span', { class: 'm', text: String(d.getDate()) }),
        el('span', { class: 'h', text: h.day === 1 ? AY_KISA[h.month - 1] : String(h.day) }),
      );
      if (d.getMonth() !== ay) hucre.classList.add('soluk');
      if (h.day === 1) hucre.classList.add('ay-basi');
      if (gunFarki(d, bugun) === 0) hucre.classList.add('bugun');
      grid.append(hucre);
    }
  }

  onceki.addEventListener('click', () => {
    ay -= 1;
    if (ay < 0) { ay = 11; yil -= 1; }
    ciz();
  });
  sonraki.addEventListener('click', () => {
    ay += 1;
    if (ay > 11) { ay = 0; yil += 1; }
    ciz();
  });

  const liste = el('div', { class: 'mubarek-liste' });
  for (const o of mubarekGunler(bugun, adj, 400).slice(0, 8)) {
    const fark = gunFarki(o.tarih, bugun);
    const etiket = fark === 0 ? 'Bugün' : fark === 1 ? 'Yarın' : `${fark} gün sonra`;
    liste.append(
      el(
        'div',
        { class: 'mubarek' },
        el(
          'div',
          {},
          el('div', { class: 'mubarek-ad', text: o.ad }),
          el('div', { class: 'not', text: `${miladiMetin(o.tarih)} · Hicri ${iki(o.hicri.day)} ${HICRI_AYLAR[o.hicri.month - 1]} ${o.hicri.year}` }),
        ),
        el('span', { class: 'rozet', text: etiket }),
      ),
    );
  }

  kap.replaceChildren(
    el('div', { class: 'takvim-ust' }, onceki, el('div', { class: 'takvim-orta' }, baslikAy, baslikHicri), sonraki),
    grid,
    el('div', { class: 'baslik', text: 'Yaklaşan mübarek günler' }),
    liste,
    el('div', {
      class: 'not',
      text: 'Tarihler hesapla bulunur; Diyanet’in ilan ettiği tarihten 1 gün fark edebilir (Ayarlar’dan Hicri gün ayarı yapılabilir). Kandil geceleri gösterilen günden bir önceki akşam başlar.',
    }),
  );
  ciz();
}
