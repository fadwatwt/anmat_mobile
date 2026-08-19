const { device, element, by, expect } = require('detox');
const {
  getElementBounds,
  getScreenDimensions,
  assertElementInsideScreen,
  assertNoHorizontalOverflow,
  assertMinimumTapTarget,
  assertElementsDontOverlap,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');

describe('Header Layout Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Header structure and visibility', () => {
    beforeAll(async () => {
      await waitFor(element(by.id('app-header')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should have header visible with correct height', async () => {
      const header = element(by.id('app-header'));
      const bounds = await getElementBounds(header);

      expect(bounds.height).toBeGreaterThanOrEqual(44);
      expect(bounds.height).toBeLessThanOrEqual(100);
    });

    it('should have header spanning full screen width', async () => {
      const screen = await getScreenDimensions();
      const header = element(by.id('app-header'));
      const bounds = await getElementBounds(header);

      expect(bounds.x).toBeLessThanOrEqual(4);
      expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(screen.width - 4);
    });

    it('should have header not overflowing screen', async () => {
      const screen = await getScreenDimensions();
      await assertElementInsideScreen('app-header', screen);
    });
  });

  describe('Header elements - Menu button', () => {
    it('should have menu button with minimum tap target (44x44)', async () => {
      const menuBtn = element(by.id('menu-button'));
      const isVisible = await menuBtn.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('menu-button', 44);
      }
    });

    it('should have menu button fully inside screen', async () => {
      const screen = await getScreenDimensions();
      const menuBtn = element(by.id('menu-button'));
      const isVisible = await menuBtn.isVisible().catch(() => false);

      if (isVisible) {
        await assertElementInsideScreen('menu-button', screen);
      }
    });
  });

  describe('Header elements - Title', () => {
    it('should have title fully visible and not truncated', async () => {
      const title = element(by.id('header-title'));
      const isVisible = await title.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(title);
        expect(bounds.width).toBeGreaterThan(50);
        expect(bounds.height).toBeGreaterThanOrEqual(20);

        await assertNoHorizontalOverflow('header-title', await getScreenDimensions());
      }
    });

    it('should have title not overlapping menu button', async () => {
      const menuBtn = element(by.id('menu-button'));
      const title = element(by.id('header-title'));

      const menuVisible = await menuBtn.isVisible().catch(() => false);
      const titleVisible = await title.isVisible().catch(() => false);

      if (menuVisible && titleVisible) {
        await assertElementsDontOverlap('menu-button', 'header-title');
      }
    });
  });

  describe('Header elements - Action icons', () => {
    it('should have notification bell with minimum tap target', async () => {
      const bell = element(by.id('notification-bell'));
      const isVisible = await bell.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('notification-bell', 44);
      }
    });

    it('should have theme toggle with minimum tap target', async () => {
      const themeToggle = element(by.id('theme-toggle'));
      const isVisible = await themeToggle.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('theme-toggle', 44);
      }
    });

    it('should have language toggle with minimum tap target', async () => {
      const langToggle = element(by.id('language-toggle'));
      const isVisible = await langToggle.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('language-toggle', 44);
      }
    });

    it('should have user chip with minimum tap target', async () => {
      const userChip = element(by.id('user-chip'));
      const isVisible = await userChip.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('user-chip', 44);
      }
    });

    it('should have all header icons inside screen', async () => {
      const screen = await getScreenDimensions();
      const icons = ['menu-button', 'notification-bell', 'theme-toggle', 'language-toggle', 'user-chip'];

      for (const id of icons) {
        const el = element(by.id(id));
        const isVisible = await el.isVisible().catch(() => false);
        if (isVisible) {
          await assertElementInsideScreen(id, screen);
        }
      }
    });
  });

  describe('Header elements - No overlap between left and right sections', () => {
    it('should have left and right header sections not overlapping', async () => {
      const leftSection = element(by.id('header-left'));
      const rightSection = element(by.id('header-right'));

      const leftVisible = await leftSection.isVisible().catch(() => false);
      const rightVisible = await rightSection.isVisible().catch(() => false);

      if (leftVisible && rightVisible) {
        await assertElementsDontOverlap('header-left', 'header-right');
      }
    });
  });

  describe('User dropdown menu', () => {
    it('should have dropdown fully inside screen when opened', async () => {
      const userChip = element(by.id('user-chip'));
      const isVisible = await userChip.isVisible().catch(() => false);

      if (isVisible) {
        await userChip.tap();
        await new Promise(resolve => setTimeout(resolve, 300));

        const screen = await getScreenDimensions();
        const dropdown = element(by.id('user-dropdown'));
        const dropdownVisible = await dropdown.isVisible().catch(() => false);

        if (dropdownVisible) {
          await assertElementInsideScreen('user-dropdown', screen);
          await takeScreenshotAndCompare('header-dropdown-layout');
        }

        await element(by.id('user-dropdown-overlay'))
          .tap()
          .catch(() => device.pressBack());
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    });
  });

  describe('Header - RTL layout', () => {
    it('should switch header layout direction for RTL', async () => {
      const langToggle = element(by.id('language-toggle'));
      const isVisible = await langToggle.isVisible().catch(() => false);

      if (isVisible) {
        await langToggle.tap();
        await new Promise(resolve => setTimeout(resolve, 500));

        const screen = await getScreenDimensions();
        await assertElementInsideScreen('app-header', screen);

        const result = await takeScreenshotAndCompare('header-rtl-layout');
        expect(result.passed).toBe(true);

        await langToggle.tap();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    });
  });

  describe('Header screenshots', () => {
    it('should capture header layout baseline', async () => {
      await waitFor(element(by.id('app-header')))
        .toBeVisible()
        .withTimeout(5000);

      const result = await takeScreenshotAndCompare('header-layout-baseline');
      expect(result.passed).toBe(true);
    });
  });
});
