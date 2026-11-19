/**
 * Renders the Open Graph cards (1200 × 630 JPG) and the touch icon into public/.
 * Social networks do not show SVG previews, so these are bitmaps. Run it again after a visual change:
 *   npm run social:cards
 */
import { chromium } from '@playwright/test';
import { mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { ZODIAC_SIGNS, type ZodiacSign } from '../src/zodiac/signs.ts';
import { circlePath, spokesPath, ticksPath, WHEEL_CENTER, WHEEL_RADII, wheelSectors } from '../src/zodiac/wheel.ts';

const require = createRequire(import.meta.url);
const fontData = (path: string) => readFileSync(require.resolve(path)).toString('base64');
const DISPLAY_FONT = fontData('@fontsource-variable/playfair-display/files/playfair-display-latin-wght-normal.woff2');
const BODY_FONT = fontData('@fontsource-variable/dm-sans/files/dm-sans-latin-wght-normal.woff2');
const OUTPUT = join(process.cwd(), 'public', 'social');

function wheel(accent: string): string {
  const rings = [WHEEL_RADII.outer, WHEEL_RADII.ticks, WHEEL_RADII.labelsInner, WHEEL_RADII.glyphsInner, WHEEL_RADII.hub];
  const labels = wheelSectors()
    .map((sector) => `<text text-anchor="middle" class="label"><textPath href="#ring" startOffset="${sector.labelOffset}%">${sector.name.toUpperCase()}</textPath></text>`)
    .join('');
  const glyphs = wheelSectors()
    .map((s) => `<text x="${s.glyph.x}" y="${s.glyph.y}" transform="rotate(${s.glyph.rotate} ${s.glyph.x} ${s.glyph.y})" text-anchor="middle" dominant-baseline="central" class="glyph">${s.symbol}</text>`)
    .join('');
  return `<svg class="wheel" viewBox="0 0 1000 1000">
    <defs><path id="ring" d="${circlePath(WHEEL_RADII.labels - 8)}"/></defs>
    <g fill="none" stroke="${accent}" stroke-opacity="0.5" stroke-width="1.4">
      ${rings.map((r) => `<circle cx="${WHEEL_CENTER}" cy="${WHEEL_CENTER}" r="${r}"/>`).join('')}
      <path d="${ticksPath()}"/><path d="${spokesPath()}" stroke-opacity="0.35"/>
    </g>${labels}${glyphs}
  </svg>`;
}

function card({ accent, eyebrow, title, subtitle, symbol }: { accent: string; eyebrow: string; title: string; subtitle: string; symbol?: string }): string {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
    @font-face { font-family: Display; src: url(data:font/woff2;base64,${DISPLAY_FONT}) format('woff2'); font-weight: 400 900; }
    @font-face { font-family: Body; src: url(data:font/woff2;base64,${BODY_FONT}) format('woff2'); font-weight: 100 1000; }
    * { margin: 0; box-sizing: border-box; }
    body { width: 1200px; height: 630px; overflow: hidden; position: relative; color: #eeeaf7; font-family: Body, sans-serif;
      background: radial-gradient(ellipse 70% 90% at 78% 50%, ${accent}33, transparent 70%), radial-gradient(ellipse 80% 70% at 20% 0%, #263160aa, transparent 70%), #05070f; }
    .wheel { position: absolute; width: 920px; height: 920px; right: -230px; top: -145px; opacity: 0.55; transform: rotate(-12deg); }
    .label { fill: #efd394; fill-opacity: 0.75; font-family: Display; font-size: 25px; font-weight: 600; letter-spacing: 5px; }
    .glyph { fill: ${accent}; font-family: 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', serif; font-size: 46px; font-variant-emoji: text; }
    .veil { position: absolute; inset: 0; background: linear-gradient(90deg, #05070f 0%, #05070fee 38%, #05070f55 70%, transparent); }
    .content { position: absolute; left: 80px; top: 0; bottom: 0; width: 640px; display: flex; flex-direction: column; justify-content: center; gap: 22px; }
    .eyebrow { color: #efd394; font-size: 22px; font-weight: 700; letter-spacing: 0.24em; text-transform: uppercase; }
    h1 { font-family: Display; font-size: ${symbol ? 112 : 92}px; font-weight: 700; line-height: 1; }
    h1 em { font-style: normal; color: ${accent}; }
    p { color: #bdb9d3; font-size: 30px; line-height: 1.35; }
    .brand { position: absolute; left: 80px; bottom: 56px; display: flex; align-items: center; gap: 14px; font-family: Display; font-size: 28px; font-weight: 600; }
    .brand svg { width: 44px; height: 44px; }
    .orb { position: absolute; right: 150px; top: 165px; width: 300px; height: 300px; border-radius: 50%; display: grid; place-items: center;
      background: radial-gradient(circle at 35% 30%, ${accent}55, transparent 62%), #0d1124; box-shadow: inset 0 0 0 2px ${accent}88, 0 0 80px ${accent}55; }
    .orb span { color: ${accent}; font-size: 160px; line-height: 1; font-family: 'Segoe UI Symbol', 'Noto Sans Symbols 2', 'DejaVu Sans', serif; font-variant-emoji: text; text-shadow: 0 0 30px ${accent}; }
  </style></head><body>
    ${wheel(accent)}<div class="veil"></div>
    ${symbol ? `<div class="orb"><span>${symbol}</span></div>` : ''}
    <div class="content"><span class="eyebrow">${eyebrow}</span><h1>${title}</h1><p>${subtitle}</p></div>
    <div class="brand"><svg viewBox="0 0 64 64">${readFileSync(join(process.cwd(), 'public', 'favicon.svg'), 'utf8').replace(/^[\s\S]*?<\/title>/, '').replace('</svg>', '')}</svg>Ranking Zodiacal</div>
  </body></html>`;
}

const signCard = (sign: ZodiacSign) =>
  card({ accent: sign.accent, eyebrow: `Signo de ${sign.element.toLowerCase()} · ${sign.dateRange}`, title: sign.name, subtitle: 'Horóscopo de hoy, mañana, la semana y el mes, con su lugar en el ranking.', symbol: sign.symbol });

mkdirSync(OUTPUT, { recursive: true });
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });

const render = async (html: string, file: string) => {
  await page.setContent(html, { waitUntil: 'load' });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: join(OUTPUT, file), type: 'jpeg', quality: 86 });
  console.log('public/social/' + file);
};

await render(
  card({ accent: '#e2b865', eyebrow: 'Horóscopo semanal', title: 'Tu semana,<br><em>en perspectiva.</em>', subtitle: 'El ranking de los 12 signos, calculado con la posición real del Sol, la Luna y los planetas.' }),
  'ranking-zodiacal.jpg',
);
for (const sign of ZODIAC_SIGNS) await render(signCard(sign), `${sign.slug}.jpg`);

// Touch icon for iOS home screens.
await page.setViewportSize({ width: 180, height: 180 });
await page.setContent(`<body style="margin:0">${readFileSync(join(process.cwd(), 'public', 'favicon.svg'), 'utf8').replace('<svg ', '<svg width="180" height="180" ').replace('rx="14"', 'rx="0"')}</body>`);
await page.screenshot({ path: join(process.cwd(), 'public', 'apple-touch-icon.png') });
console.log('public/apple-touch-icon.png');

await browser.close();
