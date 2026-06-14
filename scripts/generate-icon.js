/*
 * Generates the app icon assets from a single SVG definition.
 * - Blue "Anmaat" mark (the linked dual-circle glyph) + Arabic name "انماط".
 * Run: node scripts/generate-icon.js
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const ASSETS = path.join(__dirname, '..', 'assets');

// The linked-glyph mark: four soft circles (top-right, mid pair, bottom-left)
// connected by two diagonal bars, mirroring the website's blue logo.
// `cx,cy` is the centre; `unit` is the half-extent of the glyph in px.
function markGlyph(cx, cy, unit, color) {
  // Design space: a square from -100..100 centred at the origin.
  const P = (x, y) => `${(cx + (x / 100) * unit).toFixed(2)} ${(cy + (y / 100) * unit).toFixed(2)}`;
  const r = (0.26 * unit).toFixed(2);
  const sw = (0.30 * unit).toFixed(2);
  // Two parallel diagonal links (//), each capped with a circle at both ends,
  // and the pair offset so the four circles sit at the corners — like the logo.
  // Right link: top-right down to bottom-centre-right.
  // Left link:  top-centre-left down to bottom-left. Both slope the same way.
  const rTop = [60, -58];
  const rBot = [12, 30];
  const lTop = [-12, -30];
  const lBot = [-60, 58];
  const c = (p) => `<circle cx="${P(p[0], p[1]).split(' ')[0]}" cy="${P(p[0], p[1]).split(' ')[1]}" r="${r}" />`;
  return `
    <g stroke="${color}" stroke-width="${sw}" stroke-linecap="round">
      <path d="M ${P(rTop[0], rTop[1])} L ${P(rBot[0], rBot[1])}" fill="none"/>
      <path d="M ${P(lTop[0], lTop[1])} L ${P(lBot[0], lBot[1])}" fill="none"/>
    </g>
    <g fill="${color}">${c(rTop)}${c(rBot)}${c(lTop)}${c(lBot)}</g>`;
}

// Full square icon (rounded background + mark + Arabic name).
function iconSvg(size, opts = {}) {
  const { withName = true, rounded = true, bg = true } = opts;
  const radius = rounded ? size * 0.22 : 0;
  const markColor = '#EAF1FF';
  const markUnit = size * 0.16;
  const markCx = size / 2;
  const markCy = withName ? size * 0.40 : size * 0.5;
  const fontSize = size * 0.16;
  const nameY = size * 0.74;

  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6E93F2"/>
        <stop offset="55%" stop-color="#3F6FE3"/>
        <stop offset="100%" stop-color="#2E55C8"/>
      </linearGradient>
    </defs>
    ${bg ? `<rect x="0" y="0" width="${size}" height="${size}" rx="${radius}" ry="${radius}" fill="url(#g)"/>` : ''}
    ${markGlyph(markCx, markCy, markUnit, markColor)}
    ${withName ? `<text x="${size / 2}" y="${nameY}" font-family="Tahoma, Arial, sans-serif" font-weight="bold" font-size="${fontSize}" fill="#FFFFFF" text-anchor="middle">انماط</text>` : ''}
  </svg>`;
}

async function write(name, svg, size) {
  const out = path.join(ASSETS, name);
  await sharp(Buffer.from(svg)).resize(size, size).png().toFile(out);
  console.log('wrote', name, `${size}x${size}`);
}

(async () => {
  // Main app icon (square, with name).
  await write('icon.png', iconSvg(1024, { withName: true, rounded: true, bg: true }), 1024);

  // Android adaptive foreground: transparent bg, mark + name, with safe padding.
  const fgSize = 1024;
  const fgSvg = `<svg width="${fgSize}" height="${fgSize}" viewBox="0 0 ${fgSize} ${fgSize}" xmlns="http://www.w3.org/2000/svg">
      ${markGlyph(fgSize / 2, fgSize * 0.42, fgSize * 0.13, '#FFFFFF')}
      <text x="${fgSize / 2}" y="${fgSize * 0.72}" font-family="Tahoma, Arial, sans-serif" font-weight="bold" font-size="${fgSize * 0.13}" fill="#FFFFFF" text-anchor="middle">انماط</text>
    </svg>`;
  await write('android-icon-foreground.png', fgSvg, fgSize);

  // Solid blue adaptive background.
  const bgSvg = `<svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
      <defs><linearGradient id="b" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="#6E93F2"/><stop offset="100%" stop-color="#2E55C8"/>
      </linearGradient></defs>
      <rect width="1024" height="1024" fill="url(#b)"/>
    </svg>`;
  await write('android-icon-background.png', bgSvg, 1024);

  // Splash icon: mark only on transparent (background colour set in app.json).
  await write('splash-icon.png', iconSvg(1024, { withName: true, rounded: false, bg: false }), 1024);

  // Favicon (web).
  await write('favicon.png', iconSvg(196, { withName: false, rounded: true, bg: true }), 196);

  console.log('done');
})();
