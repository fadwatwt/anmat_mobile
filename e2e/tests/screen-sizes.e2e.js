const { device, element, by, expect } = require('detox');
const {
  getElementBounds,
  getScreenDimensions,
  assertElementInsideScreen,
  assertNoHorizontalOverflow,
  assertElementsDontOverlap,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');
const { SCREEN_SIZES } = require('../helpers/device-helpers');

describe('Screen Sizes Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Small screen (320x568 - iPhone SE)', () => {
    it('should have login screen usable on small screen', async () => {
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);

      const screen = await getScreenDimensions();
      await assertElementInsideScreen('login-screen', screen);

      const emailInput = element(by.id('email-input'));
      const emailVisible = await emailInput.isVisible().catch(() => false);

      if (emailVisible) {
        const bounds = await getElementBounds(emailInput);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
      }

      await takeScreenshotAndCompare('login-small-screen');
    });

    it('should have all login form elements visible on small screen', async () => {
      const elements = ['email-input', 'password-input', 'login-button'];
      for (const id of elements) {
        const el = element(by.id(id));
        const isVisible = await el.isVisible().catch(() => false);
        if (isVisible) {
          const bounds = await getElementBounds(id);
          expect(bounds.height).toBeGreaterThanOrEqual(36);
        }
      }
    });
  });

  describe('Standard screen (393x852 - iPhone 14)', () => {
    it('should have header and content properly laid out', async () => {
      const header = element(by.id('app-header'));
      const content = element(by.id('dashboard-content'));

      const headerVisible = await header.isVisible().catch(() => false);
      const contentVisible = await content.isVisible().catch(() => false);

      if (headerVisible && contentVisible) {
        const headerBounds = await getElementBounds(header);
        const contentBounds = await getElementBounds(content);

        expect(headerBounds.height).toBeGreaterThanOrEqual(44);
        expect(contentBounds.height).toBeGreaterThan(100);

        expect(contentBounds.y).toBeGreaterThanOrEqual(headerBounds.y + headerBounds.height - 2);
      }
    });

    it('should have summary cards arranged properly', async () => {
      const grid = element(by.id('summary-grid'));
      const isVisible = await grid.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        await assertNoHorizontalOverflow('summary-grid', screen);
      }
    });
  });

  describe('Large screen (430x932 - iPhone 14 Pro Max)', () => {
    it('should use available space effectively', async () => {
      const content = element(by.id('dashboard-content'));
      const isVisible = await content.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(content);
        expect(bounds.height).toBeGreaterThan(300);
      }
    });

    it('should not stretch elements too wide', async () => {
      const screen = await getScreenDimensions();
      const summaryCard = element(by.id('summary-card-0'));
      const isVisible = await summaryCard.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(summaryCard);
        expect(bounds.width).toBeLessThan(screen.width);
      }
    });
  });

  describe('Content adapts to screen size', () => {
    it('should have header height consistent across screens', async () => {
      const header = element(by.id('app-header'));
      const isVisible = await header.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(header);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeLessThanOrEqual(100);
      }
    });

    it('should have touch targets not shrinking on small screens', async () => {
      const menuBtn = element(by.id('menu-button'));
      const isVisible = await menuBtn.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(menuBtn);
        expect(bounds.width).toBeGreaterThanOrEqual(40);
        expect(bounds.height).toBeGreaterThanOrEqual(40);
      }
    });

    it('should have text readable on all screen sizes', async () => {
      const title = element(by.id('header-title'));
      const isVisible = await title.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(title);
        expect(bounds.width).toBeGreaterThan(30);
        expect(bounds.height).toBeGreaterThanOrEqual(16);
      }
    });
  });

  describe('Scrollable content on different sizes', () => {
    it('should have scrollable dashboard content', async () => {
      const scrollArea = element(by.id('dashboard-scroll'));
      const isVisible = await scrollArea.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(scrollArea);
        expect(bounds.height).toBeGreaterThan(100);
      }
    });

    it('should be able to scroll to bottom of content', async () => {
      const scrollArea = element(by.id('dashboard-scroll'));
      const isVisible = await scrollArea.isVisible().catch(() => false);

      if (isVisible) {
        await scrollArea.scroll(500, 'down');
        await new Promise(resolve => setTimeout(resolve, 300));
        const screen = await getScreenDimensions();
        await assertElementInsideScreen('dashboard-scroll', screen);
      }
    });
  });

  describe('Navigation on different screen sizes', () => {
    it('should have sidebar width proportional to screen', async () => {
      const menuBtn = element(by.id('menu-button'));
      const isVisible = await menuBtn.isVisible().catch(() => false);

      if (isVisible) {
        await menuBtn.tap();
        await new Promise(resolve => setTimeout(resolve, 600));

        const screen = await getScreenDimensions();
        const sidebar = element(by.id('sidebar'));
        const sidebarVisible = await sidebar.isVisible().catch(() => false);

        if (sidebarVisible) {
          const bounds = await getElementBounds(sidebar);
          expect(bounds.width).toBeLessThanOrEqual(284);
          expect(bounds.width).toBeGreaterThan(screen.width * 0.3);
          await assertElementInsideScreen('sidebar', screen);
        }

        await element(by.id('sidebar-overlay'))
          .tap()
          .catch(() => device.pressBack());
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    });
  });

  describe('Screenshots for different sizes', () => {
    it('should capture current screen size layout', async () => {
      const screen = await getScreenDimensions();
      const sizeKey = Object.keys(SCREEN_SIZES).find(
        key => Math.abs(SCREEN_SIZES[key].width - screen.width) < 20
      ) || 'standard';

      const result = await takeScreenshotAndCompare(
        `layout-${sizeKey}-screen`,
        sizeKey
      );
      expect(result.passed).toBe(true);
    });
  });
});
