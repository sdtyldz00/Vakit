// Hicri takvim: tarayıcının Umm al-Qura takvimiyle yerel hesap (internet gerekmez).

export const HICRI_AYLAR = [
  'Muharrem', 'Safer', 'Rebiülevvel', 'Rebiülahir', 'Cemaziyelevvel', 'Cemaziyelahir',
  'Recep', 'Şaban', 'Ramazan', 'Şevval', 'Zilkade', 'Zilhicce',
];

const bicim = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura-nu-latn', {
  day: 'numeric', month: 'numeric', year: 'numeric', timeZone: 'UTC',
});

// y: yıl, m: 1-12 (miladi), d: gün, adj: Hicri gün ayarı
export function hicriDon(y, m, d, adj = 0) {
  const parcalar = bicim.formatToParts(new Date(Date.UTC(y, m - 1, d + adj, 12)));
  const al = (tur) => Number(parcalar.find((p) => p.type === tur).value);
  return { day: al('day'), month: al('month'), year: al('year') };
}

export function hicriTarih(date, adj = 0) {
  return hicriDon(date.getFullYear(), date.getMonth() + 1, date.getDate(), adj);
}

export function hicriMetin(h) {
  return `${h.day} ${HICRI_AYLAR[h.month - 1]} ${h.year}`;
}

// Hicri ay + gün ile tanımlı mübarek günler. Kandiller, gösterilen günden bir önceki akşam başlar.
const OLAYLAR = [
  { ay: 1, gun: 1, ad: 'Hicri Yılbaşı' },
  { ay: 1, gun: 10, ad: 'Aşure Günü' },
  { ay: 3, gun: 12, ad: 'Mevlid Kandili' },
  { ay: 7, gun: 1, ad: "Recep'in İlk Günü (Üç Aylar)" },
  { ay: 7, ilkCuma: true, ad: 'Regaib Kandili' },
  { ay: 7, gun: 27, ad: 'İsra ve Miraç Kandili' },
  { ay: 8, gun: 15, ad: 'Berat Kandili' },
  { ay: 9, gun: 1, ad: "Ramazan'ın İlk Günü" },
  { ay: 9, gun: 27, ad: 'Kadir Gecesi' },
  { ay: 10, gun: 1, ad: 'Ramazan Bayramı' },
  { ay: 12, gun: 9, ad: 'Arefe' },
  { ay: 12, gun: 10, ad: 'Kurban Bayramı' },
];

// baslangic gününden itibaren gunSayisi gün içindeki mübarek günleri tarih sırasıyla döndürür.
export function mubarekGunler(baslangic, adj = 0, gunSayisi = 400) {
  const sonuc = [];
  for (let i = 0; i < gunSayisi; i++) {
    const tarih = new Date(baslangic.getFullYear(), baslangic.getMonth(), baslangic.getDate() + i);
    const h = hicriTarih(tarih, adj);
    for (const o of OLAYLAR) {
      if (o.ay !== h.month) continue;
      const uyar = o.ilkCuma ? tarih.getDay() === 5 && h.day <= 7 : o.gun === h.day;
      if (uyar) sonuc.push({ ad: o.ad, tarih, hicri: h });
    }
  }
  return sonuc;
}
