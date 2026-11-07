// "Zikir" sekmesi: Zikirmatik ve Esmâ-ül Hüsnâ aynı sekmede iki alt bölüm olarak durur.
import { el } from './ui.js';

const BOLUMLER = [
  { id: 'zikir', ad: 'Zikirmatik', modul: () => import('./zikir.js') },
  { id: 'esma', ad: 'Esmâ-ül Hüsnâ', modul: () => import('./esma.js') },
];

export async function baslat(kap) {
  const kutular = {};
  const dugmeler = {};
  const yuklenen = new Set();

  async function ac(id) {
    for (const b of BOLUMLER) {
      dugmeler[b.id].classList.toggle('aktif', b.id === id);
      kutular[b.id].hidden = b.id !== id;
    }
    if (yuklenen.has(id)) return;
    yuklenen.add(id);
    const bolum = BOLUMLER.find((b) => b.id === id);
    try {
      const m = await bolum.modul();
      await m.baslat(kutular[id]);
    } catch (e) {
      yuklenen.delete(id);
      kutular[id].replaceChildren(el('div', { class: 'hata', text: 'Bu bölüm yüklenemedi: ' + e.message }));
    }
  }

  const cubuk = el('div', { class: 'alt-sekmeler' });
  for (const b of BOLUMLER) {
    dugmeler[b.id] = el('button', { type: 'button', class: 'alt-sekme', text: b.ad, onclick: () => ac(b.id) });
    kutular[b.id] = el('div', { class: 'alt-icerik' });
    cubuk.append(dugmeler[b.id]);
  }
  kap.replaceChildren(cubuk, ...BOLUMLER.map((b) => kutular[b.id]));
  await ac('zikir');
}
