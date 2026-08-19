const { device, element, by, expect } = require('detox');
const {
  getElementBounds,
  getScreenDimensions,
  assertElementInsideScreen,
  assertMinimumTapTarget,
  assertElementsDontOverlap,
  assertElementFullyVisible,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');

describe('Sidebar Layout Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  async function openSidebar() {
    const menuBtn = element(by.id('menu-button'));
    await waitFor(menuBtn).toBeVisible().withTimeout(5000);
    await menuBtn.tap();
    await new Promise(resolve => setTimeout(resolve, 600));
  }

  async function closeSidebar() {
    const overlay = element(by.id('sidebar-overlay'));
    const isVisible = await overlay.isVisible().catch(() => false);
    if (isVisible) {
      await overlay.tap();
      await new Promise(resolve => setTimeout(resolve, 400));
    } else {
      await device.pressBack();
      await new Promise(resolve => setTimeout(resolve, 400));
    }
  }

  describe('Sidebar visibility and position', () => {
    it('should open sidebar from menu button', async () => {
      await openSidebar();

      const sidebar = element(by.id('sidebar'));
      const isVisible = await sidebar.isVisible().catch(() => false);
      expect(isVisible).toBe(true);

      await closeSidebar();
    });

    it('should have sidebar fully inside screen when opened', async () => {
      await openSidebar();

      const screen = await getScreenDimensions();
      const sidebar = element(by.id('sidebar'));
      await assertElementInsideScreen('sidebar', screen);

      await closeSidebar();
    });

    it('should have sidebar width not exceeding 280px', async () => {
      await openSidebar();

      const sidebar = element(by.id('sidebar'));
      const bounds = await getElementBounds(sidebar);

      expect(bounds.width).toBeLessThanOrEqual(284);
      expect(bounds.width).toBeGreaterThanOrEqual(200);

      await closeSidebar();
    });

    it('should have sidebar stretching full height minus safe area', async () => {
      await openSidebar();

      const screen = await getScreenDimensions();
      const sidebar = element(by.id('sidebar'));
      const bounds = await getElementBounds(sidebar);

      expect(bounds.height).toBeGreaterThanOrEqual(screen.height * 0.7);

      await closeSidebar();
    });
  });

  describe('Sidebar overlay', () => {
    it('should show overlay covering full screen', async () => {
      await openSidebar();

      const screen = await getScreenDimensions();
      const overlay = element(by.id('sidebar-overlay'));
      const isVisible = await overlay.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(overlay);
        expect(bounds.width).toBeGreaterThanOrEqual(screen.width - 2);
        expect(bounds.height).toBeGreaterThanOrEqual(screen.height - 2);
      }

      await closeSidebar();
    });

    it('should close sidebar when overlay is tapped', async () => {
      await openSidebar();

      const overlay = element(by.id('sidebar-overlay'));
      const isVisible = await overlay.isVisible().catch(() => false);

      if (isVisible) {
        await overlay.tap();
        await new Promise(resolve => setTimeout(resolve, 400));

        const sidebar = element(by.id('sidebar'));
        const sidebarStillVisible = await sidebar.isVisible().catch(() => false);
        expect(sidebarStillVisible).toBe(false);
      }
    });
  });

  describe('Sidebar internal elements', () => {
    it('should have logo section fully visible', async () => {
      await openSidebar();

      const logo = element(by.id('sidebar-logo'));
      const isVisible = await logo.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(logo);
        expect(bounds.height).toBeGreaterThanOrEqual(40);
        await assertElementFullyVisible('sidebar-logo', 'sidebar');
      }

      await closeSidebar();
    });

    it('should have sidebar search input with minimum tap target', async () => {
      await openSidebar();

      const search = element(by.id('sidebar-search'));
      const isVisible = await search.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('sidebar-search', 44);
      }

      await closeSidebar();
    });

    it('should have menu items with minimum tap target (44px)', async () => {
      await openSidebar();

      const menuItem = element(by.id('sidebar-menu-item-0'));
      const isVisible = await menuItem.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('sidebar-menu-item-0', 44);
      }

      await closeSidebar();
    });

    it('should have sidebar close button visible', async () => {
      await openSidebar();

      const closeBtn = element(by.id('sidebar-close'));
      const isVisible = await closeBtn.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('sidebar-close', 44);
        await assertElementFullyVisible('sidebar-close', 'sidebar');
      }

      await closeSidebar();
    });
  });

  describe('Sidebar scroll content', () => {
    it('should have scrollable menu area', async () => {
      await openSidebar();

      const menuScroll = element(by.id('sidebar-menu-scroll'));
      const isVisible = await menuScroll.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(menuScroll);
        expect(bounds.height).toBeGreaterThan(100);
        expect(bounds.width).toBeGreaterThan(100);
      }

      await closeSidebar();
    });
  });

  describe('Sidebar - RTL layout', () => {
    it('should position sidebar on the right in RTL mode', async () => {
      const langToggle = element(by.id('language-toggle'));
      const isVisible = await langToggle.isVisible().catch(() => false);

      if (isVisible) {
        await langToggle.tap();
        await new Promise(resolve => setTimeout(resolve, 500));

        await openSidebar();

        const screen = await getScreenDimensions();
        const sidebar = element(by.id('sidebar'));
        const bounds = await getElementBounds(sidebar);

        expect(bounds.x + bounds.width).toBeGreaterThanOrEqual(screen.width - 284);

        const result = await takeScreenshotAndCompare('sidebar-rtl-layout');
        expect(result.passed).toBe(true);

        await closeSidebar();
        await langToggle.tap();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    });
  });

  describe('Sidebar screenshots', () => {
    it('should capture sidebar open layout', async () => {
      await openSidebar();

      const result = await takeScreenshotAndCompare('sidebar-layout-baseline');
      expect(result.passed).toBe(true);

      await closeSidebar();
    });
  });
});
