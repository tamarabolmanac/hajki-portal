/**
 * Nasumična početna (hero) slika za Home ekran.
 *
 * SVE slike iz `src/assets/home-hero/` se automatski uključe u pool — samo ubaci
 * nove fajlove (.jpg/.jpeg/.png/.webp) u taj folder i rebuild-uj. Ne treba ručno
 * listati imena; webpack `require.context` ih sam pokupi.
 */
const ctx = require.context('../assets/home-hero', false, /\.(jpe?g|png|webp)$/i);

const IMAGES = ctx.keys().map((k) => {
  const mod = ctx(k);
  return mod && mod.default ? mod.default : mod; // URL slike (hashed asset)
});

export const heroImageCount = IMAGES.length;

/**
 * Vrati nasumičnu hero sliku. `avoid` (URL prethodne) se preskače da se ista
 * slika ne pojavi dva puta zaredom (kad ima > 1 sliku u pool-u).
 */
export function pickRandomHero(avoid) {
  if (IMAGES.length === 0) return null;
  if (IMAGES.length === 1) return IMAGES[0];
  let pick;
  do {
    pick = IMAGES[Math.floor(Math.random() * IMAGES.length)];
  } while (pick === avoid);
  return pick;
}
