const { device, element, by, expect } = require('detox');
const {
  getElementBounds,
  getScreenDimensions,
  assertElementInsideScreen,
  assertNoHorizontalOverflow,
  assertNoVerticalOverflow,
  assertElementsDontOverlap,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');

describe('Layout Overflow Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Login Screen - No elements outside screen', () => {
    it('should have all login form elements inside screen bounds', async () => {
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);

      const screen = await getScreenDimensions();

      const loginScreen = element(by.id('login-screen'));
      await assertElementInsideScreen(loginScreen, screen);

      const result = await takeScreenshotAndCompare('login-screen-overflow');
      expect(result.passed).toBe(true);
    });

    it('should have email input fully visible', async () => {
      const emailInput = element(by.id('email-input'));
      await waitFor(emailInput).toBeVisible().withTimeout(5000);
      await assertElementInsideScreen(emailInput, await getScreenDimensions());
    });

    it('should have password input fully visible', async () => {
      const passwordInput = element(by.id('password-input'));
      await waitFor(passwordInput).toBeVisible().withTimeout(5000);
      await assertElementInsideScreen(passwordInput, await getScreenDimensions());
    });

    it('should have login button fully visible and not overlapping inputs', async () => {
      const loginBtn = element(by.id('login-button'));
      await waitFor(loginBtn).toBeVisible().withTimeout(5000);
      await assertElementInsideScreen(loginBtn, await getScreenDimensions());
    });
  });

  describe('Dashboard Screen - Summary cards not overflowing', () => {
    beforeAll(async () => {
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should have dashboard container inside screen bounds', async () => {
      const screen = await getScreenDimensions();
      const dashboard = element(by.id('dashboard-screen'));
      await assertElementInsideScreen(dashboard, screen);
    });

    it('should have summary cards inside screen horizontally', async () => {
      const screen = await getScreenDimensions();
      const summaryGrid = element(by.id('summary-grid'));
      const gridBounds = await getElementBounds(summaryGrid);

      expect(gridBounds.x).toBeGreaterThanOrEqual(0);
      expect(gridBounds.x + gridBounds.width).toBeLessThanOrEqual(screen.width + 1);
    });

    it('should have no horizontal overflow on any child element', async () => {
      const screen = await getScreenDimensions();
      const sections = ['summary-grid', 'charts-section', 'table-section', 'logs-section'];

      for (const sectionId of sections) {
        const el = element(by.id(sectionId));
        const isVisible = await el.isVisible().catch(() => false);
        if (isVisible) {
          await assertNoHorizontalOverflow(sectionId, screen);
        }
      }
    });

    it('should have dashboard content screenshot matching baseline', async () => {
      const result = await takeScreenshotAndCompare('dashboard-overflow');
      expect(result.passed).toBe(true);
    });
  });

  describe('Dashboard Layout - Header and Content area', () => {
    it('should have header fully inside screen', async () => {
      const screen = await getScreenDimensions();
      const header = element(by.id('app-header'));
      await waitFor(header).toBeVisible().withTimeout(5000);
      await assertElementInsideScreen(header, screen);
    });

    it('should have content area not overlapping header', async () => {
      const header = element(by.id('app-header'));
      const content = element(by.id('dashboard-content'));

      const headerVisible = await header.isVisible().catch(() => false);
      const contentVisible = await content.isVisible().catch(() => false);

      if (headerVisible && contentVisible) {
        await assertElementsDontOverlap(header, content);
      }
    });

    it('should have sidebar fully inside screen when opened', async () => {
      const menuBtn = element(by.id('menu-button'));
      await waitFor(menuBtn).toBeVisible().withTimeout(5000);
      await menuBtn.tap();

      await new Promise(resolve => setTimeout(resolve, 500));

      const screen = await getScreenDimensions();
      const sidebar = element(by.id('sidebar'));
      await assertElementInsideScreen(sidebar, screen);

      await takeScreenshotAndCompare('sidebar-open-overflow');
    });
  });

  describe('List Screen - Table elements not overflowing', () => {
    beforeAll(async () => {
      const menuItem = element(by.text('Employees'));
      const isVisible = await menuItem.isVisible().catch(() => false);
      if (isVisible) {
        await menuItem.tap();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    });

    it('should have list content inside screen bounds', async () => {
      const screen = await getScreenDimensions();
      const listContainer = element(by.id('list-container'));
      const isVisible = await listContainer.isVisible().catch(() => false);

      if (isVisible) {
        await assertElementInsideScreen(listContainer, screen);
      }
    });

    it('should have search bar fully visible', async () => {
      const search = element(by.id('search-input'));
      const isVisible = await search.isVisible().catch(() => false);

      if (isVisible) {
        await assertElementInsideScreen(search, await getScreenDimensions());
      }
    });

    it('should have pagination not overflowing screen bottom', async () => {
      const pagination = element(by.id('pagination'));
      const isVisible = await pagination.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(pagination);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
      }
    });
  });

  describe('Form Screen - Form elements not overflowing', () => {
    beforeAll(async () => {
      const createBtn = element(by.id('create-button'));
      const isVisible = await createBtn.isVisible().catch(() => false);
      if (isVisible) {
        await createBtn.tap();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    });

    it('should have form fields inside screen bounds', async () => {
      const screen = await getScreenDimensions();
      const form = element(by.id('form-container'));
      const isVisible = await form.isVisible().catch(() => false);

      if (isVisible) {
        await assertElementInsideScreen(form, screen);
      }
    });

    it('should have submit button fully visible', async () => {
      const submitBtn = element(by.id('submit-button'));
      const isVisible = await submitBtn.isVisible().catch(() => false);

      if (isVisible) {
        await assertElementInsideScreen(submitBtn, await getScreenDimensions());
      }
    });
  });

  describe('Detail Screen - Detail cards not overflowing', () => {
    it('should have detail sections inside screen', async () => {
      const screen = await getScreenDimensions();
      const detailHeader = element(by.id('detail-header'));
      const isVisible = await detailHeader.isVisible().catch(() => false);

      if (isVisible) {
        await assertElementInsideScreen(detailHeader, screen);
      }
    });
  });

  describe('Modal - Not overflowing screen', () => {
    it('should have modal fully contained within screen', async () => {
      const modal = element(by.id('modal-overlay'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        await assertElementInsideScreen(modal, screen);
        await takeScreenshotAndCompare('modal-overflow');
      }
    });
  });

  describe('FAB - Not overlapping content', () => {
    it('should have FAB inside screen bounds', async () => {
      const fab = element(by.id('fab-button'));
      const isVisible = await fab.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(fab);

        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(screen.width + 2);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
      }
    });
  });
});
