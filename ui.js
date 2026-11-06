// Güvenli DOM yardımcısı: içerik her zaman düz metin olarak eklenir (innerHTML kullanılmaz).

export function el(etiket, ozellikler = {}, ...cocuklar) {
  const e = document.createElement(etiket);
  for (const [k, v] of Object.entries(ozellikler)) {
    if (k === 'class') e.className = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else e.setAttribute(k, String(v));
  }
  e.append(...cocuklar.filter((c) => c !== null && c !== undefined));
  return e;
}
