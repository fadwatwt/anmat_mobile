const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = path.join(process.env.USERPROFILE, 'platform-tools', 'adb.exe');
const OUT = path.join(__dirname, '..', 'e2e', 'baselines', 'physical-device');

if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

function run(cmd) {
  return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf-8', timeout: 15000 }).trim();
}

function check() {
  const devices = run('devices');
  if (!devices.includes('device')) {
    console.error('No device connected!');
    process.exit(1);
  }
  console.log('Device connected.');
}

function screenshot(name) {
  const remote = '/sdcard/layout_test.png';
  const local = path.join(OUT, `${name}.png`);
  run(`shell screencap -p ${remote}`);
  run(`pull ${remote} "${local}"`);
  run(`shell rm ${remote}`);
  return local;
}

function getInfo() {
  const size = run('shell wm size');
  const density = run('shell wm density');
  const model = run('shell getprop ro.product.model');
  const android = run('shell getprop ro.build.version.release');
  return { size, density, model, android };
}

async function main() {
  check();

  const info = getInfo();
  console.log('\n=== Device Info ===');
  console.log(`Model: ${info.model}`);
  console.log(`Android: ${info.android}`);
  console.log(`Screen: ${info.size}`);
  console.log(`Density: ${info.density}`);

  console.log('\n=== Taking Screenshots ===');
  console.log('Make sure the app is OPEN on your phone!');

  const shots = [
    '01-current-screen',
  ];

  for (const name of shots) {
    const p = screenshot(name);
    const size = fs.statSync(p).size;
    console.log(`  [OK] ${name}.png (${(size/1024).toFixed(0)}KB)`);
  }

  console.log(`\nScreenshots saved to: ${OUT}`);
  console.log('\n=== Layout Checklist ===');
  console.log('Open each screenshot and verify:');
  console.log('  1. No elements cut off at edges');
  console.log('  2. Header fully visible');
  console.log('  3. Text not truncated');
  console.log('  4. Spacing consistent');
  console.log('  5. No overlapping elements');
}

main().catch(console.error);
