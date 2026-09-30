const appJson = require('./app.json');

const isEASBuild = process.env.EAS_BUILD === 'true' || process.env.EAS_BUILD_PROFILE === 'production' || process.env.EAS_BUILD_PROFILE === 'preview';
const isProd = process.env.NODE_ENV === 'production' || isEASBuild;

// In development (Expo Go) disable EAS Updates to avoid "Failed to download remote update"
// EAS Updates should only be enabled for production/preview builds
module.exports = {
  expo: {
    ...appJson.expo,
    updates: {
      ...appJson.expo.updates,
      enabled: isProd ? true : false,
      checkAutomatically: isProd ? 'ON_ERROR_RECOVERY' : 'NEVER',
    },
  },
};
