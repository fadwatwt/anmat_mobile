const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const ar = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/ar/translation.json'), 'utf8'));
const en = JSON.parse(fs.readFileSync(path.join(root, 'src/locales/en/translation.json'), 'utf8'));

// Allow scanning a subset of files via CLI args, else scan all screens + modals
const args = process.argv.slice(2);

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) out.push(...walk(full));
    else if (/\.(tsx|ts)$/.test(name)) out.push(full);
  }
  return out;
}

let files;
if (args.length) {
  files = args.map((a) => path.join(root, a)).filter((f) => fs.existsSync(f));
} else {
  files = [
    ...walk(path.join(root, 'src/screens')),
    ...walk(path.join(root, 'src/modals')),
    ...walk(path.join(root, 'src/components')),
  ];
}

// Match t('...'), t("..."), t(`...`) capturing the literal key (skip template interpolation)
const keyRe = /\bt\(\s*(['"`])((?:\\.|(?!\1).)*?)\1/g;

const missingAr = new Map(); // key -> [files]
const missingEn = new Set();

for (const f of files) {
  const src = fs.readFileSync(f, 'utf8');
  let m;
  while ((m = keyRe.exec(src)) !== null) {
    const key = m[2];
    if (!key) continue;
    if (key.includes('${')) continue; // dynamic template literal, skip
    if (!(key in ar)) {
      if (!missingAr.has(key)) missingAr.set(key, []);
      missingAr.get(key).push(path.relative(root, f));
    }
    if (!(key in en)) missingEn.add(key);
  }
}

console.log('=== MISSING in AR (' + missingAr.size + ') ===');
[...missingAr.keys()].sort().forEach((k) => {
  console.log('  ' + JSON.stringify(k) + '  <- ' + [...new Set(missingAr.get(k))].join(', '));
});
console.log('');
console.log('=== MISSING in EN (' + missingEn.size + ') ===');
[...missingEn].sort().forEach((k) => console.log('  ' + JSON.stringify(k)));
