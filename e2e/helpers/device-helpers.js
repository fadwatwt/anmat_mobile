const { device } = require('detox');
const { DEVICE_PROFILES } = require('../config/layout.config');

async function configureDeviceForTest(profileName = 'standard') {
  const profile = DEVICE_PROFILES[profileName];
  if (!profile) {
    throw new Error(`Unknown device profile: ${profileName}`);
  }

  return {
    profile,
    screen: {
      width: profile.width,
      height: profile.height,
    },
    insets: profile.insets,
  };
}

async function simulateNavigationType(type) {
  switch (type) {
    case 'swipe':
      return { bottom: 0, name: 'Swipe Gestures (Gesture Navigation)' };
    case 'navBar':
      return { bottom: 48, name: 'Navigation Bar (3-Button Navigation)' };
    case 'twoButton':
      return { bottom: 40, name: '2-Button Navigation' };
    default:
      return { bottom: 0, name: 'Default' };
  }
}

async function simulateNotchType(type) {
  switch (type) {
    case 'notch':
      return { top: 34, name: 'Notch' };
    case 'dynamicIsland':
      return { top: 59, name: 'Dynamic Island' };
    case 'punchHole':
      return { top: 48, name: 'Punch Hole Camera' };
    case 'none':
      return { top: 24, name: 'No Notch (Standard Status Bar)' };
    default:
      return { top: 0, name: 'No Status Bar' };
  }
}

const SCREEN_SIZES = {
  small: { width: 320, height: 568, name: 'Small (iPhone SE)' },
  medium: { width: 375, height: 667, name: 'Medium (iPhone 8)' },
  standard: { width: 393, height: 852, name: 'Standard (iPhone 14)' },
  large: { width: 430, height: 932, name: 'Large (iPhone 14 Pro Max)' },
  tablet: { width: 768, height: 1024, name: 'Tablet (iPad Mini)' },
};

function getScreenSizeForProfile(profileName) {
  const profile = DEVICE_PROFILES[profileName];
  if (!profile) return SCREEN_SIZES.standard;
  return {
    width: profile.width,
    height: profile.height,
    name: profile.name,
  };
}

function getAllScreenSizes() {
  return Object.entries(SCREEN_SIZES).map(([key, value]) => ({
    key,
    ...value,
  }));
}

module.exports = {
  configureDeviceForTest,
  simulateNavigationType,
  simulateNotchType,
  SCREEN_SIZES,
  getScreenSizeForProfile,
  getAllScreenSizes,
};
