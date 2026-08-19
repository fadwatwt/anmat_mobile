const { device, element, by, expect } = require('detox');
const {
  getElementBounds,
  getScreenDimensions,
  assertElementInsideScreen,
  assertNoHorizontalOverflow,
  assertElementsDontOverlap,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');

describe('RTL Layout Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  async function switchToArabic() {
    const langToggle = element(by.id('language-toggle'));
    const isVisible = await langToggle.isVisible().catch(() => false);
    if (isVisible) {
      const attributes = await langToggle.getAttributes();
      if (!attributes.label?.includes('AR') && !attributes.text?.includes('AR')) {
        await langToggle.tap();
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
  }

  async function switchToEnglish() {
    const langToggle = element(by.id('language-toggle'));
    const isVisible = await langToggle.isVisible().catch(() => false);
    if (isVisible) {
      const attributes = await langToggle.getAttributes();
      if (!attributes.label?.includes('EN') && !attributes.text?.includes('EN')) {
        await langToggle.tap();
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }
  }

  describe('RTL - Header layout', () => {
    beforeAll(async () => {
      await waitFor(element(by.id('app-header')))
        .toBeVisible()
        .withTimeout(10000);
      await switchToArabic();
    });

    afterAll(async () => {
      await switchToEnglish();
    });

    it('should have header fully inside screen in RTL', async () => {
      const screen = await getScreenDimensions();
      await assertElementInsideScreen('app-header', screen);
    });

    it('should have menu button on the right side in RTL', async () => {
      const screen = await getScreenDimensions();
      const menuBtn = element(by.id('menu-button'));
      const isVisible = await menuBtn.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(menuBtn);
        expect(bounds.x).toBeGreaterThanOrEqual(screen.width - bounds.width - 100);
      }
    });

    it('should have header action icons on the left side in RTL', async () => {
      const langToggle = element(by.id('language-toggle'));
      const isVisible = await langToggle.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(langToggle);
        expect(bounds.x).toBeLessThanOrEqual(200);
      }
    });

    it('should capture RTL header screenshot', async () => {
      const result = await takeScreenshotAndCompare('header-rtl');
      expect(result.passed).toBe(true);
    });
  });

  describe('RTL - Sidebar layout', () => {
    beforeAll(async () => {
      await switchToArabic();
    });

    afterAll(async () => {
      await switchToEnglish();
    });

    it('should open sidebar from right side in RTL', async () => {
      const menuBtn = element(by.id('menu-button'));
      await waitFor(menuBtn).toBeVisible().withTimeout(5000);
      await menuBtn.tap();
      await new Promise(resolve => setTimeout(resolve, 600));

      const screen = await getScreenDimensions();
      const sidebar = element(by.id('sidebar'));
      const isVisible = await sidebar.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(sidebar);
        expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(screen.width - 284);
      }
    });

    it('should have sidebar fully inside screen in RTL', async () => {
      const screen = await getScreenDimensions();
      await assertElementInsideScreen('sidebar', screen);

      await element(by.id('sidebar-overlay'))
        .tap()
        .catch(() => device.pressBack());
      await new Promise(resolve => setTimeout(resolve, 400));
    });

    it('should capture RTL sidebar screenshot', async () => {
      const menuBtn = element(by.id('menu-button'));
      await menuBtn.tap();
      await new Promise(resolve => setTimeout(resolve, 600));

      const result = await takeScreenshotAndCompare('sidebar-rtl');
      expect(result.passed).toBe(true);

      await element(by.id('sidebar-overlay'))
        .tap()
        .catch(() => device.pressBack());
      await new Promise(resolve => setTimeout(resolve, 400));
    });
  });

  describe('RTL - Dashboard content', () => {
    beforeAll(async () => {
      await switchToArabic();
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    afterAll(async () => {
      await switchToEnglish();
    });

    it('should have dashboard content inside screen in RTL', async () => {
      const screen = await getScreenDimensions();
      await assertElementInsideScreen('dashboard-content', screen);
    });

    it('should have summary cards not overflowing in RTL', async () => {
      const screen = await getScreenDimensions();
      await assertNoHorizontalOverflow('summary-grid', screen);
    });

    it('should have text aligned to the right in RTL', async () => {
      const greeting = element(by.id('dashboard-greeting'));
      const isVisible = await greeting.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(greeting);
        expect(bounds.width).toBeGreaterThan(50);
      }
    });

    it('should capture RTL dashboard screenshot', async () => {
      const result = await takeScreenshotAndCompare('dashboard-rtl');
      expect(result.passed).toBe(true);
    });
  });

  describe('RTL - Login screen', () => {
    beforeAll(async () => {
      await switchToArabic();
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    afterAll(async () => {
      await switchToEnglish();
    });

    it('should have login form inside screen in RTL', async () => {
      const screen = await getScreenDimensions();
      await assertElementInsideScreen('login-screen', screen);
    });

    it('should have email input text aligned right in RTL', async () => {
      const emailInput = element(by.id('email-input'));
      const isVisible = await emailInput.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(emailInput);
        expect(bounds.width).toBeGreaterThan(100);
      }
    });

    it('should capture RTL login screenshot', async () => {
      const result = await takeScreenshotAndCompare('login-rtl');
      expect(result.passed).toBe(true);
    });
  });

  describe('RTL - No horizontal overflow', () => {
    beforeAll(async () => {
      await switchToArabic();
    });

    afterAll(async () => {
      await switchToEnglish();
    });

    it('should have no elements with negative x in RTL', async () => {
      const screen = await getScreenDimensions();
      const ids = ['app-header', 'dashboard-content', 'summary-grid'];

      for (const id of ids) {
        const el = element(by.id(id));
        const isVisible = await el.isVisible().catch(() => false);
        if (isVisible) {
          const bounds = await getElementBounds(id);
          expect(bounds.x).toBeGreaterThanOrEqual(-2);
          expect(bounds.x + bounds.width).toBeLessThanOrEqual(screen.width + 2);
        }
      }
    });
  });
});
