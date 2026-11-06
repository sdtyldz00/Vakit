import { VAKITLER, getSettings, saveSettings, getState, temizleAyarlar } from './lib.js';
import { el } from './ui.js';
import { sesKaydet, sesGetir, sesSil } from './ses.js';
import { temizMetin } from './guvenlik.js';

const MAKS_SES = 10 * 1024 * 1024; // 10 MB

function sayac(deger, degisti, min, max) {
  let v = deger;
  const goster = el('span', { text: String(v) });
  const git = (yeni) => {
    v = Math.min(max, Math.max(min, yeni));
    goster.textContent = String(v);
    degisti(v);
  };
  return el(
    'div',
    { class: 'sayac' },
    el('button', { type: 'button', class: 'kucuk', text: '−', onclick: () => git(v - 1) }),
    goster,
    el('button', { type: 'button', class: 'kucuk', text: '+', onclick: () => git(v + 1) }),
  );
}

function kutu(secili, degisti) {
  const k = el('input', { type: 'checkbox' });
  k.checked = secili;
  k.addEventListener('change', () => degisti(k.checked));
  return k;
}

function mb(bayt) {
  return (bayt / 1024 / 1024).toFixed(1);
}

export async function baslat(kap) {
  const calisma = JSON.parse(JSON.stringify(await getSettings()));
  let deneme = null;

  // Konum
  const adres = el('input', { type: 'text', maxlength: '100', class: 'metin', placeholder: 'Örn: Gebze, Kocaeli, Turkey' });
  adres.value = calisma.address;

  const hanefi = kutu(calisma.hanefi, (d) => { calisma.hanefi = d; });

  // Vakit satırları
  const satirlar = el('div', { class: 'ayar-tablo' });
  satirlar.append(
    el('div', { class: 'ayar-baslik', text: 'Vakit' }),
    el('div', { class: 'ayar-baslik', text: 'Temkin (dk)' }),
    el('div', { class: 'ayar-baslik', text: 'Bildirim' }),
    el('div', { class: 'ayar-baslik', text: 'Ezan' }),
  );
  for (const v of VAKITLER) {
    satirlar.append(
      el('div', { text: v.ad }),
      sayac(calisma.offsets[v.key] || 0, (x) => { calisma.offsets[v.key] = x; }, -30, 30),
      kutu(calisma.notify[v.key], (d) => { calisma.notify[v.key] = d; }),
      kutu(calisma.ezan.vakitler[v.key], (d) => { calisma.ezan.vakitler[v.key] = d; }),
    );
  }

  // Ezan sesi
  const sesBilgi = el('div', { class: 'not' });
  async function sesBilgiGuncelle() {
    const { sesBilgi: b } = await chrome.storage.local.get('sesBilgi');
    const blob = await sesGetir();
    sesBilgi.textContent = blob
      ? `Yüklü ezan: ${temizMetin(b && b.ad, 60) || 'ses dosyası'} (${mb(blob.size)} MB)`
      : 'Henüz ezan sesi yüklenmedi. Ezan çalmak için kendi ses dosyanızı (mp3, ogg, wav…) seçin.';
  }

  const dosya = el('input', { type: 'file', accept: 'audio/*' });
  dosya.addEventListener('change', async () => {
    const f = dosya.files && dosya.files[0];
    if (!f) return;
    if (!f.type.startsWith('audio/')) { sesBilgi.textContent = 'Lütfen bir ses dosyası seçin.'; return; }
    if (f.size > MAKS_SES) { sesBilgi.textContent = `Dosya çok büyük (en fazla ${mb(MAKS_SES)} MB).`; return; }
    try {
      await sesKaydet(f.slice(0, f.size, f.type));
      await chrome.storage.local.set({ sesBilgi: { ad: temizMetin(f.name, 60), boyut: f.size } });
      await sesBilgiGuncelle();
    } catch {
      sesBilgi.textContent = 'Ses dosyası kaydedilemedi.';
    }
  });

  function denemeDurdur() {
    if (deneme) {
      deneme.a.pause();
      URL.revokeObjectURL(deneme.url);
      deneme = null;
    }
    chrome.runtime.sendMessage({ type: 'ezan-dur' }).catch(() => {});
  }

  const dene = el('button', {
    type: 'button',
    class: 'ikincil',
    text: 'Dene',
    onclick: async () => {
      denemeDurdur();
      const blob = await sesGetir();
      if (!blob) { sesBilgi.textContent = 'Önce bir ezan dosyası yükleyin.'; return; }
      const url = URL.createObjectURL(blob);
      const a = new Audio(url);
      a.volume = calisma.ezan.ses;
      a.addEventListener('ended', denemeDurdur);
      deneme = { a, url };
      a.play().catch(() => { sesBilgi.textContent = 'Ses çalınamadı.'; denemeDurdur(); });
    },
  });
  const durdur = el('button', { type: 'button', class: 'ikincil', text: 'Durdur', onclick: denemeDurdur });
  const kaldir = el('button', {
    type: 'button',
    class: 'ikincil',
    text: 'Kaldır',
    onclick: async () => {
      denemeDurdur();
      await sesSil();
      await chrome.storage.local.remove('sesBilgi');
      await sesBilgiGuncelle();
    },
  });

  const seviye = el('input', { type: 'range', min: '0', max: '1', step: '0.05' });
  seviye.value = String(calisma.ezan.ses);
  seviye.addEventListener('input', () => {
    calisma.ezan.ses = Number(seviye.value);
    if (deneme) deneme.a.volume = calisma.ezan.ses;
  });

  // Kaydet / geri
  const mesaj = el('div', { class: 'not' });
  const kaydet = el('button', {
    type: 'button',
    text: 'Kaydet',
    onclick: async () => {
      const girilen = temizMetin(adres.value, 100);
      if (!girilen) { mesaj.textContent = 'Lütfen bir konum yazın.'; return; }
      calisma.address = girilen;
      const temiz = temizleAyarlar(calisma);
      mesaj.textContent = 'Kontrol ediliyor…';
      try {
        await getState(new Date(), temiz); // konum geçerli mi?
      } catch (e) {
        mesaj.textContent = e.message;
        return;
      }
      await saveSettings(temiz);
      chrome.runtime.sendMessage({ type: 'yenile' }).catch(() => {});
      denemeDurdur();
      document.dispatchEvent(new CustomEvent('ayarlar-degisti'));
      document.dispatchEvent(new CustomEvent('sekme-ac', { detail: 'vakit' }));
    },
  });
  const geri = el('button', {
    type: 'button',
    class: 'ikincil',
    text: 'Geri',
    onclick: () => { denemeDurdur(); document.dispatchEvent(new CustomEvent('sekme-ac', { detail: 'vakit' })); },
  });

  kap.replaceChildren(
    el('label', { class: 'alan' }, 'Konum (şehir, ilçe, ülke)', adres),
    el('div', { class: 'not', text: 'Hesaplama yöntemi: Türkiye Diyanet İşleri Başkanlığı' }),
    el('label', { class: 'onay' }, hanefi, 'Hanefi mezhebine göre geç ikindi'),
    el('div', { class: 'alan' }, 'Hicri gün ayarı', sayac(calisma.hijriAdj, (x) => { calisma.hijriAdj = x; }, -3, 3)),
    el('div', { class: 'baslik', text: 'Temkin, bildirim ve ezan' }),
    satirlar,
    el('div', { class: 'baslik', text: 'Ezan sesi' }),
    sesBilgi,
    dosya,
    el('div', { class: 'satir ara' }, dene, durdur, kaldir),
    el('label', { class: 'alan' }, 'Ses düzeyi', seviye),
    mesaj,
    el('div', { class: 'satir ara' }, geri, kaydet),
  );
  sesBilgiGuncelle();
}
