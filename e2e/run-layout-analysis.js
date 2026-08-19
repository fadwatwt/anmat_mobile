const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = path.join(process.env.USERPROFILE, 'platform-tools', 'adb.exe');
const OUT = path.join(__dirname, '..', 'baselines', 'physical-device');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

let shotNum = 10;

function run(cmd) {
  return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf-8', timeout: 15000 }).trim();
}

function sleep(ms) {
  execSync(`powershell -c "Start-Sleep -Milliseconds ${ms}"`);
}

function screenshot(name) {
  const remote = '/sdcard/layout_test.png';
  const local = path.join(OUT, `${String(shotNum++).padStart(2, '0')}-${name}.png`);
  run(`shell screencap -p ${remote}`);
  run(`pull ${remote} "${local}"`);
  run(`shell rm ${remote}`);
  const size = fs.statSync(local).size;
  console.log(`  [${name}] ${(size/1024).toFixed(0)}KB`);
  return local;
}

function uidump(name) {
  const local = path.join(OUT, `${name}.xml`);
  run('shell uiautomator dump /sdcard/uidump.xml');
  run(`pull /sdcard/uidump.xml "${local}"`);
  run('shell rm /sdcard/uidump.xml');
  
  const xml = fs.readFileSync(local, 'utf-8');
  const elements = [];
  const regex = /text="([^"]*)".*?bounds="\[(\d+),(\d+)\]\[(\d+),(\d+)\]"/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    if (match[1]) {
      elements.push({
        text: match[1],
        x1: parseInt(match[2]),
        y1: parseInt(match[3]),
        x2: parseInt(match[4]),
        y2: parseInt(match[5]),
        width: parseInt(match[4]) - parseInt(match[2]),
        height: parseInt(match[5]) - parseInt(match[3]),
      });
    }
  }
  return elements;
}

function parseBounds(boundsStr) {
  const m = boundsStr.match(/\[(\d+),(\d+)\]\[(\d+),(\d+)\]/);
  if (!m) return null;
  return { x1: +m[1], y1: +m[2], x2: +m[3], y2: +m[4] };
}

function analyzeLayout(elements, screenName) {
  const issues = [];
  const SCREEN_W = 1080;
  const SCREEN_H = 2340;

  for (const el of elements) {
    if (el.x1 < 0 || el.y1 < 0) {
      issues.push(`NEGATIVE BOUNDS: "${el.text}" at [${el.x1},${el.y1}]`);
    }
    if (el.x2 > SCREEN_W + 50) {
      issues.push(`OVERFLOW RIGHT: "${el.text}" x2=${el.x2} > ${SCREEN_W}`);
    }
    if (el.y2 > SCREEN_H + 50) {
      issues.push(`OVERFLOW BOTTOM: "${el.text}" y2=${el.y2} > ${SCREEN_H}`);
    }
    if (el.width < 0) {
      issues.push(`NEGATIVE WIDTH: "${el.text}" w=${el.width}`);
    }
    if (el.height < 0) {
      issues.push(`NEGATIVE HEIGHT: "${el.text}" h=${el.height}`);
    }
  }

  const leftEdge = elements.filter(e => e.x1 < 10 && e.text);
  const rightEdge = elements.filter(e => e.x2 > SCREEN_W - 10 && e.text);
  const topEdge = elements.filter(e => e.y1 < 100 && e.text);
  const bottomEdge = elements.filter(e => e.y2 > SCREEN_H - 100 && e.text);

  if (issues.length > 0) {
    console.log(`\n  ISSUES in ${screenName}:`);
    issues.forEach(i => console.log(`    - ${i}`));
  }

  return { issues, leftEdge, rightEdge, topEdge, bottomEdge };
}

function swipe(x1, y1, x2, y2, dur = 300) {
  run(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${dur}`);
}

function tap(x, y) {
  run(`shell input tap ${x} ${y}`);
}

function back() {
  run('shell input keyevent 4');
}

function menu() {
  tap(40, 162);
}

async function main() {
  console.log('=== Comprehensive Layout Analysis ===\n');
  
  const allIssues = {};

  // === 1. DASHBOARD SCREEN ===
  console.log('--- Dashboard ---');
  const dashElements = uidump('dashboard');
  const dashResult = analyzeLayout(dashElements, 'Dashboard');
  allIssues['Dashboard'] = dashResult.issues;
  screenshot('dashboard');

  // Scroll and capture more of dashboard
  swipe(540, 1800, 540, 800, 500);
  sleep(800);
  const dashScroll1 = uidump('dashboard-scroll1');
  analyzeLayout(dashScroll1, 'Dashboard Scroll 1');
  screenshot('dashboard-scroll1');

  swipe(540, 1800, 540, 800, 500);
  sleep(800);
  screenshot('dashboard-scroll2');

  // === 2. SIDEBAR ===
  console.log('\n--- Sidebar ---');
  menu();
  sleep(1000);
  const sidebarElements = uidump('sidebar');
  analyzeLayout(sidebarElements, 'Sidebar');
  screenshot('sidebar');

  // Check sidebar items
  const sidebarItems = sidebarElements.filter(e => e.height >= 40 && e.text);
  console.log(`  Sidebar items: ${sidebarItems.length}`);
  sidebarItems.forEach(item => {
    const touchHeight = item.height;
    const touchWidth = item.width;
    if (touchHeight < 88) {
      console.log(`  SMALL TOUCH: "${item.text}" ${touchWidth}x${touchHeight}px`);
    }
  });

  // === 3. Navigate to various screens via sidebar ===
  const screens = [
    { name: 'Organizations', y: 0 },
    { name: 'Employees', y: 0 },
    { name: 'Conversations', y: 0 },
    { name: 'Settings', y: 0 },
  ];

  // Close sidebar and go back to dashboard
  back();
  sleep(500);

  // Open sidebar and scroll to find more menu items
  menu();
  sleep(1000);

  // Scroll sidebar to see all items
  swipe(200, 1800, 200, 600, 500);
  sleep(800);
  screenshot('sidebar-scrolled');

  const sidebarScrollElements = uidump('sidebar-scroll');
  analyzeLayout(sidebarScrollElements, 'Sidebar Scrolled');
  sidebarScrollElements.forEach(item => {
    if (item.height > 20 && item.height < 88 && item.text && item.text.length > 2) {
      console.log(`  SMALL TOUCH: "${item.text}" ${item.width}x${item.height}px`);
    }
  });

  back();
  sleep(500);

  // === 4. Navigate to Organizations ===
  // Look for Organizations in the dashboard
  const orgElement = dashElements.find(e => e.text.includes('ORGANIZATIONS') || e.text.includes('Organizations'));
  if (orgElement) {
    console.log('\n--- Organizations ---');
    tap((orgElement.x1 + orgElement.x2) / 2, (orgElement.y1 + orgElement.y2) / 2);
    sleep(3000);
    screenshot('organizations');
    const orgElements = uidump('organizations');
    analyzeLayout(orgElements, 'Organizations');
    allIssues['Organizations'] = analyzeLayout(orgElements, 'Organizations').issues;
    back();
    sleep(500);
  }

  // === 5. Open sidebar and navigate to different screens ===
  menu();
  sleep(1000);

  // Try to find and tap sidebar items
  const sidebarAll = uidump('sidebar-full');
  
  // Find clickable items
  const clickableItems = sidebarAll.filter(e => 
    e.text && e.text.length > 2 && 
    !e.text.includes('Anmat') && 
    !e.text.includes('Admin') &&
    !e.text.includes('!') &&
    !e.text.includes('Require')
  );
  
  console.log(`\n--- Navigating Screens (${clickableItems.length} items) ---`);
  
  for (const item of clickableItems.slice(0, 10)) {
    const cx = (item.x1 + item.x2) / 2;
    const cy = (item.y1 + item.y2) / 2;
    
    // Only tap if within sidebar area
    if (item.x1 < 350 && item.y1 > 200) {
      console.log(`\n  Navigating to: "${item.text}"`);
      tap(cx, cy);
      sleep(3000);
      
      const screenElements = uidump(item.text.replace(/\s+/g, '-').toLowerCase());
      const result = analyzeLayout(screenElements, item.text);
      allIssues[item.text] = result.issues;
      screenshot(item.text.replace(/\s+/g, '-').toLowerCase());
      
      // Scroll and capture
      swipe(540, 1800, 540, 800, 500);
      sleep(800);
      screenshot(item.text.replace(/\s+/g, '-').toLowerCase() + '-scroll');
      
      // Go back via back button or sidebar
      back();
      sleep(500);
      
      // Check if we're still on the same screen
      const checkElements = uidump('check-back');
      const onLogin = checkElements.find(e => e.text.includes('Sign in'));
      if (onLogin) {
        console.log('  Back to login - need to re-login');
        break;
      }
      
      // Open sidebar again
      menu();
      sleep(1000);
    }
  }

  // === SUMMARY ===
  console.log('\n\n========== LAYOUT ANALYSIS SUMMARY ==========');
  let totalIssues = 0;
  for (const [screen, issues] of Object.entries(allIssues)) {
    if (issues.length > 0) {
      console.log(`\n${screen}: ${issues.length} issues`);
      issues.forEach(i => console.log(`  - ${i}`));
      totalIssues += issues.length;
    }
  }
  console.log(`\nTotal issues found: ${totalIssues}`);
  console.log(`Screenshots saved to: ${OUT}`);
}

main().catch(console.error);
