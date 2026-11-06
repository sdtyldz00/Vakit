import { DUALAR, KATEGORILER } from './dua-verisi.js';
import { el } from './ui.js';

const FAVORILER = 'fav';

async function favoriOku() {
  const { favoriDualar } = await chrome.storage.local.get('favoriDualar');
  const gecerli = new Set(DUALAR.map((d) => d.id));
  return new Set((Array.isArray(favoriDualar) ? favoriDualar : []).filter((id) => gecerli.has(id)));
}

// Türkçe karakterlere ve şapkalara bakmadan arar ("sinav" → "sınav", "rahman" → "Rahmân").
const sade = (t) =>
  String(t).toLocaleLowerCase('tr').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ı/g, 'i');

export async function baslat(kap) {
  const favoriler = await favoriOku();
  const kaydet = () => chrome.storage.local.set({ favoriDualar: [...favoriler] });

  const kategori = el('select', { class: 'metin' });
  kategori.append(el('option', { value: '', text: `Tüm dualar (${DUALAR.length})` }));
  kategori.append(el('option', { value: FAVORILER, text: '★ Favorilerim' }));
  for (const k of KATEGORILER) {
    const n = DUALAR.filter((d) => d.kat === k.id).length;
    kategori.append(el('option', { value: k.id, text: `${k.ad} (${n})` }));
  }
  const arama = el('input', { type: 'text', class: 'metin', placeholder: 'Dua ara… (yemek, tuvalet, sınav, şifa)', maxlength: '40' });
  const liste = el('div', { class: 'dua-liste' });
  const durum = el('div', { class: 'not' });

  async function kopyala(d, dugme) {
    const metin = [d.ad, '', d.ar, '', d.okunus, '', d.anlam].join('\n');
    try {
      await navigator.clipboard.writeText(metin);
      dugme.textContent = 'Kopyalandı ✓';
    } catch {
      dugme.textContent = 'Kopyalanamadı';
    }
    setTimeout(() => { dugme.textContent = 'Kopyala'; }, 1500);
  }

  function kart(d) {
    const fav = el('button', { type: 'button', class: 'kucuk fav', title: 'Favorilere ekle/çıkar' });
    const favGuncelle = () => {
      fav.textContent = favoriler.has(d.id) ? '★' : '☆';
      fav.classList.toggle('acik', favoriler.has(d.id));
    };
    fav.addEventListener('click', () => {
      if (favoriler.has(d.id)) favoriler.delete(d.id); else favoriler.add(d.id);
      kaydet();
      favGuncelle();
      if (kategori.value === FAVORILER) ciz();
    });
    favGuncelle();

    const kopya = el('button', { type: 'button', class: 'kucuk', text: 'Kopyala' });
    kopya.addEventListener('click', () => kopyala(d, kopya));

    return el(
      'div',
      { class: 'dua' },
      el('div', { class: 'dua-ust' }, el('div', { class: 'dua-ad', text: d.ad }), el('div', { class: 'dua-btn' }, fav, kopya)),
      el('div', { class: 'ar dua-ar', text: d.ar }),
      el('div', { class: 'esma-okunus', text: d.okunus }),
      el('div', { class: 'esma-anlam', text: d.anlam }),
      d.not ? el('div', { class: 'dua-not', text: d.not }) : null,
      d.kaynak ? el('div', { class: 'dua-kaynak', text: `Kaynak: ${d.kaynak}` }) : null,
    );
  }

  function ciz() {
    const s = sade(arama.value.trim());
    const k = kategori.value;
    const secim = DUALAR.filter((d) => {
      if (k === FAVORILER && !favoriler.has(d.id)) return false;
      if (k && k !== FAVORILER && d.kat !== k) return false;
      if (!s) return true;
      return sade(`${d.ad} ${d.okunus} ${d.anlam}`).includes(s);
    });
    liste.replaceChildren(...secim.map(kart));
    durum.textContent = secim.length
      ? `${secim.length} dua`
      : k === FAVORILER && !s ? 'Henüz favori dua yok. Bir duanın yanındaki ☆ işaretine basarak ekleyebilirsiniz.' : 'Sonuç bulunamadı.';
  }

  kategori.addEventListener('change', ciz);
  arama.addEventListener('input', ciz);

  kap.replaceChildren(
    kategori,
    arama,
    durum,
    liste,
    el('div', { class: 'not', text: 'Anlamlar kısa çevirilerdir. Kesin metin ve ayrıntı için Diyanet gibi güvenilir bir kaynağa başvurun.' }),
  );
  ciz();
}
