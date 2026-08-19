const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = path.join(process.env.USERPROFILE, 'platform-tools', 'adb.exe');
const BASE = path.join(__dirname, 'baselines', 'physical-device');
const SCREEN_W = 1080, SCREEN_H = 2340;

function adb(cmd) {
  try { return execSync(`"${ADB}" ${cmd}`, { timeout: 15000, encoding: 'utf-8' }).trim(); }
  catch { return ''; }
}
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function dumpUI() {
  adb('shell uiautomator dump /sdcard/u.xml');
  const tmp = path.join(process.env.TEMP, '_dump.xml');
  adb(`pull /sdcard/u.xml "${tmp}"`);
  adb('shell rm /sdcard/u.xml');
  try { return fs.readFileSync(tmp, 'utf-8'); } catch { return ''; }
}
function parseEls(xml) {
  const els = [];
  const re = /<node[^>]*?text="([^"]*)"[^>]*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"[^>]*?/g;
  let m;
  while ((m = re.exec(xml))) els.push({ text: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5] });
  return els;
}
function checkLayout(els) {
  const issues = [];
  for (const e of els) {
    if (!e.text || e.text.length > 80) continue;
    if (e.x2 > SCREEN_W + 30) issues.push(`OVERFLOW-R: "${e.text}" x2=${e.x2}`);
    if (e.y2 > SCREEN_H + 30) issues.push(`OVERFLOW-B: "${e.text}" y2=${e.y2}`);
    if (e.x1 < -30) issues.push(`NEG-X: "${e.text}" x1=${e.x1}`);
    if (e.y1 < -30) issues.push(`NEG-Y: "${e.text}" y1=${e.y1}`);
    const w = e.x2 - e.x1; const h = e.y2 - e.y1;
    if (w < 0) issues.push(`NEG-W: "${e.text}" w=${w}`);
    if (h < 0) issues.push(`NEG-H: "${e.text}" h=${h}`);
  }
  return issues;
}
function tap(x, y) { adb(`shell input tap ${Math.round(x)} ${Math.round(y)}`); }
function scrollDown() { adb('shell input swipe 540 1800 540 600 400'); }
async function screenshot(name, dir) {
  const outDir = path.join(BASE, dir); fs.mkdirSync(outDir, { recursive: true });
  const p = path.join(outDir, `${name}.png`);
  adb('shell screencap -p /sdcard/s.png'); adb(`pull /sdcard/s.png "${p}"`); adb('shell rm /sdcard/s.png');
  return p;
}

async function relaunchAndWait() {
  adb('shell am force-stop host.exp.exponent');
  await sleep(2000);
  adb('shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"');
  await sleep(15000);
  // Verify
  let xml = dumpUI();
  let els = parseEls(xml);
  if (!els.some(e => e.text === 'Anmat System Admin' || e.text === 'Industries')) {
    await sleep(10000);
  }
}

async function openSidebarAndNavigate(itemText) {
  tap(107, 163);
  await sleep(2000);
  let xml = dumpUI();
  let els = parseEls(xml);
  let hasSidebar = els.some(e => e.text === 'OVERVIEW' || e.text === 'Dashboard');
  if (!hasSidebar) {
    const onHome = els.some(e => e.text === 'Phone' || e.text === 'Messages' || e.text === 'Camera');
    if (onHome || !els.some(e => e.text === 'Anmat System Admin')) {
      console.log(`    Relaunching app...`);
      await relaunchAndWait();
      tap(107, 163);
      await sleep(2000);
      xml = dumpUI(); els = parseEls(xml);
      hasSidebar = els.some(e => e.text === 'OVERVIEW' || e.text === 'Dashboard');
    }
    if (!hasSidebar) {
      tap(900, 1200); await sleep(500);
      tap(107, 163); await sleep(2000);
      xml = dumpUI(); els = parseEls(xml);
      hasSidebar = els.some(e => e.text === 'OVERVIEW' || e.text === 'Dashboard');
    }
    if (!hasSidebar) return false;
  }
  let item = els.find(e => e.text === itemText);
  if (item) { tap((item.x1 + item.x2) / 2, (item.y1 + item.y2) / 2); await sleep(2500); tap(900, 1200); await sleep(500); return true; }
  for (let s = 0; s < 5; s++) {
    adb('shell input swipe 400 1800 400 800 300'); await sleep(800);
    xml = dumpUI(); els = parseEls(xml);
    item = els.find(e => e.text === itemText);
    if (item) { tap((item.x1 + item.x2) / 2, (item.y1 + item.y2) / 2); await sleep(2500); tap(900, 1200); await sleep(500); return true; }
  }
  return false;
}

async function captureScreen(name, dir) {
  await sleep(1500);
  const xml = dumpUI(); const els = parseEls(xml); const issues = checkLayout(els);
  await screenshot(name, dir);
  let scrollIssues = [];
  for (let s = 1; s <= 2; s++) {
    scrollDown(); await sleep(1000);
    const sXml = dumpUI(); const sEls = parseEls(sXml);
    scrollIssues = scrollIssues.concat(checkLayout(sEls));
    await screenshot(`${name}-scroll${s}`, dir);
  }
  const totalIssues = [...issues, ...scrollIssues];
  const allTexts = els.filter(e => e.text && e.text.length < 50).map(e => e.text).slice(0, 5);
  return { name, issues: totalIssues, texts: allTexts.join(' | ') };
}

const BATCH2_ITEMS = [
  'Subscribers',
  'Plans',
  'Money Receiving Methods',
  'Translations',
  'Notifications',
  'Support Tickets',
  'Settings',
  'Profile',
];

async function run() {
  console.log('================================================');
  console.log('  ADMIN SCREENS BATCH 2');
  console.log('  (Remaining screens that need fresh app launch)');
  console.log('================================================\n');

  // Force stop and relaunch clean
  console.log('Force-stopping app for clean start...');
  await relaunchAndWait();
  console.log('App ready.\n');

  const results = [];
  for (const item of BATCH2_ITEMS) {
    console.log(`--- ${item} ---`);
    const dir = `admin-${item.replace(/\s+/g, '-').toLowerCase()}`;
    const found = await openSidebarAndNavigate(item);
    if (!found) {
      console.log(`  [${item}] NOT FOUND`);
      results.push({ screen: item, status: 'NOT_FOUND', issues: [] });
      continue;
    }
    const result = await captureScreen(item, dir);
    const status = result.issues.length === 0 ? 'OK' : `${result.issues.length} ISSUES`;
    console.log(`  [${item}] ${status} | ${result.texts}`);
    if (result.issues.length > 0) for (const i of result.issues) console.log(`    !! ${i}`);
    results.push({ screen: item, status: result.issues.length === 0 ? 'OK' : 'ISSUES', issues: result.issues });
  }

  // Also test Profile via user dropdown
  console.log('\n--- Profile (via user dropdown) ---');
  await relaunchAndWait();
  tap(976, 163);
  await sleep(1500);
  const ddXml = dumpUI();
  const ddEls = parseEls(ddXml);
  const profileItem = ddEls.find(e => e.text === 'Profile');
  if (profileItem) {
    tap((profileItem.x1 + profileItem.x2) / 2, (profileItem.y1 + profileItem.y2) / 2);
    const result = await captureScreen('Profile', 'admin-profile');
    console.log(`  [Profile] ${result.issues.length === 0 ? 'OK' : result.issues.length + ' ISSUES'} | ${result.texts}`);
    results.push({ screen: 'Profile', status: result.issues.length === 0 ? 'OK' : 'ISSUES', issues: result.issues });
  } else {
    console.log('  [Profile] NOT FOUND in dropdown');
    results.push({ screen: 'Profile', status: 'NOT_FOUND', issues: [] });
  }

  console.log('\n================================================');
  console.log('  BATCH 2 RESULTS');
  console.log('================================================');
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : r.status === 'ISSUES' ? '✗' : '?';
    console.log(`  ${icon} ${r.screen}: ${r.status}${r.issues.length ? ' (' + r.issues.length + ')' : ''}`);
  }
  fs.writeFileSync(path.join(BASE, 'admin-batch2-results.json'), JSON.stringify(results, null, 2));
}

run().catch(console.error);
