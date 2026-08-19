const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const ADB = path.join(process.env.USERPROFILE, 'platform-tools', 'adb.exe');
const SCREENSHOTS_DIR = path.join(__dirname, '..', 'e2e', 'baselines', 'physical-device');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

function run(cmd) {
  return execSync(`"${ADB}" ${cmd}`, { encoding: 'utf-8', timeout: 10000 }).trim();
}

function isDeviceConnected() {
  const output = run('devices');
  return output.includes('device') && !output.includes('unauthorized');
}

function screenshot(name) {
  const remotePath = '/sdcard/screenshot_test.png';
  const localPath = path.join(SCREENSHOTS_DIR, `${name}.png`);
  run(`shell screencap -p ${remotePath}`);
  run(`pull ${remotePath} "${localPath}"`);
  run(`shell rm ${remotePath}`);
  return localPath;
}

function pressBack() {
  run('shell input keyevent 4');
}

function swipe(x1, y1, x2, y2, duration = 300) {
  run(`shell input swipe ${x1} ${y1} ${x2} ${y2} ${duration}`);
}

function tap(x, y) {
  run(`shell input tap ${x} ${y}`);
}

function getScreenSize() {
  const output = run('shell wm size');
  const match = output.match(/(\d+)x(\d+)/);
  if (match) {
    return { width: parseInt(match[1]), height: parseInt(match[2]) };
  }
  return { width: 1080, height: 2340 };
}

function getDensity() {
  const output = run('shell wm density');
  const match = output.match(/(\d+)/);
  return match ? parseInt(match[1]) : 420;
}

module.exports = {
  ADB,
  SCREENSHOTS_DIR,
  run,
  isDeviceConnected,
  screenshot,
  pressBack,
  swipe,
  tap,
  getScreenSize,
  getDensity,
};
