const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = path.join(process.env.USERPROFILE, 'platform-tools', 'adb.exe');
const BASE = path.join(__dirname, '..', 'baselines', 'physical-device');
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true });

const SCREEN_W = 1080, SCREEN_H = 2340;
let shotNum = 0;
const allResults = {};

function run(cmd) {
  try { return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf-8', timeout: 15000 }).trim(); }
  catch (e) { return ''; }
}
function sleep(ms) { execSync(`powershell -c "Start-Sleep -Milliseconds ${ms}"`, { timeout: ms + 5000 }); }
function tap(x, y) { run(`shell input tap ${Math.round(x)} ${Math.round(y)}`); }
function back() { run('shell input keyevent 4'); }
function home() { run('shell input keyevent 3'); }
function swipe(x1, y1, x2, y2, dur = 400) { run(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${dur}`); }

function screenshot(name) {
  shotNum++;
  const local = path.join(BASE, `${String(shotNum).padStart(3, '0')}-${name}.png`);
  run('shell screencap -p /sdcard/s.png');
  run(`pull /sdcard/s.png "${local}"`);
  run('shell rm /sdcard/s.png');
  const size = fs.existsSync(local) ? fs.statSync(local).size : 0;
  return { path: local, size };
}

function uidump() {
  run('shell uiautomator dump /sdcard/u.xml');
  const tmp = path.join(BASE, '_tmp.xml');
  run(`pull /sdcard/u.xml "${tmp}"`);
  run('shell rm /sdcard/u.xml');
  if (!fs.existsSync(tmp)) return [];
  try {
    const xml = fs.readFileSync(tmp, 'utf-8');
    fs.unlinkSync(tmp);
    const els = [];
    const re = /text="([^"]*)"[^>]*bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
    let m;
    while ((m = re.exec(xml)) !== null) {
      if (m[1]) els.push({
        text: m[1], x1: +m[2], y1: +m[3], x2: +m[4], y2: +m[5],
        w: +m[4] - +m[2], h: +m[5] - +m[3]
      });
    }
    return els;
  } catch (e) { return []; }
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
  return issues;
}

function isOnDashboard(els) {
  return els.some(e => e.text && (e.text.includes('Dashboard') || e.text.includes('Welcome back') || e.text.includes('System Users') || e.text.includes('Total Companies')));
}

function isOpenSidebar(els) {
  return els.some(e => e.text && (e.text.includes('Subscriptions') || e.text.includes('Conversations') || e.text.includes('Settings')));
}

function findMenuItem(els, name) {
  return els.find(e => e.text && e.text.toLowerCase().includes(name.toLowerCase()));
}

async function captureScreen(name, folder) {
  sleep(2500);
  const els = uidump();
  const issues = analyze(name, els);
  const img = screenshot(`${folder}/${name.replace(/\s+/g, '-')}`);
  
  // Scroll down twice
  swipe(540, 1800, 540, 600, 500);
  sleep(800);
  const els2 = uidump();
  const issues2 = analyze(name + ' scroll', els2);
  screenshot(`${folder}/${name.replace(/\s+/g, '-')}-scroll1`);
  
  swipe(540, 1800, 540, 600, 500);
  sleep(800);
  screenshot(`${folder}/${name.replace(/\s+/g, '-')}-scroll2`);
  
  const allIssues = [...issues, ...issues2];
  allResults[`${folder}/${name}`] = allIssues;
  
  const status = allIssues.length === 0 ? 'OK' : `${allIssues.length} issues`;
  console.log(`  [${name}] ${status}`);
  if (allIssues.length > 0) {
    allIssues.forEach(i => console.log(`    !! ${i}`));
  }
  
  return els;
}

async function navigateToScreen(menuText, screenName, folder) {
  // Open sidebar
  tap(40, 162);
  sleep(1500);
  
  let els = uidump();
  
  // Try to find the menu item
  let item = findMenuItem(els, menuText);
  
  if (!item) {
    // Scroll sidebar down
    swipe(200, 1800, 200, 800, 500);
    sleep(1000);
    els = uidump();
    item = findMenuItem(els, menuText);
  }
  
  if (!item) {
    console.log(`  [${screenName}] MENU ITEM NOT FOUND`);
    back();
    sleep(500);
    return null;
  }
  
  // Tap the menu item
  const cx = (item.x1 + item.x2) / 2;
  const cy = (item.y1 + item.y2) / 2;
  tap(cx, cy);
  
  return await captureScreen(screenName, folder);
}

async function goBackToDashboard() {
  back();
  sleep(1000);
  let els = uidump();
  if (!isOnDashboard(els)) {
    back();
    sleep(1000);
    els = uidump();
    if (!isOnDashboard(els)) {
      // Force navigate back
      home();
      sleep(1000);
      run('shell am start -a android.intent.action.VIEW -d "exp://localhost:8081"');
      sleep(20000);
    }
  }
}

async function testAdminScreens() {
  console.log('\n========================================');
  console.log('  ADMIN SCREENS - admin@anmat.test');
  console.log('========================================\n');
  
  const folder = 'admin';
  
  // 1. Dashboard
  const dashEls = uidump();
  console.log('\n--- Dashboard ---');
  allResults['admin/Dashboard'] = analyze('Dashboard', dashEls);
  screenshot(`${folder}/00-dashboard`);
  
  // Scroll dashboard
  swipe(540, 1800, 540, 600, 500);
  sleep(800);
  screenshot(`${folder}/00-dashboard-scroll1`);
  swipe(540, 1800, 540, 600, 500);
  sleep(800);
  screenshot(`${folder}/00-dashboard-scroll2`);
  
  const dashIssues = allResults['admin/Dashboard'];
  console.log(`  [Dashboard] ${dashIssues.length === 0 ? 'OK' : dashIssues.length + ' issues'}`);
  
  // Admin screens to test via sidebar
  const adminScreens = [
    { menu: 'Industries', name: 'Industries' },
    { menu: 'Subscriptions', name: 'Subscriptions' },
    { menu: 'Conversations', name: 'Conversations' },
    { menu: 'Notifications', name: 'Notifications' },
    { menu: 'Settings', name: 'Settings' },
    { menu: 'Profile', name: 'Profile' },
    { menu: 'Analytics', name: 'Analytics' },
    { menu: 'Support', name: 'Support Tickets' },
    { menu: 'Organizations', name: 'Organizations' },
    { menu: 'Roles', name: 'Roles' },
    { menu: 'Permissions', name: 'Permissions' },
    { menu: 'AI', name: 'AI' },
    { menu: 'Agenda', name: 'Agenda' },
    { menu: 'Projects', name: 'Projects' },
    { menu: 'Templates', name: 'Templates' },
    { menu: 'Todo', name: 'Todo List' },
    { menu: 'Timeline', name: 'Timeline' },
    { menu: 'Escalation', name: 'Escalation' },
    { menu: 'Social', name: 'Social Media' },
    { menu: 'Token', name: 'Token Pricing' },
    { menu: 'Translation', name: 'Translations' },
    { menu: 'Activity', name: 'Activity Logs' },
    { menu: 'Admin Roles', name: 'Admin Roles' },
    { menu: 'Admin Permissions', name: 'Admin Permissions' },
  ];
  
  for (const screen of adminScreens) {
    console.log(`\n--- ${screen.name} ---`);
    await navigateToScreen(screen.menu, screen.name, folder);
    await goBackToDashboard();
    sleep(1000);
  }
}

async function testSubscriberScreens() {
  console.log('\n========================================');
  console.log('  SUBSCRIBER SCREENS - nextsub1@anmat.test');
  console.log('========================================\n');
  
  const folder = 'subscriber';
  
  // Check if we see subscriber dashboard
  sleep(5000);
  const els = uidump();
  const hasDash = els.some(e => e.text && (e.text.includes('Welcome') || e.text.includes('Dashboard')));
  
  if (!hasDash) {
    console.log('  Not on subscriber dashboard. Current:');
    els.forEach(e => { if (e.text && e.text.length < 80) console.log(`    ${e.text} @ ${e.bounds}`); });
  } else {
    allResults['subscriber/Dashboard'] = analyze('Subscriber Dashboard', els);
    screenshot(`${folder}/00-dashboard`);
    console.log(`  [Subscriber Dashboard] OK`);
  }
  
  // Scroll
  swipe(540, 1800, 540, 600, 500);
  sleep(800);
  screenshot(`${folder}/00-dashboard-scroll1`);
  
  const subScreens = [
    { menu: 'Conversations', name: 'Conversations' },
    { menu: 'Notifications', name: 'Notifications' },
    { menu: 'Settings', name: 'Settings' },
    { menu: 'Profile', name: 'Profile' },
    { menu: 'Projects', name: 'Projects' },
    { menu: 'Tasks', name: 'Tasks' },
    { menu: 'Attendance', name: 'Attendance' },
    { menu: 'Salary', name: 'Salary' },
    { menu: 'Leaves', name: 'Leaves' },
    { menu: 'Requests', name: 'Requests' },
    { menu: 'Agenda', name: 'Agenda' },
    { menu: 'AI', name: 'AI' },
    { menu: 'Social', name: 'Social Media' },
  ];
  
  for (const screen of subScreens) {
    console.log(`\n--- ${screen.name} ---`);
    await navigateToScreen(screen.menu, screen.name, folder);
    await goBackToDashboard();
    sleep(1000);
  }
}

async function testEmployeeScreens() {
  console.log('\n========================================');
  console.log('  EMPLOYEE SCREENS - org1emp1@anmat.test');
  console.log('========================================\n');
  
  const folder = 'employee';
  
  sleep(5000);
  const els = uidump();
  const hasDash = els.some(e => e.text && (e.text.includes('Welcome') || e.text.includes('Dashboard')));
  
  if (!hasDash) {
    console.log('  Not on employee dashboard. Current:');
    els.forEach(e => { if (e.text && e.text.length < 80) console.log(`    ${e.text} @ ${e.bounds}`); });
  } else {
    allResults['employee/Dashboard'] = analyze('Employee Dashboard', els);
    screenshot(`${folder}/00-dashboard`);
    console.log(`  [Employee Dashboard] OK`);
  }
  
  swipe(540, 1800, 540, 600, 500);
  sleep(800);
  screenshot(`${folder}/00-dashboard-scroll1`);
  
  const empScreens = [
    { menu: 'Conversations', name: 'Conversations' },
    { menu: 'Notifications', name: 'Notifications' },
    { menu: 'Settings', name: 'Settings' },
    { menu: 'Profile', name: 'Profile' },
    { menu: 'My Tasks', name: 'My Tasks' },
    { menu: 'My Projects', name: 'My Projects' },
    { menu: 'Attendance', name: 'Attendance' },
    { menu: 'Salary', name: 'Salary' },
    { menu: 'Leaves', name: 'Leaves' },
    { menu: 'Requests', name: 'Requests' },
    { menu: 'Agenda', name: 'Agenda' },
    { menu: 'AI', name: 'AI' },
    { menu: 'Social', name: 'Social Media' },
    { menu: 'Timeline', name: 'Timeline' },
    { menu: 'Escalation', name: 'Escalation' },
  ];
  
  for (const screen of empScreens) {
    console.log(`\n--- ${screen.name} ---`);
    await navigateToScreen(screen.menu, screen.name, folder);
    await goBackToDashboard();
    sleep(1000);
  }
}

function printSummary() {
  console.log('\n\n============================================');
  console.log('  FINAL COMPREHENSIVE LAYOUT ANALYSIS');
  console.log('============================================\n');
  
  let totalCritical = 0, totalModerate = 0, totalLow = 0;
  
  for (const [screen, issues] of Object.entries(allResults)) {
    const critical = issues.filter(i => i.includes('OVERFLOW') || i.includes('NEG-H') || i.includes('NEG-W') || i.includes('NEG-X') || i.includes('NEG-Y'));
    const others = issues.filter(i => !critical.includes(i));
    
    if (critical.length > 0) {
      console.log(`  CRITICAL | ${screen}: ${critical.length}`);
      critical.forEach(i => console.log(`    ${i}`));
      totalCritical += critical.length;
    }
    if (others.length > 0) {
      console.log(`  MODERATE | ${screen}: ${others.length}`);
      others.forEach(i => console.log(`    ${i}`));
      totalModerate += others.length;
    }
  }
  
  console.log(`\n  SUMMARY: ${totalCritical} critical, ${totalModerate} moderate across ${Object.keys(allResults).length} screens`);
  console.log(`  Screenshots: ${shotNum} files in ${BASE}`);
}

async function main() {
  await testAdminScreens();
  
  console.log('\n\n>>> ADMIN TESTS COMPLETE. Switching to Subscriber account...');
  console.log('>>> PLEASE LOG OUT AND LOG IN AS SUBSCRIBER');
  console.log('>>> Press Enter when ready...');
  
  // Wait for user to switch accounts
  // For now, just print admin summary
  printSummary();
}

main().catch(console.error);
