const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = path.join(process.env.USERPROFILE, 'platform-tools', 'adb.exe');
const OUT = path.join(__dirname, '..', 'baselines', 'physical-device');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let shotNum = 30;
const SCREEN_W = 1080, SCREEN_H = 2340;

function run(cmd) {
  try {
    return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf-8', timeout: 15000 }).trim();
  } catch (e) { return ''; }
}
function sleep(ms) { execSync(`powershell -c "Start-Sleep -Milliseconds ${ms}"`, { timeout: ms + 5000 }); }

function screenshot(name) {
  const local = path.join(OUT, `${String(shotNum++).padStart(2, '0')}-${name}.png`);
  run('shell screencap -p /sdcard/s.png');
  run(`pull /sdcard/s.png "${local}"`);
  run('shell rm /sdcard/s.png');
  const size = fs.existsSync(local) ? fs.statSync(local).size : 0;
  console.log(`  [${name}] ${(size/1024).toFixed(0)}KB`);
  return local;
}

function uidump() {
  run('shell uiautomator dump /sdcard/u.xml');
  const tmpFile = path.join(OUT, '_tmp_ui.xml');
  run(`pull /sdcard/u.xml "${tmpFile}"`);
  run('shell rm /sdcard/u.xml');
  const xml = fs.readFileSync(tmpFile, 'utf-8');
  fs.unlinkSync(tmpFile);
  
  const elements = [];
  const re = /text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[1]) {
      elements.push({
        text: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5],
        w: +m[4] - +m[2], h: +m[5] - +m[3]
      });
    }
  }
  return elements;
}

function analyze(screenName, elements) {
  const issues = [];
  for (const el of elements) {
    if (el.x2 > SCREEN_W + 20) issues.push({ type: 'OVERFLOW-R', el });
    if (el.y2 > SCREEN_H + 20) issues.push({ type: 'OVERFLOW-B', el });
    if (el.x1 < -20) issues.push({ type: 'NEG-X', el });
    if (el.y1 < -20) issues.push({ type: 'NEG-Y', el });
    if (el.w < 0) issues.push({ type: `NEG-W(${el.w})`, el });
    if (el.h < 0) issues.push({ type: `NEG-H(${el.h})`, el });
    if (el.h > 0 && el.h < 88 && el.text.length > 1 && !el.text.match(/^[\d!]+$/)) {
      issues.push({ type: `TOO-SMALL(${el.w}x${el.h})`, el });
    }
  }
  if (issues.length > 0) {
    console.log(`  ISSUES:`);
    issues.forEach(i => console.log(`    [${i.type}] "${i.el.text}" @ [${i.el.x1},${i.el.y1}][${i.el.x2},${i.el.y2}]`));
  } else {
    console.log(`  OK - no issues`);
  }
  return issues;
}

function tap(x, y) { run(`shell input tap ${x} ${y}`); }
function back() { run('shell input keyevent 4'); }
function swipe(x1, y1, x2, y2) { run(`shell input swipe ${x1} ${y1} ${x2} ${y2} 400`); }

async function captureScreen(name) {
  console.log(`\n--- ${name} ---`);
  sleep(2000);
  const elements = uidump();
  const issues = analyze(name, elements);
  screenshot(name.toLowerCase().replace(/\s+/g, '-'));
  // Scroll down
  swipe(540, 1800, 540, 600);
  sleep(1000);
  screenshot(name.toLowerCase().replace(/\s+/g, '-') + '-scroll');
  return { name, elements, issues };
}

async function main() {
  const allResults = [];

  // 1. DASHBOARD
  allResults.push(await captureScreen('Dashboard'));

  // 2. Open sidebar and find menu items
  console.log('\n--- Opening Sidebar ---');
  tap(40, 162);
  sleep(1500);
  
  const sidebarEls = uidump();
  const menuItems = sidebarEls.filter(e => 
    e.text && e.text.length > 2 && 
    e.y1 > 200 && e.x1 < 350 &&
    !e.text.includes('Anmat') && !e.text.includes('Admin') &&
    !e.text.includes('!') && !e.text.includes('Require') &&
    !e.text.includes('Secuity') && !e.text.includes('Engineering') &&
    !e.text.includes('Design') && !e.text.match(/^\d+$/)
  );
  
  console.log(`  Found ${menuItems.length} menu items`);
  
  // Also find ALL sidebar items for touch target analysis
  const allSidebarItems = sidebarEls.filter(e => 
    e.text && e.y1 > 200 && e.x1 < 350 && e.text.length > 1
  );
  console.log(`  Sidebar touch targets:`);
  allSidebarItems.forEach(item => {
    const ok = item.h >= 88 ? 'OK' : `SMALL(${item.h}px)`;
    console.log(`    "${item.text}" ${item.w}x${item.h}px [${ok}]`);
  });

  // Capture sidebar screenshot
  screenshot('sidebar-menu');
  analyze('Sidebar', sidebarEls);

  // Navigate to each menu item
  for (const item of menuItems) {
    const cx = (item.x1 + item.x2) / 2;
    const cy = (item.y1 + item.y2) / 2;
    
    console.log(`\n  >> Navigating to "${item.text}" at [${cx},${cy}]`);
    tap(cx, cy);
    sleep(3000);
    
    // Check if we navigated
    const currentEls = uidump();
    const onLogin = currentEls.find(e => e.text.includes('Sign in'));
    if (onLogin) {
      console.log('  !! Back at login screen, skipping');
      back();
      sleep(500);
      continue;
    }
    
    allResults.push(await captureScreen(item.text));
    
    // Go back
    back();
    sleep(1000);
    
    // Check if we're still in the app
    const checkEls = uidump();
    const stillInApp = checkEls.find(e => e.text.includes('Dashboard') || e.text.includes('Anmat'));
    if (!stillInApp) {
      console.log('  !! Navigated away from app, going back');
      back();
      sleep(500);
    }
    
    // Re-open sidebar
    tap(40, 162);
    sleep(1000);
    
    // Scroll sidebar if needed to find more items
    const newSidebar = uidump();
    const newItems = newSidebar.filter(e => 
      e.text && e.text.length > 2 && e.y1 > 200 && e.x1 < 350
    );
    if (newItems.length < menuItems.length) {
      swipe(200, 1800, 200, 600);
      sleep(800);
    }
  }

  // SUMMARY
  console.log('\n\n========== FINAL LAYOUT ANALYSIS SUMMARY ==========');
  let totalIssues = 0;
  for (const r of allResults) {
    if (r.issues.length > 0) {
      console.log(`\n${r.name}: ${r.issues.length} issues`);
      r.issues.forEach(i => console.log(`  [${i.type}] "${i.el.text}"`));
      totalIssues += r.issues.length;
    }
  }
  console.log(`\nTotal issues: ${totalIssues}`);
  console.log(`Total screens captured: ${allResults.length}`);
}

main().catch(e => console.error(e));
