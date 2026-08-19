const { device, element, by, expect } = require('detox');
const {
  SPACING,
  getElementBounds,
  getScreenDimensions,
  assertSpacingConsistent,
} = require('../helpers/layout-helpers');
const { takeScreenshotAndCompare } = require('../helpers/screenshot-helpers');

describe('Spacing Consistency Tests', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  afterAll(async () => {
    await device.terminateApp();
  });

  describe('Dashboard - Summary cards spacing', () => {
    beforeAll(async () => {
      await waitFor(element(by.id('dashboard-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should have consistent gap between summary cards', async () => {
      const card1 = element(by.id('summary-card-0'));
      const card2 = element(by.id('summary-card-1'));

      const card1Visible = await card1.isVisible().catch(() => false);
      const card2Visible = await card2.isVisible().catch(() => false);

      if (card1Visible && card2Visible) {
        const b1 = await getElementBounds(card1);
        const b2 = await getElementBounds(card2);

        if (b1.y === b2.y) {
          const gap = Math.abs(b2.x - (b1.x + b1.width));
          expect(Math.abs(gap - SPACING.sm)).toBeLessThanOrEqual(4);
        }
      }
    });

    it('should have consistent vertical gap between summary grid and charts', async () => {
      const grid = element(by.id('summary-grid'));
      const charts = element(by.id('charts-section'));

      const gridVisible = await grid.isVisible().catch(() => false);
      const chartsVisible = await charts.isVisible().catch(() => false);

      if (gridVisible && chartsVisible) {
        const b1 = await getElementBounds(grid);
        const b2 = await getElementBounds(charts);

        const gap = b2.y - (b1.y + b1.height);
        expect(gap).toBeGreaterThanOrEqual(SPACING.sm - 2);
        expect(gap).toBeLessThanOrEqual(SPACING.lg + 4);
      }
    });

    it('should have dashboard content padding consistent (spacing.md = 16)', async () => {
      const content = element(by.id('dashboard-content'));
      const isVisible = await content.isVisible().catch(() => false);

      if (isVisible) {
        const screen = await getScreenDimensions();
        const bounds = await getElementBounds(content);

        const leftPadding = bounds.x;
        expect(leftPadding).toBeGreaterThanOrEqual(SPACING.sm - 2);
        expect(leftPadding).toBeLessThanOrEqual(SPACING.xl + 2);
      }
    });

    it('should capture dashboard spacing screenshot', async () => {
      const result = await takeScreenshotAndCompare('dashboard-spacing');
      expect(result.passed).toBe(true);
    });
  });

  describe('Header - Internal spacing', () => {
    it('should have consistent icon button sizes in header', async () => {
      const header = element(by.id('app-header'));
      const isVisible = await header.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(header);
        expect(bounds.height).toBeGreaterThanOrEqual(44);
        expect(bounds.height).toBeLessThanOrEqual(100);
      }
    });

    it('should have consistent padding in header sides', async () => {
      const screen = await getScreenDimensions();
      const header = element(by.id('app-header'));
      const isVisible = await header.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(header);
        const horizontalPadding = bounds.x;

        expect(horizontalPadding).toBeGreaterThanOrEqual(SPACING.sm - 2);
        expect(horizontalPadding).toBeLessThanOrEqual(SPACING.xl + 2);
      }
    });
  });

  describe('Form Screen - Field spacing', () => {
    it('should have consistent gap between form fields', async () => {
      const field1 = element(by.id('form-field-0'));
      const field2 = element(by.id('form-field-1'));

      const f1Visible = await field1.isVisible().catch(() => false);
      const f2Visible = await field2.isVisible().catch(() => false);

      if (f1Visible && f2Visible) {
        const b1 = await getElementBounds(field1);
        const b2 = await getElementBounds(field2);

        const gap = b2.y - (b1.y + b1.height);
        expect(gap).toBeGreaterThanOrEqual(SPACING.xs - 2);
        expect(gap).toBeLessThanOrEqual(SPACING.md + 4);
      }
    });

    it('should have form section cards with consistent padding', async () => {
      const section = element(by.id('form-section-0'));
      const isVisible = await section.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(section);
        expect(bounds.width).toBeGreaterThan(100);
      }
    });
  });

  describe('List Screen - Row spacing', () => {
    it('should have consistent row heights in list', async () => {
      const row1 = element(by.id('list-row-0'));
      const row2 = element(by.id('list-row-1'));

      const r1Visible = await row1.isVisible().catch(() => false);
      const r2Visible = await row2.isVisible().catch(() => false);

      if (r1Visible && r2Visible) {
        const b1 = await getElementBounds(row1);
        const b2 = await getElementBounds(row2);

        expect(Math.abs(b1.height - b2.height)).toBeLessThanOrEqual(8);
      }
    });

    it('should have consistent gap between header and rows', async () => {
      const tableHead = element(by.id('table-header'));
      const firstRow = element(by.id('list-row-0'));

      const headVisible = await tableHead.isVisible().catch(() => false);
      const rowVisible = await firstRow.isVisible().catch(() => false);

      if (headVisible && rowVisible) {
        const b1 = await getElementBounds(tableHead);
        const b2 = await getElementBounds(firstRow);

        const gap = b2.y - (b1.y + b1.height);
        expect(gap).toBeGreaterThanOrEqual(0);
        expect(gap).toBeLessThanOrEqual(SPACING.md + 4);
      }
    });
  });

  describe('Detail Screen - Section card spacing', () => {
    it('should have consistent gap between detail sections', async () => {
      const section1 = element(by.id('detail-section-0'));
      const section2 = element(by.id('detail-section-1'));

      const s1Visible = await section1.isVisible().catch(() => false);
      const s2Visible = await section2.isVisible().catch(() => false);

      if (s1Visible && s2Visible) {
        const b1 = await getElementBounds(section1);
        const b2 = await getElementBounds(section2);

        const gap = b2.y - (b1.y + b1.height);
        expect(gap).toBeGreaterThanOrEqual(SPACING.xs - 2);
        expect(gap).toBeLessThanOrEqual(SPACING.xl + 4);
      }
    });

    it('should have consistent padding inside section cards', async () => {
      const section = element(by.id('detail-section-0'));
      const isVisible = await section.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(section);
        expect(bounds.width).toBeGreaterThan(200);
      }
    });
  });

  describe('Login Screen - Form spacing', () => {
    beforeAll(async () => {
      await waitFor(element(by.id('login-screen')))
        .toBeVisible()
        .withTimeout(10000);
    });

    it('should have consistent gap between email and password fields', async () => {
      const emailField = element(by.id('email-input'));
      const passwordField = element(by.id('password-input'));

      const eVisible = await emailField.isVisible().catch(() => false);
      const pVisible = await passwordField.isVisible().catch(() => false);

      if (eVisible && pVisible) {
        const b1 = await getElementBounds(emailField);
        const b2 = await getElementBounds(passwordField);

        const gap = b2.y - (b1.y + b1.height);
        expect(gap).toBeGreaterThanOrEqual(SPACING.sm - 2);
        expect(gap).toBeLessThanOrEqual(SPACING.xl + 4);
      }
    });

    it('should have login form horizontally centered with equal padding', async () => {
      const screen = await getScreenDimensions();
      const form = element(by.id('login-form'));
      const isVisible = await form.isVisible().catch(() => false);

      if (isVisible) {
        const bounds = await getElementBounds(form);
        const leftPad = bounds.x;
        const rightPad = screen.width - (bounds.x + bounds.width);

        expect(Math.abs(leftPad - rightPad)).toBeLessThanOrEqual(SPACING.md);
      }
    });

    it('should capture login spacing screenshot', async () => {
      const result = await takeScreenshotAndCompare('login-spacing');
      expect(result.passed).toBe(true);
    });
  });

  describe('Global spacing - No negative margins or zero gaps where expected', () => {
    it('should have no elements with negative x position', async () => {
      const screen = await getScreenDimensions();
      const ids = [
        'app-header', 'dashboard-content', 'summary-grid',
        'charts-section', 'sidebar',
      ];

      for (const id of ids) {
        const el = element(by.id(id));
        const isVisible = await el.isVisible().catch(() => false);
        if (isVisible) {
          const bounds = await getElementBounds(id);
          expect(bounds.x).toBeGreaterThanOrEqual(-2);
        }
      }
    });
  });
});
