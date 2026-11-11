/**
 * Renders every app icon, splash and favicon PNG from the SVG sources in
 * assets/logo/. Run with `bun run icons` after editing the logo.
 *
 * assets/logo/glyph.svg is the single source: the white mark on a transparent
 * 1024 canvas. assets/logo/logo.svg (the full icon tile) is written from it.
 */
import { readFileSync, writeFileSync, copyFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const logoDir = join(root, 'assets/logo');
const imagesDir = join(root, 'assets/images');

export const ACCENT = '#6C47FF';
export const ACCENT_DARK = '#8B70FF';

const glyphSvg = readFileSync(join(logoDir, 'glyph.svg'), 'utf8');
const glyphBody = glyphSvg.replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '');

/** Wraps the glyph in a 1024 canvas, scaled about the centre and recoloured. */
function glyph({ scale = 1, color = '#FFFFFF', background } = {}) {
  const offset = 512 * (1 - scale);
  const bg = background ? `<rect width="1024" height="1024" fill="${background}"/>` : '';
  const body = glyphBody.replaceAll('#FFFFFF', color);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${bg}<g transform="translate(${offset} ${offset}) scale(${scale})">${body}</g></svg>`;
}

const logoSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1024" y2="1024" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="${ACCENT_DARK}"/>
      <stop offset="1" stop-color="${ACCENT}"/>
    </linearGradient>
  </defs>
  <rect width="1024" height="1024" fill="url(#bg)"/>
  <g>${glyphBody}</g>
</svg>
`;
writeFileSync(join(logoDir, 'logo.svg'), logoSvg);
console.log('wrote assets/logo/logo.svg');

function render(svg, size, file) {
  const png = new Resvg(svg, { fitTo: { mode: 'width', value: size } }).render().asPng();
  writeFileSync(join(imagesDir, file), png);
  console.log(`wrote assets/images/${file} (${size}x${size})`);
}

// Full-bleed square icon; iOS and Android legacy launchers apply their own mask.
render(logoSvg, 1024, 'icon.png');

// Web favicon: the tile with rounded corners so it reads well in browser tabs.
render(
  logoSvg.replace('<rect width="1024" height="1024"', '<rect width="1024" height="1024" rx="224"'),
  48,
  'favicon.png',
);

// Android adaptive icon. The glyph is scaled down to sit inside the 66dp safe
// zone of the 108dp canvas (a circle ~61% of the width).
render(glyph({ scale: 0.78 }), 1024, 'android-icon-foreground.png');
render(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${ACCENT}"/></svg>`, 1024, 'android-icon-background.png');
render(glyph({ scale: 0.78 }), 1024, 'android-icon-monochrome.png');

// Splash: accent glyph on the app background (white / black via app.json).
render(glyph({ color: ACCENT }), 1024, 'splash-icon.png');
render(glyph({ color: ACCENT_DARK }), 1024, 'splash-icon-dark.png');

// iOS Icon Composer bundle layer.
const iconAssets = join(root, 'assets/app.icon/Assets');
mkdirSync(iconAssets, { recursive: true });
copyFileSync(join(logoDir, 'glyph.svg'), join(iconAssets, 'glyph.svg'));
console.log('copied glyph.svg into assets/app.icon/Assets');
