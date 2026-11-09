// "Okumayı öğren" bölümünün içeriği: harfler, harekeler ve kısa sureler.
// Ses dosyaları (ses/harf/XXXX.mp3) harflerin adlarını okur; kod, harfin Unicode numarasıdır.

// bag: false → harf kendinden sonraki harfe bağlanmaz (başta/ortada biçimi yoktur)
export const HARFLER = [
  { id: '0627', ar: 'ا', ad: 'Elif', ses: 'Sesli harf. Hareke taşımaz; üstündeki/altındaki harekeyi uzatır (â).', bag: false },
  { id: '0628', ar: 'ب', ad: 'Be', ses: 'Türkçedeki “b”.', bag: true },
  { id: '062A', ar: 'ت', ad: 'Te', ses: 'Türkçedeki “t”.', bag: true },
  { id: '062B', ar: 'ث', ad: 'Se', ses: 'Dil ucu üst dişlerin arasında, hafifçe “s” (İngilizce “think” gibi).', bag: true },
  { id: '062C', ar: 'ج', ad: 'Cim', ses: 'Türkçedeki “c”.', bag: true },
  { id: '062D', ar: 'ح', ad: 'Ha', ses: 'Boğazın ortasından çıkan, nefes verir gibi hırıltılı “h”.', bag: true },
  { id: '062E', ar: 'خ', ad: 'Hı', ses: 'Boğazdan sert “h” (Almanca “Bach” sesi).', bag: true },
  { id: '062F', ar: 'د', ad: 'Dal', ses: 'Türkçedeki “d”.', bag: false },
  { id: '0630', ar: 'ذ', ad: 'Zel', ses: 'Dil ucu dişlerin arasında “z” (İngilizce “this” gibi).', bag: false },
  { id: '0631', ar: 'ر', ad: 'Ra', ses: 'Türkçedeki “r”, dil ucu titrer.', bag: false },
  { id: '0632', ar: 'ز', ad: 'Ze', ses: 'Türkçedeki “z”.', bag: false },
  { id: '0633', ar: 'س', ad: 'Sin', ses: 'Türkçedeki “s”.', bag: true },
  { id: '0634', ar: 'ش', ad: 'Şın', ses: 'Türkçedeki “ş”.', bag: true },
  { id: '0635', ar: 'ص', ad: 'Sad', ses: 'Kalın “s”: ağız dolgun, dil geriye çekilir.', bag: true },
  { id: '0636', ar: 'ض', ad: 'Dad', ses: 'Kalın “d”: ağız dolgun, dilin yan kenarı kullanılır.', bag: true },
  { id: '0637', ar: 'ط', ad: 'Tı', ses: 'Kalın “t”: ağız dolgun.', bag: true },
  { id: '0638', ar: 'ظ', ad: 'Zı', ses: 'Kalın “z”: dil ucu dişlerin arasında, ağız dolgun.', bag: true },
  { id: '0639', ar: 'ع', ad: 'Ayn', ses: 'Boğazın derinlerinden çıkan ses; Türkçede karşılığı yok. Dinleyerek öğrenilir.', bag: true },
  { id: '063A', ar: 'غ', ad: 'Gayn', ses: 'Gargara yapar gibi “ğ”.', bag: true },
  { id: '0641', ar: 'ف', ad: 'Fe', ses: 'Türkçedeki “f”.', bag: true },
  { id: '0642', ar: 'ق', ad: 'Kaf', ses: 'Damağın en gerisinden kalın “k”.', bag: true },
  { id: '0643', ar: 'ك', ad: 'Kef', ses: 'Türkçedeki ince “k”.', bag: true },
  { id: '0644', ar: 'ل', ad: 'Lam', ses: 'Türkçedeki “l”.', bag: true },
  { id: '0645', ar: 'م', ad: 'Mim', ses: 'Türkçedeki “m”.', bag: true },
  { id: '0646', ar: 'ن', ad: 'Nun', ses: 'Türkçedeki “n”.', bag: true },
  { id: '0647', ar: 'ه', ad: 'He', ses: 'Hafif, nefesli “h”.', bag: true },
  { id: '0648', ar: 'و', ad: 'Vav', ses: '“v” ile “w” arası; uzatma harfi olarak “û”.', bag: false },
  { id: '064A', ar: 'ي', ad: 'Ye', ses: 'Türkçedeki “y”; uzatma harfi olarak “î”.', bag: true },
];

// Kalın okunan (istila) harfler: üstün bunlarda “a”, diğerlerinde “e” gibi okunur.
export const KALIN = ['ص', 'ض', 'ط', 'ظ', 'ق', 'خ', 'غ'];

export const HAREKELER = [
  {
    ad: 'Üstün (fetha)',
    isaret: 'ـَ',
    aciklama: 'Harfin üstüne konur, “e” veya “a” sesi verir. Kalın harflerde (ص ض ط ظ ق خ غ) “a” okunur.',
    ornekler: [['بَ', 'be'], ['تَ', 'te'], ['كَ', 'ke'], ['قَ', 'ka']],
  },
  {
    ad: 'Esre (kesra)',
    isaret: 'ـِ',
    aciklama: 'Harfin altına konur, “i” sesi verir.',
    ornekler: [['بِ', 'bi'], ['تِ', 'ti'], ['لِ', 'li'], ['مِ', 'mi']],
  },
  {
    ad: 'Ötre (damme)',
    isaret: 'ـُ',
    aciklama: 'Harfin üstüne konur, “u” (veya “ü”) sesi verir.',
    ornekler: [['بُ', 'bu'], ['تُ', 'tu'], ['لُ', 'lu'], ['مُ', 'mu']],
  },
  {
    ad: 'Cezm (sükûn)',
    isaret: 'ـْ',
    aciklama: 'Küçük daire. Harf sesli okunmaz; önceki harfe yapışık, ünlüsüz okunur.',
    ornekler: [['مَنْ', 'men'], ['قَدْ', 'kad'], ['أَنْ', 'en'], ['لَمْ', 'lem']],
  },
  {
    ad: 'Şedde (teşdid)',
    isaret: 'ـّ',
    aciklama: 'Harfin iki kez okunacağını gösterir: önce önceki hece biter, sonra harf yeniden başlar.',
    ornekler: [['رَبِّ', 'rabbi'], ['أُمٌّ', 'ummün'], ['حَقٌّ', 'hakkun']],
  },
  {
    ad: 'Tenvin',
    isaret: 'ـً  ـٍ  ـٌ',
    aciklama: 'Kelimenin sonunda çift hareke: “-en”, “-in”, “-ün” sesi ekler (n sesi gelir).',
    ornekler: [['كِتَابٌ', 'kitâbün'], ['عِلْمٌ', 'ilmün'], ['رَجُلٍ', 'raculin']],
  },
  {
    ad: 'Med (uzatma)',
    isaret: 'ا  و  ي',
    aciklama: 'Elif, vav ve ye harfleri, kendinden önceki harekeyle uyumluysa sesi uzatır: üstün+elif = â, ötre+vav = û, esre+ye = î.',
    ornekler: [['قَالَ', 'kâle'], ['يَقُولُ', 'yekûlü'], ['قِيلَ', 'kîle']],
  },
];

// Namazda okunan kısa sureler. Metin ve okunuş el yazımıdır; Kur'an sekmesindeki metinle karşılaştırın.
export const SURELER = [
  {
    ad: 'Fâtiha', no: 1,
    ayetler: [
      ['بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 'bismillâhir-rahmânir-rahîm', 'Rahman ve Rahim olan Allah’ın adıyla.'],
      ['الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 'el-hamdü lillâhi rabbil-âlemîn', 'Hamd, âlemlerin Rabbi Allah’a mahsustur.'],
      ['الرَّحْمَٰنِ الرَّحِيمِ', 'er-rahmânir-rahîm', 'O, Rahman’dır, Rahim’dir.'],
      ['مَالِكِ يَوْمِ الدِّينِ', 'mâliki yevmid-dîn', 'Hesap gününün sahibidir.'],
      ['إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 'iyyâke na‘büdü ve iyyâke nestaîn', 'Yalnız sana ibadet ederiz, yalnız senden yardım isteriz.'],
      ['اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 'ihdinas-sırâtal-müstakîm', 'Bizi doğru yola ilet.'],
      ['صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 'sırâtal-lezîne en‘amte aleyhim gayril-mağdûbi aleyhim ve led-dâllîn', 'Kendilerine nimet verdiklerinin yoluna; gazaba uğrayanların ve sapkınların yoluna değil.'],
    ],
  },
  {
    ad: 'İhlâs', no: 112,
    ayetler: [
      ['قُلْ هُوَ اللَّهُ أَحَدٌ', 'kul hüvallâhü ehad', 'De ki: O, Allah’tır, bir tektir.'],
      ['اللَّهُ الصَّمَدُ', 'allâhüs-samed', 'Allah sameddir (her şey O’na muhtaçtır).'],
      ['لَمْ يَلِدْ وَلَمْ يُولَدْ', 'lem yelid ve lem yûled', 'Doğurmadı ve doğurulmadı.'],
      ['وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ', 've lem yekün lehû küfüven ehad', 'Hiçbir şey O’na denk değildir.'],
    ],
  },
  {
    ad: 'Felak', no: 113,
    ayetler: [
      ['قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', 'kul eûzü birabbil-felak', 'De ki: Sabahın Rabbine sığınırım.'],
      ['مِنْ شَرِّ مَا خَلَقَ', 'min şerri mâ halak', 'Yarattığı şeylerin şerrinden.'],
      ['وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ', 've min şerri gâsikın izâ vekab', 'Karanlığı çöktüğünde gecenin şerrinden.'],
      ['وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', 've min şerrin-neffâsâti fil-ukad', 'Düğümlere üfleyenlerin şerrinden.'],
      ['وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ', 've min şerri hâsidin izâ hased', 'Haset ettiği zaman hasetçinin şerrinden.'],
    ],
  },
  {
    ad: 'Nâs', no: 114,
    ayetler: [
      ['قُلْ أَعُوذُ بِرَبِّ النَّاسِ', 'kul eûzü birabbin-nâs', 'De ki: İnsanların Rabbine sığınırım.'],
      ['مَلِكِ النَّاسِ', 'melikin-nâs', 'İnsanların Melik’ine.'],
      ['إِلَٰهِ النَّاسِ', 'ilâhin-nâs', 'İnsanların İlah’ına.'],
      ['مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', 'min şerril-vesvâsil-hannâs', 'Sinsi vesvesecinin şerrinden.'],
      ['الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', 'ellezî yüvesvisü fî sudûrin-nâs', 'O ki insanların kalplerine vesvese verir.'],
      ['مِنَ الْجِنَّةِ وَالنَّاسِ', 'minel-cinneti ven-nâs', 'Cinlerden de insanlardan da.'],
    ],
  },
  {
    ad: 'Kevser', no: 108,
    ayetler: [
      ['إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ', 'innâ a‘taynâkel-kevser', 'Şüphesiz sana Kevser’i verdik.'],
      ['فَصَلِّ لِرَبِّكَ وَانْحَرْ', 'fesalli lirabbike venhar', 'Öyleyse Rabbin için namaz kıl ve kurban kes.'],
      ['إِنَّ شَانِئَكَ هُوَ الْأَبْتَرُ', 'inne şâni’eke hüvel-ebter', 'Asıl soyu kesik olan, sana kin besleyendir.'],
    ],
  },
  {
    ad: 'Asr', no: 103,
    ayetler: [
      ['وَالْعَصْرِ', 'vel-asr', 'Asra yemin olsun ki,'],
      ['إِنَّ الْإِنْسَانَ لَفِي خُسْرٍ', 'innel-insâne lefî husr', 'insan gerçekten ziyandadır.'],
      ['إِلَّا الَّذِينَ آمَنُوا وَعَمِلُوا الصَّالِحَاتِ وَتَوَاصَوْا بِالْحَقِّ وَتَوَاصَوْا بِالصَّبْرِ', 'illel-lezîne âmenû ve amilüs-sâlihâti ve tevâsav bil-hakkı ve tevâsav bis-sabr', 'Ancak iman edip salih ameller işleyenler, birbirine hakkı ve sabrı tavsiye edenler hariç.'],
    ],
  },
];
