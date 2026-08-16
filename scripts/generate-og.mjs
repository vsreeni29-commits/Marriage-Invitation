/**
 * Renders the WhatsApp / Open Graph share image.
 *
 *   node scripts/generate-og.mjs
 *
 * Uses the same emblem geometry as the site, so the preview card and the
 * invitation are unmistakably the same object. Requires `sharp` and the
 * Pinyon Script / Cormorant Garamond / Jost fonts installed locally; the generated PNG is
 * committed, so this only needs re-running when the artwork changes.
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '../public');

/* --- geometry (mirrors src/utils/geometry.ts) ---------------------- */

const toRad = (deg) => (deg * Math.PI) / 180;
const polar = (cx, cy, r, deg) => ({
  x: cx + r * Math.sin(toRad(deg)),
  y: cy - r * Math.cos(toRad(deg)),
});
const fmt = (n) => Number(n.toFixed(2));
const pt = (p) => `${fmt(p.x)} ${fmt(p.y)}`;

const polygonPath = (cx, cy, r, sides, rotation = 0) => {
  const step = 360 / sides;
  const coords = [];
  for (let i = 0; i < sides; i += 1) coords.push(pt(polar(cx, cy, r, rotation + i * step)));
  return `M ${coords.join(' L ')} Z`;
};

const loopRingPath = (cx, cy, radius, loops, loopSize, rotation = 0) => {
  const step = 360 / loops;
  const r = radius * loopSize;
  let d = `M ${pt(polar(cx, cy, radius, rotation))}`;
  for (let i = 1; i <= loops; i += 1) {
    d += ` A ${fmt(r)} ${fmt(r)} 0 1 1 ${pt(polar(cx, cy, radius, rotation + i * step))}`;
  }
  return `${d} Z`;
};

const petalRosettePath = (cx, cy, radius, petals, rotation = 0, width = 20) => {
  const step = 360 / petals;
  let d = '';
  for (let i = 0; i < petals; i += 1) {
    const a = rotation + i * step;
    d +=
      `M ${fmt(cx)} ${fmt(cy)} C ${pt(polar(cx, cy, radius * 0.42, a - width))} ` +
      `${pt(polar(cx, cy, radius * 0.86, a - width * 0.55))} ${pt(polar(cx, cy, radius, a))} ` +
      `C ${pt(polar(cx, cy, radius * 0.86, a + width * 0.55))} ` +
      `${pt(polar(cx, cy, radius * 0.42, a + width))} ${fmt(cx)} ${fmt(cy)} `;
  }
  return d.trim();
};

const dotRing = (cx, cy, r, count, rotation = 0) =>
  Array.from({ length: count }, (_, i) => polar(cx, cy, r, rotation + (360 / count) * i));

/* --- emblem --------------------------------------------------------- */

function emblem(cx, cy, scale) {
  const s = (n) => n * scale;
  return `
    <g>
      <circle cx="${cx}" cy="${cy}" r="${s(72)}" fill="url(#glow)" />
      <circle cx="${cx}" cy="${cy}" r="${s(92)}" stroke="#a9854b" stroke-opacity="0.5"
              stroke-width="${s(0.9)}" stroke-dasharray="${s(1.5)} ${s(7)}" fill="none" />
      <circle cx="${cx}" cy="${cy}" r="${s(86)}" stroke="#a9854b" stroke-opacity="0.32"
              stroke-width="${s(0.7)}" fill="none" />
      <path d="${polygonPath(cx, cy, s(78), 4, 0)}" stroke="#35594a" stroke-opacity="0.55"
            stroke-width="${s(1)}" fill="none" stroke-linejoin="round" />
      <path d="${polygonPath(cx, cy, s(78), 4, 45)}" stroke="#35594a" stroke-opacity="0.55"
            stroke-width="${s(1)}" fill="none" stroke-linejoin="round" />
      <path d="${polygonPath(cx, cy, s(62), 8, 22.5)}" stroke="#a9854b" stroke-opacity="0.6"
            stroke-width="${s(0.9)}" fill="none" stroke-linejoin="round" />
      ${dotRing(cx, cy, s(70), 8, 22.5)
        .map((p) => `<circle cx="${fmt(p.x)}" cy="${fmt(p.y)}" r="${s(1.7)}" fill="#a9854b" fill-opacity="0.7" />`)
        .join('')}
      <path d="${loopRingPath(cx, cy, s(44), 8, 0.5)}" stroke="#a9854b" stroke-opacity="0.85"
            stroke-width="${s(1.05)}" fill="none" stroke-linecap="round" />
      <path d="${petalRosettePath(cx, cy, s(38), 8, 22.5, 19)}" fill="#c3a570" fill-opacity="0.16"
            stroke="#6d8b74" stroke-opacity="0.5" stroke-width="${s(0.75)}" />
      <circle cx="${cx}" cy="${cy}" r="${s(7.5)}" fill="#a9854b" fill-opacity="0.85" />
      <circle cx="${cx}" cy="${cy}" r="${s(12)}" stroke="#a9854b" stroke-opacity="0.45"
              stroke-width="${s(0.7)}" fill="none" />
    </g>`;
}

/* --- share image ----------------------------------------------------- */

const W = 1200;
const H = 630;

const shareSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c9a96a" stop-opacity="0.42" />
      <stop offset="60%" stop-color="#c9a96a" stop-opacity="0.1" />
      <stop offset="100%" stop-color="#c9a96a" stop-opacity="0" />
    </radialGradient>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#fdfaf4" />
      <stop offset="55%" stop-color="#f6eee1" />
      <stop offset="100%" stop-color="#efe3cf" />
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#paper)" />

  <!-- kasavu border -->
  <rect x="26" y="26" width="${W - 52}" height="${H - 52}" fill="none"
        stroke="#a9854b" stroke-opacity="0.45" stroke-width="1.5" />
  <rect x="38" y="38" width="${W - 76}" height="${H - 76}" fill="none"
        stroke="#a9854b" stroke-opacity="0.3" stroke-width="1" stroke-dasharray="3 9" />

  <!-- corner ornaments -->
  ${[
    [96, 96, 0],
    [W - 96, 96, 90],
    [W - 96, H - 96, 180],
    [96, H - 96, 270],
  ]
    .map(
      ([x, y, rot]) => `<g transform="translate(${x} ${y}) rotate(${rot})" opacity="0.5">
        <path d="M -34 0 Q -16 -18 0 0 Q 16 18 34 0" stroke="#6d8b74" stroke-width="1.4" fill="none" />
        <path d="${polygonPath(0, 0, 13, 4, 0)}" stroke="#a9854b" stroke-width="1.2" fill="none" />
        <path d="${polygonPath(0, 0, 13, 4, 45)}" stroke="#a9854b" stroke-width="1.2" fill="none" />
      </g>`,
    )
    .join('')}

  ${emblem(W / 2, 178, 0.8)}

  <text x="${W / 2}" y="392" text-anchor="middle" font-family="Pinyon Script"
        font-size="128" fill="#a9854b">Rinsha <tspan font-family="Cormorant Garamond" font-style="italic" font-size="58">&amp;</tspan> Sreeni</text>

  <text x="${W / 2}" y="444" text-anchor="middle" font-family="Jost" font-size="21"
        letter-spacing="8" fill="#6b6055">TWO TRADITIONS · TWO CULTURES · ONE BEGINNING</text>

  <line x1="${W / 2 - 190}" y1="482" x2="${W / 2 + 190}" y2="482" stroke="#a9854b" stroke-opacity="0.4" />

  <text x="${W / 2}" y="534" text-anchor="middle" font-family="Cormorant Garamond"
        font-size="50" fill="#6d2b33">17 September 2026</text>

  <text x="${W / 2}" y="576" text-anchor="middle" font-family="Jost" font-size="20"
        letter-spacing="6" fill="#6b6055">WEDDING RECEPTION · CHENNAI</text>
</svg>`;

/* --- favicon ---------------------------------------------------------- */

const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 200 200">
  <defs>
    <radialGradient id="glow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="#c9a96a" stop-opacity="0.5" />
      <stop offset="100%" stop-color="#c9a96a" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="200" height="200" rx="34" fill="#fcf9f3" />
  ${emblem(100, 100, 0.94)}
</svg>`;

mkdirSync(publicDir, { recursive: true });
writeFileSync(resolve(publicDir, 'favicon.svg'), faviconSvg);

const render = async (svg, file, width) => {
  await sharp(Buffer.from(svg), { density: 200 })
    .resize({ width })
    .png({ quality: 90, compressionLevel: 9 })
    .toFile(resolve(publicDir, file));
  console.log(`wrote public/${file}`);
};

await render(shareSvg, 'og-image.png', W);
await render(faviconSvg, 'apple-touch-icon.png', 180);
await render(faviconSvg, 'favicon-96.png', 96);
console.log('wrote public/favicon.svg');
