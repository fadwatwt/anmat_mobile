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
  while ((m = re.exec(xml))) {
    els.push({ text: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5] });
  }
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
    const w = e.x2 - e.x1;
    const h = e.y2 - e.y1;
    if (w < 0) issues.push(`NEG-W: "${e.text}" w=${w}`);
    if (h < 0) issues.push(`NEG-H: "${e.text}" h=${h}`);
  }
  return issues;
}

function tap(x, y) { adb(`shell input tap ${Math.round(x)} ${Math.round(y)}`); }
function scrollDown() { adb('shell input swipe 540 1800 540 600 400'); }

async function screenshot(name, dir) {
  const outDir = path.join(BASE, dir);
  fs.mkdirSync(outDir, { recursive: true });
  const p = path.join(outDir, `${name}.png`);
  adb('shell screencap -p /sdcard/s.png');
  adb(`pull /sdcard/s.png "${p}"`);
  adb('shell rm /sdcard/s.png');
  return p;
}

async function openSidebarAndNavigate(itemText) {
  // Tap Menu button (accessibilityLabel="Menu" at center 107,163)
  tap(107, 163);
  await sleep(2000);

  let xml = dumpUI();
  let els = parseEls(xml);
  let hasSidebar = els.some(e => e.text === 'OVERVIEW' || e.text === 'Dashboard');
  
  if (!hasSidebar) {
    // We might be on home screen - relaunch app
    const onHome = els.some(e => e.text === 'Phone' || e.text === 'Messages' || e.text === 'Camera' || e.text === 'Gallery');
    if (onHome) {
      console.log(`    On home screen, relaunching app...`);
      // Force stop the app first, then relaunch
      adb('shell am force-stop host.exp.exponent');
      await sleep(2000);
      adb('shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"');
      await sleep(15000);
      // Verify
      xml = dumpUI();
      els = parseEls(xml);
      if (!els.some(e => e.text === 'Anmat System Admin' || e.text === 'Industries')) {
        console.log(`    App still loading, waiting more...`);
        await sleep(10000);
      }
      // Try opening sidebar again
      tap(107, 163);
      await sleep(2000);
      xml = dumpUI();
      els = parseEls(xml);
      hasSidebar = els.some(e => e.text === 'OVERVIEW' || e.text === 'Dashboard');
    }
    
    if (!hasSidebar) {
      // Try closing overlay first
      tap(900, 1200);
      await sleep(500);
      tap(107, 163);
      await sleep(2000);
      xml = dumpUI();
      els = parseEls(xml);
      hasSidebar = els.some(e => e.text === 'OVERVIEW' || e.text === 'Dashboard');
    }
    
    if (!hasSidebar) {
      console.log(`    Sidebar not opened after recovery`);
      return false;
    }
  }

  let item = els.find(e => e.text === itemText);
  if (item) {
    tap((item.x1 + item.x2) / 2, (item.y1 + item.y2) / 2);
    await sleep(2500);
    // Close sidebar overlay if it's still visible
    tap(900, 1200);
    await sleep(500);
    return true;
  }

  // Scroll sidebar to find item
  for (let s = 0; s < 5; s++) {
    adb('shell input swipe 400 1800 400 800 300');
    await sleep(800);
    xml = dumpUI();
    els = parseEls(xml);
    item = els.find(e => e.text === itemText);
    if (item) {
      tap((item.x1 + item.x2) / 2, (item.y1 + item.y2) / 2);
      await sleep(2500);
      return true;
    }
  }
  return false;
}

async function captureScreen(name, dir) {
  await sleep(1500);
  const xml = dumpUI();
  const els = parseEls(xml);
  const issues = checkLayout(els);
  await screenshot(name, dir);

  let scrollIssues = [];
  for (let s = 1; s <= 2; s++) {
    scrollDown();
    await sleep(1000);
    const sXml = dumpUI();
    const sEls = parseEls(sXml);
    scrollIssues = scrollIssues.concat(checkLayout(sEls));
    await screenshot(`${name}-scroll${s}`, dir);
  }

  const totalIssues = [...issues, ...scrollIssues];
  const allTexts = els.filter(e => e.text && e.text.length < 50).map(e => e.text).slice(0, 5);
  return { name, issues: totalIssues, texts: allTexts.join(' | ') };
}

const ADMIN_ITEMS = [
  'Dashboard',
  'Conversations',
  'Analytics',
  'AI Assistant',
  'System Admins',
  'Roles',
  'Permissions',
  'Industries',
];

async function run() {
  console.log('================================================');
  console.log('  ADMIN SCREENS - COMPREHENSIVE LAYOUT TEST');
  console.log('  Samsung Galaxy A56 (1080x2340)');
  console.log('  Method: Navigate screen-to-screen via sidebar');
  console.log('================================================\n');

  // Make sure app is running
  adb('shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"');
  await sleep(12000);
  
  // Verify app is loaded
  let xml = dumpUI();
  let els = parseEls(xml);
  const inApp = els.some(e => e.text === 'Anmat System Admin' || e.text === 'Dashboard');
  if (!inApp) {
    console.log('App not loaded yet, waiting more...');
    await sleep(8000);
  }
  console.log('App ready, starting test...\n');

  const results = [];
  let currentScreen = 'Dashboard'; // Track where we are

  for (const item of ADMIN_ITEMS) {
    console.log(`--- ${item} (from ${currentScreen}) ---`);
    const dir = `admin-${item.replace(/\s+/g, '-').toLowerCase()}`;
    
    const found = await openSidebarAndNavigate(item);
    if (!found) {
      console.log(`  [${item}] NOT FOUND in sidebar`);
      results.push({ screen: item, status: 'NOT_FOUND', issues: [] });
      currentScreen = 'unknown';
      continue;
    }

    const result = await captureScreen(item, dir);
    const status = result.issues.length === 0 ? 'OK' : `${result.issues.length} ISSUES`;
    console.log(`  [${item}] ${status} | ${result.texts}`);
    if (result.issues.length > 0) {
      for (const i of result.issues) console.log(`    !! ${i}`);
    }
    results.push({ screen: item, status: result.issues.length === 0 ? 'OK' : 'ISSUES', issues: result.issues });
    currentScreen = item;
  }

  // Summary
  console.log('\n================================================');
  console.log('  RESULTS SUMMARY');
  console.log('================================================');
  const ok = results.filter(r => r.status === 'OK').length;
  const issues = results.filter(r => r.status === 'ISSUES').length;
  const notFound = results.filter(r => r.status === 'NOT_FOUND').length;
  console.log(`  OK: ${ok} | Issues: ${issues} | Not Found: ${notFound}`);
  console.log('');
  for (const r of results) {
    const icon = r.status === 'OK' ? '✓' : r.status === 'ISSUES' ? '✗' : '?';
    console.log(`  ${icon} ${r.screen}: ${r.status}${r.issues.length ? ' (' + r.issues.length + ')' : ''}`);
  }

  const resultsPath = path.join(BASE, 'admin-results.json');
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`\nResults saved to ${resultsPath}`);
}

run().catch(console.error);
