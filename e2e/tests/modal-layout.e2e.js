const { device, element, by, expect } = require('detox');
const {
  getElementBounds,
  getScreenDimensions,
  assertElementInsideScreen,
  assertElementFullyVisible,
  assertMinimumTapTarget,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');

describe('Modal Layout Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Modal overlay', () => {
    it('should have overlay covering full screen', async () => {
      const modal = element(by.id('modal-overlay'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(modal);

        expect(bounds.width).toBeGreaterThanOrEqual(screen.width - 2);
        expect(bounds.height).toBeGreaterThanOrEqual(screen.height - 2);
      }
    });
  });

  describe('Modal container', () => {
    it('should have modal container inside screen bounds', async () => {
      const modal = element(by.id('modal-container'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        await assertElementInsideScreen('modal-container', screen);
      }
    });

    it('should have modal width less than screen width', async () => {
      const modal = element(by.id('modal-container'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(modal);

        expect(bounds.width).toBeLessThan(screen.width);
        expect(bounds.width).toBeGreaterThan(screen.width * 0.5);
      }
    });

    it('should have modal height less than screen height', async () => {
      const modal = element(by.id('modal-container'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(modal);

        expect(bounds.height).toBeLessThan(screen.height);
        expect(bounds.height).toBeGreaterThan(screen.height * 0.2);
      }
    });

    it('should have modal centered on screen', async () => {
      const modal = element(by.id('modal-container'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(modal);

        const centerX = bounds.x + bounds.width / 2;
        const centerY = bounds.y + bounds.height / 2;

        expect(Math.abs(centerX - screen.width / 2)).toBeLessThanOrEqual(20);
        expect(Math.abs(centerY - screen.height / 2)).toBeLessThanOrEqual(40);
      }
    });
  });

  describe('Modal header', () => {
    it('should have modal title fully visible', async () => {
      const title = element(by.id('modal-title'));
      const isVisible = await title.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(title);
        expect(bounds.width).toBeGreaterThan(30);
        expect(bounds.height).toBeGreaterThanOrEqual(16);
      }
    });

    it('should have modal close button with minimum tap target', async () => {
      const closeBtn = element(by.id('modal-close'));
      const isVisible = await closeBtn.isVisible().catch(() => false);

      if (isVisible) {
        await assertMinimumTapTarget('modal-close', 44);
      }
    });

    it('should have close button inside modal container', async () => {
      const modal = element(by.id('modal-container'));
      const closeBtn = element(by.id('modal-close'));

      const modalVisible = await modal.isVisible().catch(() => false);
      const closeVisible = await closeBtn.isVisible().catch(() => false);

      if (modalVisible && closeVisible) {
        await assertElementFullyVisible('modal-close', 'modal-container');
      }
    });
  });

  describe('Modal content', () => {
    it('should have modal content inside container', async () => {
      const content = element(by.id('modal-content'));
      const isVisible = await content.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(content);

        expect(bounds.x).toBeGreaterThanOrEqual(0);
        expect(bounds.y).toBeGreaterThanOrEqual(0);
        expect(bounds.x + bounds.width).toBeLessThanOrEqual(screen.width + 2);
        expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
      }
    });

    it('should have modal scrollable content', async () => {
      const scroll = element(by.id('modal-scroll'));
      const isVisible = await scroll.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(scroll);
        expect(bounds.height).toBeGreaterThan(50);
      }
    });
  });

  describe('User dropdown menu (acts as modal)', () => {
    it('should have dropdown fully inside screen', async () => {
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
          await takeScreenshotAndCompare('user-dropdown-layout');
        }

        await element(by.id('user-dropdown-overlay'))
          .tap()
          .catch(() => device.pressBack());
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    });

    it('should have dropdown menu items with minimum tap target', async () => {
      const userChip = element(by.id('user-chip'));
      const isVisible = await userChip.isVisible().catch(() => false);

      if (isVisible) {
        await userChip.tap();
        await new Promise(resolve => setTimeout(resolve, 300));

        const profileItem = element(by.id('dropdown-profile'));
        const profileVisible = await profileItem.isVisible().catch(() => false);

        if (profileVisible) {
          await assertMinimumTapTarget('dropdown-profile', 44);
        }

        const logoutItem = element(by.id('dropdown-logout'));
        const logoutVisible = await logoutItem.isVisible().catch(() => false);

        if (logoutVisible) {
          await assertMinimumTapTarget('dropdown-logout', 44);
        }

        await device.pressBack();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    });
  });

  describe('Modal screenshots', () => {
    it('should capture modal layout when visible', async () => {
      const modal = element(by.id('modal-container'));
      const isVisible = await modal.isVisible().catch(() => false);

      if (isVisible) {
        const result = await takeScreenshotAndCompare('modal-layout-baseline');
        expect(result.passed).toBe(true);
      }
    });
  });
});
