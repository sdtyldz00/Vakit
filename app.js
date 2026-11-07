import { mesajDinle } from './platform.js'; // chrome.* uyarlayıcısı, diğer modüllerden önce yüklenmeli
import { getSettings, getState, formatHMS, formatHM, miladiMetin, hicriMetin } from './lib.js';
import { sesGetir } from './ses.js';
import { el } from './ui.js';
import { ikonUygula, ikonBul } from './ikonlar.js';

const $ = (id) => document.getElementById(id);

// ---------------- Sekmeler ----------------
const MODULLER = {
  kible: () => import('./kible.js'),
  takvim: () => import('./takvim.js'),
  dua: () => import('./dua.js'),
  zikir: () => import('./zikirEsma.js'),
  kuran: () => import('./kuran.js'),
  ayar: () => import('./ayarlar.js'),
};
const baslatilan = new Set();

function sekmeAc(ad) {
  for (const b of document.querySelectorAll('.sekme-btn')) {
    b.classList.toggle('aktif', b.dataset.sekme === ad);
  }
  for (const s of document.querySelectorAll('section.icerik')) {
    s.hidden = s.id !== `sekme-${ad}`;
  }
  window.scrollTo(0, 0);
  if (ad === 'vakit') return;
  if (ad !== 'ayar' && baslatilan.has(ad)) return;
  baslatilan.add(ad);
  const kap = $(`sekme-${ad}`);
  MODULLER[ad]()
    .then((m) => m.baslat(kap))
    .catch((e) => {
      baslatilan.delete(ad);
      kap.replaceChildren(el('div', { class: 'hata', text: 'Bu bölüm yüklenemedi: ' + e.message }));
    });
}

for (const b of document.querySelectorAll('.sekme-btn')) {
  b.addEventListener('click', () => sekmeAc(b.dataset.sekme));
}
document.addEventListener('sekme-ac', (e) => sekmeAc(e.detail));
document.addEventListener('ayarlar-degisti', () => {
  baslatilan.clear();
  yukle();
});

// ---------------- Vakit sekmesi ----------------
let durum = null;
let calisiyor = false;
let tekrarIstendi = false;

function hataGoster(mesaj) {
  const h = $('hata');
  h.textContent = mesaj;
  h.hidden = !mesaj;
}

async function yukle() {
  // Yükleme sürerken yeni istek gelirse (örn. ayar değişti) yok sayılmaz, bitince bir kez daha çalışır.
  if (calisiyor) {
    tekrarIstendi = true;
    return;
  }
  calisiyor = true;
  try {
    const ayarlar = await getSettings();
    $('konum').textContent = ayarlar.coords ? '📍 Konumum (GPS)' : ayarlar.address;
    durum = await getState(new Date(), ayarlar);
    hataGoster('');
    listeCiz();
    saniyeGuncelle();
  } catch (e) {
    durum = null;
    hataGoster(e.message + ' Ayarlardan konumu düzeltip tekrar deneyin.');
  } finally {
    calisiyor = false;
    if (tekrarIstendi) {
      tekrarIstendi = false;
      yukle();
    }
  }
}

function ayniVakit(a, b) {
  return a.key === b.key && a.date.getTime() === b.date.getTime();
}

function listeCiz() {
  const ul = $('vakitler');
  ul.replaceChildren();
  for (const v of durum.list) {
    const li = el('li', {}, el('span', { text: v.ad }), el('span', { class: 'saat', text: formatHM(v.date) }));
    if (ayniVakit(v, durum.current)) li.classList.add('aktif');
    if (ayniVakit(v, durum.next)) li.classList.add('sonraki');
    ul.append(li);
  }
  $('hicri').textContent = hicriMetin(durum.hijri);
  $('miladi').textContent = miladiMetin(durum.now);
  $('suanki').textContent = `Şu an: ${durum.current.ad} vakti`;
  $('sonraki').textContent = `${durum.next.ad} · ${formatHM(durum.next.date)}`;
}

function saniyeGuncelle() {
  if (!durum) return;
  const simdi = new Date();
  if (simdi >= durum.next.date) {
    yukle();
    return;
  }
  $('kalan').textContent = formatHMS(durum.next.date - simdi);
}

setInterval(saniyeGuncelle, 1000);

// ---------------- Ezan sesi (uygulama açıkken) ----------------
let ezanSes = null;
let ezanAdres = null;

function ezanCubuguGoster(yazi, dugme, tikla) {
  $('ezanYazi').textContent = yazi;
  const b = $('ezanBtn');
  b.textContent = dugme;
  b.onclick = tikla;
  $('ezanCubugu').hidden = false;
}

function ezanDurdur() {
  if (ezanSes) {
    ezanSes.pause();
    ezanSes = null;
  }
  if (ezanAdres) {
    URL.revokeObjectURL(ezanAdres);
    ezanAdres = null;
  }
  $('ezanCubugu').hidden = true;
}

async function ezanCal(seviye) {
  const blob = await sesGetir();
  if (!(blob instanceof Blob) || !blob.type.startsWith('audio/')) return;
  ezanDurdur();
  ezanAdres = URL.createObjectURL(blob);
  const ses = new Audio(ezanAdres);
  ses.volume = Math.min(1, Math.max(0, Number(seviye) || 0.8));
  ses.addEventListener('ended', ezanDurdur);
  ezanSes = ses;
  try {
    await ses.play();
    ezanCubuguGoster('Ezan okunuyor', 'Sustur', ezanDurdur);
  } catch {
    // Tarayıcı kullanıcı dokunuşu olmadan sesi engelledi: dokunuşla çaldır.
    ezanCubuguGoster('Vakit girdi', '▶ Ezanı çal', () => ezanCal(seviye));
  }
}

// ---------------- Bildirim ----------------
async function bildirimGoster(baslik, mesaj) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  const secenek = { body: mesaj, icon: 'icons/icon-192.png', badge: 'icons/icon-192.png', tag: 'vakit', renotify: true };
  try {
    if ('serviceWorker' in navigator) {
      const kayit = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise((coz) => setTimeout(() => coz(null), 2000)),
      ]);
      if (kayit) {
        await kayit.showNotification(baslik, secenek);
        return;
      }
    }
  } catch {
    // aşağıdaki yönteme geç
  }
  try {
    new Notification(baslik, secenek);
  } catch {
    // bildirim gösterilemedi
  }
}

let kontrolde = false;
async function vakitKontrol() {
  if (kontrolde) return;
  kontrolde = true;
  try {
    const s = await getSettings();
    const st = await getState(new Date(), s);
    const c = st.current;
    if (st.now - c.date > 2 * 60000) return; // yalnızca vakit az önce girdiyse

    const isaret = `${c.key}|${c.date.getTime()}`;
    const { sonBildirim } = await chrome.storage.local.get('sonBildirim');
    if (sonBildirim === isaret) return;
    await chrome.storage.local.set({ sonBildirim: isaret });

    if (s.notify[c.key]) {
      const baslik = c.key === 'gunes' ? 'Güneş doğdu' : `${c.ad} vakti girdi`;
      const mesaj = c.key === 'gunes' ? 'Sabah namazı vakti çıktı.' : `Saat ${formatHM(c.date)}`;
      await bildirimGoster(baslik, mesaj);
    }
    if (s.ezan.vakitler[c.key]) await ezanCal(s.ezan.ses);
  } catch {
    // bir sonraki kontrolde tekrar denenir
  } finally {
    kontrolde = false;
  }
}

setInterval(vakitKontrol, 10000);
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) {
    yukle();
    vakitKontrol();
    gununKartlari();
  }
});

// Kayıtlı ikon seçimini uygula; ayarlardan yeni seçim gelince kaydet ve uygula.
chrome.storage.local.get('ikon').then((o) => ikonUygula(o.ikon));
document.addEventListener('ikon-sec', (e) => {
  const k = ikonBul(e.detail);
  chrome.storage.local.set({ ikon: k.id });
  ikonUygula(k.id);
});

mesajDinle((m) => {
  if (!m || typeof m.type !== 'string') return;
  if (m.type === 'ezan-dur') ezanDurdur();
  else if (m.type === 'yenile') yukle();
});

// ---------------- Kurulum ve izin kutusu ----------------
let yuklemeIstegi = null;

function bilgiKutusuCiz() {
  const kutu = $('bilgiKutu');
  kutu.replaceChildren();
  const bagimsiz = window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;

  if (!bagimsiz) {
    const k = el('div', { class: 'kutu-bilgi' });
    if (yuklemeIstegi) {
      k.append(
        el('p', { text: 'Uygulamayı ana ekrana ekleyip tam ekran kullanabilirsiniz.' }),
        el('button', {
          type: 'button',
          text: 'Uygulamayı yükle',
          onclick: async () => {
            const istek = yuklemeIstegi;
            yuklemeIstegi = null;
            try {
              await istek.prompt();
            } catch {
              // kullanıcı vazgeçti
            }
            bilgiKutusuCiz();
          },
        }),
      );
    } else {
      k.append(
        el('p', {
          text: 'Ana ekrana eklemek için: Android Chrome’da menü ▸ “Ana ekrana ekle” / “Uygulamayı yükle”. iPhone’da Safari’de Paylaş ▸ “Ana Ekrana Ekle”.',
        }),
      );
    }
    kutu.append(k);
  }

  if (!('Notification' in window)) {
    kutu.append(el('div', { class: 'kutu-bilgi' }, el('p', { text: 'Bu tarayıcı bildirimleri desteklemiyor. iPhone’da önce uygulamayı ana ekrana ekleyin.' })));
  } else if (Notification.permission === 'default') {
    kutu.append(
      el(
        'div',
        { class: 'kutu-bilgi' },
        el('p', { text: 'Vakit girince bildirim almak için izin verin.' }),
        el('button', {
          type: 'button',
          text: 'Bildirimleri aç',
          onclick: async () => {
            try {
              await Notification.requestPermission();
            } catch {
              // yok say
            }
            bilgiKutusuCiz();
          },
        }),
      ),
    );
  } else if (Notification.permission === 'denied') {
    kutu.append(el('div', { class: 'kutu-bilgi' }, el('p', { text: 'Bildirimler kapalı. Tarayıcı ya da telefon ayarlarından bu uygulama için açabilirsiniz.' })));
  }

  kutu.append(
    el('div', {
      class: 'not',
      text: 'Not: Bildirim ve ezan, uygulama açıkken veya telefon uygulamayı arka planda canlı tuttuğu sürece çalışır. Uygulama tamamen kapalıyken hatırlatma yapılamaz.',
    }),
  );
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  yuklemeIstegi = e;
  bilgiKutusuCiz();
});
window.addEventListener('appinstalled', () => {
  yuklemeIstegi = null;
  bilgiKutusuCiz();
});

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

bilgiKutusuCiz();
function gununKartlari() {
  import('./gunun.js')
    .then((m) => m.baslat($('gunun')))
    .catch(() => {});
}

// Önce vakitler yüklensin (önbelleğe yazılsın), sonra ezan/bildirim kontrolü yapılsın: tek ağ isteği olur.
yukle().then(() => {
  vakitKontrol();
  gununKartlari();
});
