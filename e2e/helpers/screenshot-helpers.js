const { device, element, by } = require('detox');
const fs = require('fs');
const path = require('path');

const BASELINE_DIR = path.join(__dirname, '..', 'baselines');
const THRESHOLD = 0.01;

function getBaselinePath(testName, deviceName = 'default') {
  const safeTestName = testName.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(BASELINE_DIR, deviceName, `${safeTestName}.png`);
}

function ensureBaselineDir(deviceName = 'default') {
  const dir = path.join(BASELINE_DIR, deviceName);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

async function takeScreenshot(name, deviceName = 'default') {
  const screenshotPath = getBaselinePath(name, deviceName);
  ensureBaselineDir(deviceName);
  await device.screenshot({ path: screenshotPath });
  return screenshotPath;
}

async function takeScreenshotAndCompare(name, deviceName = 'default', options = {}) {
  const baselinePath = getBaselinePath(name, deviceName);
  const actualPath = getBaselinePath(`${name}_actual`, deviceName);
  ensureBaselineDir(deviceName);

  const baselineExists = fs.existsSync(baselinePath);

  await device.screenshot({ path: actualPath });

  if (!baselineExists) {
    fs.copyFileSync(actualPath, baselinePath);
    return {
      isNew: true,
      passed: true,
      message: `New baseline created: ${baselinePath}`,
      baselinePath,
      actualPath,
    };
  }

  const baselineSize = fs.statSync(baselinePath).size;
  const actualSize = fs.statSync(actualPath).size;
  const diff = Math.abs(baselineSize - actualSize) / baselineSize;

  if (diff <= THRESHOLD) {
    if (fs.existsSync(actualPath)) fs.unlinkSync(actualPath);
    return {
      isNew: false,
      passed: true,
      message: `Screenshot matches baseline (diff: ${(diff * 100).toFixed(2)}%)`,
      baselinePath,
      diff,
    };
  }

  return {
    isNew: false,
    passed: false,
    message: `Screenshot differs from baseline (diff: ${(diff * 100).toFixed(2)}%)`,
    baselinePath,
    actualPath,
    diff,
  };
}

async function updateBaseline(name, deviceName = 'default') {
  const actualPath = getBaselinePath(`${name}_actual`, deviceName);
  const baselinePath = getBaselinePath(name, deviceName);

  if (fs.existsSync(actualPath)) {
    fs.copyFileSync(actualPath, baselinePath);
    fs.unlinkSync(actualPath);
    return true;
  }
  return false;
}

async function captureAllScreens(screens, deviceName = 'default') {
  const results = [];
  for (const screen of screens) {
    try {
      if (screen.testId) {
        await waitFor(screen.testId).toBeVisible().withTimeout(5000);
      }
      if (screen.action) {
        await screen.action();
      }
      await new Promise(resolve => setTimeout(resolve, 500));
      const path = await takeScreenshot(screen.name, deviceName);
      results.push({ ...screen, path, success: true });
    } catch (error) {
      results.push({ ...screen, error: error.message, success: false });
    }
  }
  return results;
}

module.exports = {
  getBaselinePath,
  ensureBaselineDir,
  takeScreenshot,
  takeScreenshotAndCompare,
  updateBaseline,
  captureAllScreens,
  BASELINE_DIR,
};
