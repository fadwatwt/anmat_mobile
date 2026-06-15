// Empty stub — replaces DevicePushTokenAutoRegistration.fx.js which crashes
// in Expo Go by calling addPushTokenListener at module-level (SDK 53+ removed
// Android push support from Expo Go). This stub is safe in production builds
// because initPushNotifications() in pushNotifications.ts handles registration.
export function setAutoServerRegistrationEnabledAsync() {}
export function __handlePersistedRegistrationInfoAsync() {}
