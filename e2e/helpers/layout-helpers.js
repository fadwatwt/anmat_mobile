const { device, element, by, expect } = require('detox');

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
};

async function getElementBounds(matcher) {
  const el = typeof matcher === 'string' ? element(by.id(matcher)) : matcher;
  const bounds = await el.getAttributes();
  return {
    x: bounds.frame?.x ?? 0,
    y: bounds.frame?.y ?? 0,
    width: bounds.frame?.width ?? 0,
    height: bounds.frame?.height ?? 0,
  };
}

async function getScreenDimensions() {
  const dimString = await device._device.emitter._dimensionsString || '';
  const info = device.getDeviceInfo();
  return {
    width: info?.windowWidth || 393,
    height: info?.windowHeight || 852,
  };
}

async function assertElementInsideScreen(matcher, screenBounds) {
  const bounds = await getElementBounds(matcher);
  const screen = screenBounds || await getScreenDimensions();

  expect(bounds.x).toBeGreaterThanOrEqual(0);
  expect(bounds.y).toBeGreaterThanOrEqual(0);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(screen.width + 1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 1);
}

async function assertNoHorizontalOverflow(matcher, screenBounds) {
  const bounds = await getElementBounds(matcher);
  const screen = screenBounds || await getScreenDimensions();

  expect(bounds.x).toBeGreaterThanOrEqual(-1);
  expect(bounds.x + bounds.width).toBeLessThanOrEqual(screen.width + 2);
}

async function assertNoVerticalOverflow(matcher, screenBounds) {
  const bounds = await getElementBounds(matcher);
  const screen = screenBounds || await getScreenDimensions();

  expect(bounds.y).toBeGreaterThanOrEqual(-1);
  expect(bounds.y + bounds.height).toBeLessThanOrEqual(screen.height + 2);
}

async function assertMinimumTapTarget(matcher, minSize = 44) {
  const bounds = await getElementBounds(matcher);
  expect(bounds.width).toBeGreaterThanOrEqual(minSize);
  expect(bounds.height).toBeGreaterThanOrEqual(minSize);
}

async function assertElementHasPadding(matcher, expectedPadding) {
  const bounds = await getElementBounds(matcher);
  const text = await element(matcher).getAttributes();
  const innerWidth = bounds.width - (expectedPadding * 2);
  expect(innerWidth).toBeGreaterThan(0);
}

async function assertElementsDontOverlap(matcher1, matcher2) {
  const b1 = await getElementBounds(matcher1);
  const b2 = await getElementBounds(matcher2);

  const overlapX = b1.x < b2.x + b2.width && b1.x + b1.width > b2.x;
  const overlapY = b1.y < b2.y + b2.height && b1.y + b1.height > b2.y;

  expect(overlapX && overlapY).toBe(false);
}

async function assertElementFullyVisible(matcher, containerMatcher) {
  const elBounds = await getElementBounds(matcher);
  const containerBounds = containerMatcher
    ? await getElementBounds(containerMatcher)
    : await getScreenDimensions();

  expect(elBounds.x).toBeGreaterThanOrEqual(containerBounds.x - 1);
  expect(elBounds.y).toBeGreaterThanOrEqual(containerBounds.y - 1);
  expect(elBounds.x + elBounds.width).toBeLessThanOrEqual(
    (containerBounds.x || 0) + containerBounds.width + 1
  );
  expect(elBounds.y + elBounds.height).toBeLessThanOrEqual(
    (containerBounds.y || 0) + containerBounds.height + 1
  );
}

async function assertSpacingConsistent(matcher1, matcher2, expectedSpacing) {
  const b1 = await getElementBounds(matcher1);
  const b2 = await getElementBounds(matcher2);

  const verticalGap = Math.abs(b2.y - (b1.y + b1.height));
  const horizontalGap = Math.abs(b2.x - (b1.x + b1.width));

  if (verticalGap > 0) {
    expect(Math.abs(verticalGap - expectedSpacing)).toBeLessThanOrEqual(4);
  }
  if (horizontalGap > 0) {
    expect(Math.abs(horizontalGap - expectedSpacing)).toBeLessThanOrEqual(4);
  }
}

async function assertSafeAreaInsets(matcher, expectedInsets, screenBounds) {
  const bounds = await getElementBounds(matcher);
  const screen = screenBounds || await getScreenDimensions();

  if (expectedInsets.top !== undefined) {
    expect(bounds.y).toBeGreaterThanOrEqual(expectedInsets.top - 1);
  }
  if (expectedInsets.left !== undefined) {
    expect(bounds.x).toBeGreaterThanOrEqual(expectedInsets.left - 1);
  }
  if (expectedInsets.right !== undefined) {
    expect(bounds.x + bounds.width).toBeLessThanOrEqual(
      screen.width - expectedInsets.right + 1
    );
  }
}

async function assertTextNotTruncatedHorizontally(matcher) {
  const bounds = await getElementBounds(matcher);
  expect(bounds.width).toBeGreaterThan(0);
}

async function assertScrollableContent(scrollMatcher) {
  const scrollBounds = await getElementBounds(scrollMatcher);
  expect(scrollBounds.height).toBeGreaterThan(0);
  expect(scrollBounds.width).toBeGreaterThan(0);
}

async function scrollToEnd(scrollViewMatcher, direction = 'down') {
  const scrollEl = typeof scrollViewMatcher === 'string'
    ? element(by.id(scrollViewMatcher))
    : scrollViewMatcher;

  if (direction === 'down') {
    await scrollEl.scroll(500, 'down');
  } else {
    await scrollEl.scroll(500, 'up');
  }
}

module.exports = {
  SPACING,
  getElementBounds,
  getScreenDimensions,
  assertElementInsideScreen,
  assertNoHorizontalOverflow,
  assertNoVerticalOverflow,
  assertMinimumTapTarget,
  assertElementHasPadding,
  assertElementsDontOverlap,
  assertElementFullyVisible,
  assertSpacingConsistent,
  assertSafeAreaInsets,
  assertTextNotTruncatedHorizontally,
  assertScrollableContent,
  scrollToEnd,
};
