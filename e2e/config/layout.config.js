const { device, element, by } = require('detox');

const DEVICES = {
  'iPhone 14': { width: 390, height: 844, insets: { top: 59, bottom: 34, left: 0, right: 0 } },
  'iPhone 14 Pro Max': { width: 430, height: 932, insets: { top: 59, bottom: 34, left: 0, right: 0 } },
  'iPhone SE': { width: 375, height: 667, insets: { top: 20, bottom: 0, left: 0, right: 0 } },
  'Pixel 7': { width: 412, height: 915, insets: { top: 0, bottom: 0, left: 0, right: 0 } },
  'Pixel 7 (nav bar)': { width: 412, height: 915, insets: { top: 0, bottom: 48, left: 0, right: 0 } },
  'Small Screen': { width: 320, height: 568, insets: { top: 20, bottom: 0, left: 0, right: 0 } },
  'Tablet': { width: 800, height: 1280, insets: { top: 24, bottom: 0, left: 0, right: 0 } },
};

const DEVICE_PROFILES = {
  standard: {
    name: 'Standard Phone (Swipe Gestures)',
    ...DEVICES['Pixel 7'],
  },
  withNavBar: {
    name: 'Phone with Navigation Bar Buttons',
    ...DEVICES['Pixel 7 (nav bar)'],
  },
  iPhoneWithNotch: {
    name: 'iPhone with Notch/Dynamic Island',
    ...DEVICES['iPhone 14'],
  },
  iPhoneWithoutNotch: {
    name: 'iPhone SE (No Notch)',
    ...DEVICES['iPhone SE'],
  },
  small: {
    name: 'Small Screen',
    ...DEVICES['Small Screen'],
  },
  large: {
    name: 'Large Phone',
    ...DEVICES['iPhone 14 Pro Max'],
  },
  tablet: {
    name: 'Tablet',
    ...DEVICES['Tablet'],
  },
};

module.exports = { DEVICES, DEVICE_PROFILES };
