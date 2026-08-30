// Podrazumevana slika za rute BEZ uploadovane slike. Umesto jedne statične
// default slike, biramo nasumično jednu iz src/assets/route-default/.
//
// Izbor je "nasumičan ali stabilan po ruti": zasnovan na id-ju rute, pa svaka
// ruta uvek dobije istu sliku (ne treperi pri re-renderu), a raspodela preko
// svih ruta deluje nasumično.
//
// Slike se učitavaju kroz webpack require.context — dovoljno je dodati/izbaciti
// fajl iz foldera, bez menjanja koda.

let images = [];
try {
  const ctx = require.context("../assets/route-default", false, /\.(png|jpe?g|webp)$/i);
  images = ctx
    .keys()
    .sort()
    .map((k) => {
      const mod = ctx(k);
      return mod && mod.default ? mod.default : mod;
    });
} catch (_) {
  images = [];
}

// Fallback ako folder nekim slučajem nije spakovan (stara statična slika).
const FALLBACK = "/img/route-default.png";

/** Vrati URL podrazumevane slike za dati seed (obično hike.id). */
export function defaultRouteImage(seed) {
  if (!images.length) return FALLBACK;
  const n = Number(seed);
  const idx = Number.isFinite(n)
    ? Math.abs(Math.trunc(n)) % images.length
    : Math.floor(Math.random() * images.length);
  return images[idx];
}

export default defaultRouteImage;
