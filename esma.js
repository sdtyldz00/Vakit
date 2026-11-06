import { ESMA } from './esma-verisi.js';
import { el } from './ui.js';

export function baslat(kap) {
  const bugun = new Date();
  const yilinGunu = Math.floor((bugun - new Date(bugun.getFullYear(), 0, 0)) / 86400000);
  let indeks = yilinGunu % ESMA.length;

  const sira = el('div', { class: 'esma-sira' });
  const ar = el('div', { class: 'ar esma-ar' });
  const okunus = el('div', { class: 'esma-okunus' });
  const anlam = el('div', { class: 'esma-anlam' });
  const onceki = el('button', { type: 'button', class: 'kucuk', text: '‹', title: 'Önceki' });
  const sonraki = el('button', { type: 'button', class: 'kucuk', text: '›', title: 'Sonraki' });
  const kart = el(
    'div',
    { class: 'kart esma-kart' },
    el('div', { class: 'esma-gezin' }, onceki, sira, sonraki),
    ar, okunus, anlam,
  );

  const arama = el('input', { type: 'text', placeholder: 'İsim ara…', maxlength: '40', class: 'metin' });
  const liste = el('div', { class: 'esma-liste' });

  function goster(i) {
    indeks = (i + ESMA.length) % ESMA.length;
    const [arapca, ok, an] = ESMA[indeks];
    sira.textContent = `${indeks + 1} / ${ESMA.length}`;
    ar.textContent = arapca;
    okunus.textContent = ok;
    anlam.textContent = an;
  }

  // Şapkalı/noktalı harflere bakmadan arar ("rahman" → "Er-Rahmân").
  const sade = (t) =>
    t.toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

  function listeCiz() {
    const s = sade(arama.value.trim());
    liste.replaceChildren();
    ESMA.forEach(([, ok, an], i) => {
      if (s && !sade(ok).includes(s) && !sade(an).includes(s)) return;
      liste.append(
        el(
          'button',
          { type: 'button', class: 'esma-satir', onclick: () => goster(i) },
          el('span', { class: 'esma-no', text: String(i + 1) }),
          el('span', { text: ok }),
        ),
      );
    });
  }

  onceki.addEventListener('click', () => goster(indeks - 1));
  sonraki.addEventListener('click', () => goster(indeks + 1));
  arama.addEventListener('input', listeCiz);

  kap.replaceChildren(
    kart,
    arama,
    liste,
    el('div', { class: 'not', text: 'Anlamlar kısa özetlerdir. Esmâ listeleri kaynaklara göre küçük farklılıklar gösterebilir.' }),
  );
  goster(indeks);
  listeCiz();
}
