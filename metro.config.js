const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// In Expo Go, expo-notifications' DevicePushTokenAutoRegistration module
// calls addPushTokenListener at module-level, which crashes with SDK 53+.
// We replace it with an empty stub when running in Expo Go (detected via
// the EXPO_PUBLIC_* env or by checking if EAS_BUILD is set).
// The simplest approach: always stub it out — the stub is harmless in
// production builds because pushNotifications.ts calls the real module.
config.resolver = config.resolver || {};
const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName.includes('DevicePushTokenAutoRegistration') ||
    moduleName.includes('DevicePushTokenAutoRegistration.fx')
  ) {
    return {
      filePath: require.resolve('./src/stubs/DevicePushTokenAutoRegistration.stub.js'),
      type: 'sourceFile',
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
