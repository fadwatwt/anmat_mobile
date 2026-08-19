const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = path.join(process.env.USERPROFILE, 'platform-tools', 'adb.exe');
const OUT = path.join(__dirname, '..', 'baselines', 'physical-device');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SCREEN_W = 1080, SCREEN_H = 2340;
let shotNum = 50;
const allScreens = {};

function run(cmd) {
  try { return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf-8', timeout: 15000 }).trim(); }
  catch (e) { return ''; }
}
function sleep(ms) { execSync(`powershell -c "Start-Sleep -Milliseconds ${ms}"`, { timeout: ms + 5000 }); }

function tap(x, y) { run(`shell input tap ${Math.round(x)} ${Math.round(y)}`); }
function back() { run('shell input keyevent 4'); }
function swipe(x1, y1, x2, y2) { run(`shell input swipe ${x1} ${y1} ${x2} ${y2} 400`); }

function screenshot(name) {
  const local = path.join(OUT, `${String(shotNum++).padStart(2, '0')}-${name}.png`);
  run('shell screencap -p /sdcard/s.png');
  run(`pull /sdcard/s.png "${local}"`);
  run('shell rm /sdcard/s.png');
  const size = fs.existsSync(local) ? fs.statSync(local).size : 0;
  console.log(`  IMG: ${name} (${(size/1024).toFixed(0)}KB)`);
  return local;
}

function uidump() {
  run('shell uiautomator dump /sdcard/u.xml');
  const tmp = path.join(OUT, '_tmp.xml');
  run(`pull /sdcard/u.xml "${tmp}"`);
  run('shell rm /sdcard/u.xml');
  if (!fs.existsSync(tmp)) return [];
  const xml = fs.readFileSync(tmp, 'utf-8');
  fs.unlinkSync(tmp);
  const els = [];
  const re = /text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
  let m;
  while ((m = re.exec(xml)) !== null) {
    if (m[1]) els.push({ text: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5], w: +m[4]-+m[2], h: +m[5]-+m[3] });
  }
  return els;
}

function analyze(screenName, els) {
  const issues = [];
  for (const el of els) {
    if (el.x2 > SCREEN_W + 20) issues.push(`OVERFLOW-R: "${el.text}" x2=${el.x2}`);
    if (el.y2 > SCREEN_H + 20) issues.push(`OVERFLOW-B: "${el.text}" y2=${el.y2}`);
    if (el.x1 < -20) issues.push(`NEG-X: "${el.text}" x1=${el.x1}`);
    if (el.y1 < -20) issues.push(`NEG-Y: "${el.text}" y1=${el.y1}`);
    if (el.w < 0) issues.push(`NEG-W: "${el.text}" w=${el.w}`);
    if (el.h < 0) issues.push(`NEG-H: "${el.text}" h=${el.h}`);
  }
  allScreens[screenName] = issues;
  if (issues.length > 0) {
    console.log(`  LAYOUT ISSUES:`);
    issues.forEach(i => console.log(`    !! ${i}`));
  } else {
    console.log(`  OK`);
  }
  return issues;
}

function isVisibleOnScreen(els) {
  return els.some(e => e.text.includes('Dashboard') || e.text.includes('Anmat') || e.text.includes('Industries'));
}

async function navToScreen(tapX, tapY, name) {
  console.log(`\n>> ${name}`);
  tap(tapX, tapY);
  sleep(3000);
  const els = uidump();
  
  if (els.some(e => e.text.includes('Sign in'))) {
    console.log(`  !! Login screen - need re-login`);
    return null;
  }
  
  analyze(name, els);
  screenshot(name.toLowerCase().replace(/\s+/g, '-'));
  
  // Scroll down
  swipe(540, 1800, 540, 600);
  sleep(800);
  const els2 = uidump();
  analyze(name + ' (scrolled)', els2);
  screenshot(name.toLowerCase().replace(/\s+/g, '-') + '-scroll');
  
  // Scroll more
  swipe(540, 1800, 540, 600);
  sleep(800);
  screenshot(name.toLowerCase().replace(/\s+/g, '-') + '-bottom');
  
  return els;
}

async function main() {
  console.log('=== SYSTEMATIC SCREEN ANALYSIS ===\n');
  
  // We should be on dashboard
  const dashEls = uidump();
  if (!isVisibleOnScreen(dashEls)) {
    console.log('Not on dashboard. Current elements:');
    dashEls.forEach(e => { if (e.text) console.log(`  ${e.text} @ [${e.x1},${e.y1}][${e.x2},${e.y2}]`); });
    return;
  }
  
  // Capture Dashboard
  console.log('\n>> Dashboard');
  analyze('Dashboard', dashEls);
  screenshot('dashboard');
  
  // Open sidebar - find hamburger menu (should be top-left area)
  // Header has: AR lang button, notification badge, user avatar, username
  // The menu/hamburger button should be the first element
  console.log('\n>> Opening Sidebar');
  tap(40, 162); // Menu button area
  sleep(1500);
  
  const sidebarEls = uidump();
  const sidebarItems = sidebarEls.filter(e => e.text && e.y1 > 200 && e.x1 < 400);
  
  console.log('  Sidebar items found:');
  sidebarItems.forEach(item => {
    const touch = item.h >= 44 ? 'OK' : `SMALL(${item.h}px)`;
    console.log(`    "${item.text}" [${item.x1},${item.y1}][${item.x2},${item.y2}] ${item.w}x${item.h} ${touch}`);
  });
  
  screenshot('sidebar');
  analyze('Sidebar', sidebarEls);
  
  // Find clickable sidebar items - they should be inside the sidebar (x < 350)
  const menuItems = sidebarEls.filter(e => 
    e.text && e.y1 > 200 && e.x1 < 350 && e.text.length > 2 &&
    !e.text.includes('Anmat') && !e.text.includes('Admin') &&
    !e.text.includes('!') && !e.text.includes('Require') &&
    !e.text.includes('Secuity') && !e.text.includes('Engineering') &&
    !e.text.includes('Design') && !e.text.match(/^\d+$/) &&
    !e.text.includes('No subscriptions') && !e.text.includes('No organizations')
  );
  
  console.log(`\n  Navigable items: ${menuItems.map(m => m.text).join(', ')}`);
  
  // Navigate to each item
  for (const item of menuItems) {
    const cx = (item.x1 + item.x2) / 2;
    const cy = (item.y1 + item.y2) / 2;
    
    const result = await navToScreen(cx, cy, item.text);
    if (!result) break;
    
    // Go back - try the back arrow if visible, otherwise use back button
    const backBtn = result.find(e => e.text.includes('Back') || e.text.includes('←'));
    if (backBtn) {
      tap((backBtn.x1 + backBtn.x2) / 2, (backBtn.y1 + backBtn.y2) / 2);
    } else {
      back();
    }
    sleep(1500);
    
    // Check we're back on dashboard
    const checkEls = uidump();
    if (!isVisibleOnScreen(checkEls)) {
      console.log('  !! Not on dashboard after back');
      // Try going back more
      back();
      sleep(1000);
      const check2 = uidump();
      if (!isVisibleOnScreen(check2)) {
        console.log('  !! Still not on dashboard, reloading...');
        run('shell am start -a android.intent.action.VIEW -d "exp://gg2q4cs-anmat-8081.exp.direct:80"');
        sleep(15000);
      }
    }
    
    // Re-open sidebar for next item
    tap(40, 162);
    sleep(1000);
  }
  
  // Print summary
  console.log('\n\n========== FINAL SUMMARY ==========');
  let totalCritical = 0;
  let totalMinor = 0;
  for (const [screen, issues] of Object.entries(allScreens)) {
    const critical = issues.filter(i => i.includes('OVERFLOW') || i.includes('NEG-H') || i.includes('NEG-W') || i.includes('NEG-X') || i.includes('NEG-Y'));
    const minor = issues.filter(i => !critical.includes(i));
    if (critical.length > 0) {
      console.log(`\n  CRITICAL - ${screen}: ${critical.length}`);
      critical.forEach(i => console.log(`    ${i}`));
      totalCritical += critical.length;
    }
    if (minor.length > 0) {
      console.log(`\n  MINOR - ${screen}: ${minor.length}`);
      minor.forEach(i => console.log(`    ${i}`));
      totalMinor += minor.length;
    }
  }
  console.log(`\nTotal: ${totalCritical} critical, ${totalMinor} minor across ${Object.keys(allScreens).length} screens`);
}

main().catch(console.error);
