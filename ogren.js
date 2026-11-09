// "Okumayı öğren": Elif-Ba harfleri (sesli), harekeler, kısa sureler ve sınav.
import { el } from './ui.js';
import { HARFLER, HAREKELER, SURELER, KALIN } from './ogren-verisi.js';

const ZWJ = '‍';
const HARF_IDLERI = new Set(HARFLER.map((h) => h.id));

async function ilerlemeOku() {
  const { ogrenIlerleme: o } = await chrome.storage.local.get('ogrenIlerleme');
  const liste = o && Array.isArray(o.ogrendi) ? o.ogrendi : [];
  return new Set(liste.filter((x) => typeof x === 'string' && HARF_IDLERI.has(x)));
}

const ses = new Audio();
function harfCal(h) {
  ses.pause();
  ses.src = `ses/harf/${h.id}.mp3`;
  return ses.play().catch(() => {});
}

function karistir(dizi) {
  const a = [...dizi];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- Harfler ----------
function harflerBolumu(kutu, ogrendi, kaydet) {
  const detay = el('div', { class: 'kart harf-detay' });
  const izgara = el('div', { class: 'harf-izgara' });
  const sayac = el('div', { class: 'etiket' });
  let secili = HARFLER[0];
  const dugmeler = new Map();

  function sayacYaz() {
    sayac.textContent = `Öğrendiğin harf: ${ogrendi.size} / ${HARFLER.length}`;
  }

  function biciml(etiket, metin) {
    return el('div', { class: 'bicim' }, el('div', { class: 'ar bicim-harf', text: metin }), el('div', { class: 'etiket', text: etiket }));
  }

  function detayCiz() {
    const h = secili;
    const bicimler = [biciml('Tek', h.ar)];
    if (h.bag) {
      bicimler.push(biciml('Başta', h.ar + ZWJ), biciml('Ortada', ZWJ + h.ar + ZWJ));
    }
    bicimler.push(biciml('Sonda', ZWJ + h.ar));
    const ogrendiMi = ogrendi.has(h.id);
    detay.replaceChildren(
      el('div', { class: 'ar harf-buyuk', text: h.ar }),
      el('div', { class: 'harf-ad', text: h.ad }),
      el('div', { class: 'esma-anlam', text: h.ses }),
      el('div', { class: 'bicimler' }, ...bicimler),
      h.bag ? null : el('div', { class: 'etiket', text: 'Bu harf kendinden sonraki harfe bağlanmaz.' }),
      el(
        'div',
        { class: 'satir ara' },
        el('button', { type: 'button', text: '🔊 Dinle', onclick: () => harfCal(h) }),
        el('button', {
          type: 'button',
          class: ogrendiMi ? 'ikincil' : '',
          text: ogrendiMi ? '✓ Öğrendim (kaldır)' : 'Öğrendim',
          onclick: async () => {
            if (ogrendi.has(h.id)) ogrendi.delete(h.id); else ogrendi.add(h.id);
            await kaydet();
            dugmeler.get(h.id).classList.toggle('bitti', ogrendi.has(h.id));
            sayacYaz();
            detayCiz();
          },
        }),
      ),
    );
  }

  for (const h of HARFLER) {
    const b = el('button', {
      type: 'button',
      class: 'harf-btn' + (ogrendi.has(h.id) ? ' bitti' : ''),
      onclick: () => {
        secili = h;
        for (const [id, d] of dugmeler) d.classList.toggle('secili', id === h.id);
        detayCiz();
        harfCal(h);
      },
    }, el('span', { class: 'ar', text: h.ar }), el('span', { class: 'etiket', text: h.ad }));
    dugmeler.set(h.id, b);
    izgara.append(b);
  }
  dugmeler.get(secili.id).classList.add('secili');
  detayCiz();
  sayacYaz();
  kutu.replaceChildren(
    el('div', { class: 'not', text: 'Arapça sağdan sola yazılır. Bir harfe dokununca adını duyarsın. Sesler, harflerin adlarını okur; harfin kendi sesini yandaki açıklamadan öğren.' }),
    sayac,
    izgara,
    detay,
  );
}

// ---------- Harekeler ----------
function harekelerBolumu(kutu) {
  kutu.replaceChildren(
    el('div', { class: 'not', text: `Harfin sesini harekeler belirler. Kalın harfler: ${KALIN.join(' ')}. Hece örneklerinin sesi yoktur, okunuşu yazıyla verilir.` }),
    ...HAREKELER.map((x) =>
      el(
        'div',
        { class: 'kart sol' },
        el('div', { class: 'dua-ad', text: x.ad }),
        el('div', { class: 'ar hareke-isaret', text: x.isaret }),
        el('div', { class: 'esma-anlam', text: x.aciklama }),
        el(
          'div',
          { class: 'ornekler' },
          ...x.ornekler.map(([ar, ok]) => el('div', { class: 'ornek' }, el('div', { class: 'ar ornek-ar', text: ar }), el('div', { class: 'esma-okunus', text: ok }))),
        ),
      ),
    ),
  );
}

// ---------- Sureler ----------
function surelerBolumu(kutu) {
  const liste = el('div');
  for (const s of SURELER) {
    const govde = el('div', { hidden: '' });
    for (const [ar, ok, anlam] of s.ayetler) {
      govde.append(
        el(
          'div',
          { class: 'okuma-ayet' },
          el('div', { class: 'ar dua-ar', text: ar }),
          el('div', { class: 'esma-okunus', text: ok }),
          el('div', { class: 'esma-anlam', text: anlam }),
        ),
      );
    }
    govde.hidden = true;
    const baslik = el('button', {
      type: 'button',
      class: 'sure-baslik',
      text: `${s.ad} sûresi (${s.ayetler.length} ayet)`,
      onclick: () => { govde.hidden = !govde.hidden; baslik.classList.toggle('aktif', !govde.hidden); },
    });
    liste.append(el('div', { class: 'kart sol' }, baslik, govde));
  }
  kutu.replaceChildren(
    el('div', { class: 'not', text: 'Önce okunuşa bakarak oku, sonra Arapçasına bak. Ayetleri sesli dinlemek için Kur’an sekmesinin “Sureler” bölümünü kullan. Metin ve okunuşu elle yazıldı; kuşkuda kalırsan Kur’an sekmesiyle ya da bir hocayla karşılaştır.' }),
    liste,
  );
}

// ---------- Sınav ----------
function sinavBolumu(kutu) {
  const SORU_SAYISI = 10;
  let sorular = [];
  let sira = 0;
  let puan = 0;

  function yeni() {
    sorular = karistir(HARFLER).slice(0, SORU_SAYISI).map((dogru, i) => {
      const yanlislar = karistir(HARFLER.filter((h) => h.id !== dogru.id)).slice(0, 3);
      return { dogru, secenekler: karistir([dogru, ...yanlislar]), tur: i % 2 === 0 ? 'dinle' : 'harf' };
    });
    sira = 0;
    puan = 0;
    soruCiz();
  }

  function soruCiz() {
    if (sira >= sorular.length) {
      kutu.replaceChildren(
        el('div', { class: 'kart' }, el('div', { class: 'harf-ad', text: `${puan} / ${sorular.length}` }), el('div', { class: 'esma-anlam', text: puan >= 9 ? 'Çok iyi! Harfleri iyi tanıyorsun.' : puan >= 6 ? 'İyi gidiyorsun. Yanlış yaptığın harflere tekrar bak.' : 'Harfler bölümünde biraz daha dinleyip tekrar dene.' })),
        el('button', { type: 'button', text: 'Yeniden başla', onclick: yeni }),
      );
      return;
    }
    const s = sorular[sira];
    const sonuc = el('div', { class: 'etiket' });
    const ust = s.tur === 'dinle'
      ? el('div', { class: 'kart' }, el('div', { class: 'esma-anlam', text: 'Duyduğun harf hangisi?' }), el('button', { type: 'button', text: '🔊 Dinle', onclick: () => harfCal(s.dogru) }))
      : el('div', { class: 'kart' }, el('div', { class: 'esma-anlam', text: 'Bu harfin adı nedir?' }), el('div', { class: 'ar harf-buyuk', text: s.dogru.ar }));
    const secenekler = el('div', { class: 'secenekler' });
    let cevaplandi = false;
    for (const h of s.secenekler) {
      const b = el('button', {
        type: 'button',
        class: 'secenek' + (s.tur === 'dinle' ? ' ar' : ''),
        text: s.tur === 'dinle' ? h.ar : h.ad,
        onclick: () => {
          if (cevaplandi) return;
          cevaplandi = true;
          const dogruMu = h.id === s.dogru.id;
          if (dogruMu) puan += 1;
          b.classList.add(dogruMu ? 'dogru' : 'yanlis');
          sonuc.textContent = dogruMu ? 'Doğru ✓' : `Yanlış. Doğrusu: ${s.dogru.ad} (${s.dogru.ar})`;
          if (s.tur === 'harf') harfCal(s.dogru);
          secenekler.after(el('button', { type: 'button', text: sira + 1 === sorular.length ? 'Sonucu gör' : 'Sonraki', onclick: () => { sira += 1; soruCiz(); } }));
        },
      });
      secenekler.append(b);
    }
    kutu.replaceChildren(el('div', { class: 'etiket', text: `Soru ${sira + 1} / ${sorular.length}` }), ust, secenekler, sonuc);
    if (s.tur === 'dinle') harfCal(s.dogru);
  }

  yeni();
}

const BOLUMLER = [
  { id: 'harf', ad: 'Harfler' },
  { id: 'hareke', ad: 'Harekeler' },
  { id: 'sure', ad: 'Namaz sureleri' },
  { id: 'sinav', ad: 'Sınav' },
];

export async function baslat(kap) {
  const ogrendi = await ilerlemeOku();
  const kaydet = () => chrome.storage.local.set({ ogrenIlerleme: { ogrendi: [...ogrendi] } });
  const kutu = el('div');
  const cubuk = el('div', { class: 'alt-sekmeler' });
  const dugmeler = {};

  function ac(id) {
    ses.pause();
    for (const b of BOLUMLER) dugmeler[b.id].classList.toggle('aktif', b.id === id);
    if (id === 'harf') harflerBolumu(kutu, ogrendi, kaydet);
    else if (id === 'hareke') harekelerBolumu(kutu);
    else if (id === 'sure') surelerBolumu(kutu);
    else sinavBolumu(kutu);
  }

  for (const b of BOLUMLER) {
    dugmeler[b.id] = el('button', { type: 'button', class: 'alt-sekme', text: b.ad, onclick: () => ac(b.id) });
    cubuk.append(dugmeler[b.id]);
  }
  kap.replaceChildren(cubuk, kutu);
  ac('harf');
}
