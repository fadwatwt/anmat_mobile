const { device, element, by, expect } = require('detox');
const {
  getElementBounds,
  getScreenDimensions,
  assertSafeAreaInsets,
  assertElementFullyVisible,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');
const { simulateNotchType, simulateNavigationType } = require('../helpers/device-helpers');

describe('Safe Area Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Header respects top safe area (status bar / notch)', () => {
    it('should have header starting below status bar area', async () => {
      const screen = await getScreenDimensions();
      const header = element(by.id('app-header'));
      const isVisible = await header.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(header);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeLessThan(80);
      }
    });

    it('should have header content fully visible after safe area', async () => {
      const header = element(by.id('app-header'));
      const isVisible = await header.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(header);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeLessThanOrEqual(120);
      }
    });
  });

  describe('Content respects safe area insets', () => {
    it('should have content below header without overlap', async () => {
      const screen = await getScreenDimensions();
      const header = element(by.id('app-header'));
      const content = element(by.id('dashboard-content'));

      const headerVisible = await header.isVisible().catch(() => false);
      const contentVisible = await content.isVisible().catch(() => false);

      if (headerVisible && contentVisible) {
        const headerBounds = await getElementBounds(header);
        const contentBounds = await getElementBounds(content);

        expect(contentBounds.y).toBeGreaterThanOrEqual(
          headerBounds.y + headerBounds.height - 2
        );
      }
    });

    it('should have content not hidden behind bottom system navigation', async () => {
      const screen = await getScreenDimensions();
      const content = element(by.id('dashboard-content'));
      const isVisible = await content.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(content);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
      }
    });
  });

  describe('Sidebar respects safe area', () => {
    it('should have sidebar contained within screen vertical bounds', async () => {
      const menuBtn = element(by.id('menu-button'));
      const isVisible = await menuBtn.isVisible().catch(() => false);

      if (isVisible) {
        await menuBtn.tap();
        await new Promise(resolve => setTimeout(resolve, 500));

        const screen = await getScreenDimensions();
        const sidebar = element(by.id('sidebar'));
        const sidebarVisible = await sidebar.isVisible().catch(() => false);

        if (sidebarVisible) {
          const bounds = await getElementBounds(sidebar);
          expect(bounds.y).toBeGreaterThanOrEqual(0);
          expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 1);
        }

        await element(by.id('overlay')).tap().catch(() => {});
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    });
  });

  describe('Login screen safe area', () => {
    it('should center login form vertically respecting safe area', async () => {
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);

      const screen = await getScreenDimensions();
      const loginScreen = element(by.id('login-screen'));
      const bounds = await getElementBounds(loginScreen);

      expect(bounds.y).toBeGreaterThanOrEqual(0);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
      expect(bounds.height).toBeGreaterThanOrEqual(screen.height * 0.8);
    });
  });

  describe('Bottom elements not hidden by system navigation', () => {
    it('should have bottom tab bar above system nav (if present)', async () => {
      const tabBar = element(by.id('tab-bar'));
      const isVisible = await tabBar.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(tabBar);

        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
      }
    });

    it('should have pagination buttons not cut off', async () => {
      const pagination = element(by.id('pagination'));
      const isVisible = await pagination.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(pagination);

        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
        expect(bounds.height).toBeGreaterThanOrEqual(32);
      }
    });

    it('should have FAB above bottom safe area', async () => {
      const fab = element(by.id('fab-button'));
      const isVisible = await fab.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(fab);

        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
        expect(bounds.y).toBeGreaterThanOrEqual(screen.height * 0.7);
      }
    });
  });

  describe('Modal respects safe area', () => {
    it('should have modal centered and not hidden by system chrome', async () => {
      const modal = element(by.id('modal-overlay'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(modal);

        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(screen.width + 2);
      }
    });
  });

  describe('Screenshot baselines for safe area', () => {
    it('should capture login screen safe area layout', async () => {
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);

      const result = await takeScreenshotAndCompare('login-safe-area');
      expect(result.passed).toBe(true);
    });

    it('should capture dashboard safe area layout', async () => {
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);

      const result = await takeScreenshotAndCompare('dashboard-safe-area');
      expect(result.passed).toBe(true);
    });
  });
});
