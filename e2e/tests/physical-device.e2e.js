const path = require('path');
const {
  isDeviceConnected,
  screenshot,
  getScreenSize,
  getDensity,
  tap,
  swipe,
  pressBack,
  SCREENSHOTS_DIR,
} = require('../helpers/adb-helpers');

describe('Physical Device Layout Tests', () => {
  const deviceReady = isDeviceConnected();

  beforeAll(() => {
    if (!deviceReady) {
      console.warn('No device connected. Skipping physical device tests.');
    }
  });

  const itIfDevice = deviceReady ? it : it.skip;

  describe('Device Info', () => {
    itIfDevice('should have valid screen size', () => {
      const size = getScreenSize();
      expect(size.width).toBeGreaterThan(0);
      expect(size.height).toBeGreaterThan(0);
      console.log(`Screen: ${size.width}x${size.height}`);
    });

    itIfDevice('should have valid density', () => {
      const density = getDensity();
      expect(density).toBeGreaterThan(0);
      console.log(`Density: ${density}dpi`);
    });
  });

  describe('Screenshot Capture', () => {
    itIfDevice('should capture home screen', async () => {
      const path = screenshot('01-home-screen');
      expect(fs.existsSync(path)).toBe(true);
      const stats = fs.statSync(path);
      expect(stats.size).toBeGreaterThan(1000);
    });

    itIfDevice('should capture after scrolling down', async () => {
      const size = getScreenSize();
      swipe(size.width / 2, size.height * 0.7, size.width / 2, size.height * 0.3, 500);
      await new Promise(r => setTimeout(r, 500));
      const path = screenshot('02-scrolled-down');
      expect(fs.existsSync(path)).toBe(true);
    });

    itIfDevice('should capture after scrolling to bottom', async () => {
      const size = getScreenSize();
      swipe(size.width / 2, size.height * 0.7, size.width / 2, size.height * 0.3, 500);
      await new Promise(r => setTimeout(r, 500));
      const path = screenshot('03-bottom-content');
      expect(fs.existsSync(path)).toBe(true);
    });
  });

  describe('Navigation Tests', () => {
    itIfDevice('should open sidebar and capture', async () => {
      const size = getScreenSize();
      tap(40, 100);
      await new Promise(r => setTimeout(r, 800));
      const path = screenshot('04-sidebar-open');
      expect(fs.existsSync(path)).toBe(true);
      pressBack();
      await new Promise(r => setTimeout(r, 500));
    });

    itIfDevice('should navigate to a screen and capture', async () => {
      const size = getScreenSize();
      tap(40, 100);
      await new Promise(r => setTimeout(r, 800));
      tap(size.width / 2, size.height * 0.3);
      await new Promise(r => setTimeout(r, 1000));
      const path = screenshot('05-navigated-screen');
      expect(fs.existsSync(path)).toBe(true);
      pressBack();
      await new Promise(r => setTimeout(r, 500));
    });
  });

  describe('Layout Verification', () => {
    itIfDevice('should capture full page walkthrough', async () => {
      const size = getScreenSize();
      const screenshots = [];

      for (let i = 0; i < 5; i++) {
        const sPath = screenshot(`walkthrough-${i}`);
        screenshots.push(sPath);
        swipe(size.width / 2, size.height * 0.65, size.width / 2, size.height * 0.35, 400);
        await new Promise(r => setTimeout(r, 400));
      }

      expect(screenshots.length).toBe(5);
      screenshots.forEach(p => {
        expect(require('fs').existsSync(p)).toBe(true);
      });
    });
  });
});

const fs = require('fs');
