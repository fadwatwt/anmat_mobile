import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { http } from '../lib/http';

// expo-notifications crashes in Expo Go (SDK 53+). Detect Expo Go via appOwnership.
// IMPORTANT: Do NOT require('expo-notifications') at module level — the package
// auto-registers an addPushTokenListener at import time which triggers the crash.
// Instead, call getNotifications() inside each function so the require only runs
// when the function is actually called (which we guard with isExpoGo first).

function isRunningInExpoGo(): boolean {
  return (
    Constants.appOwnership === 'expo' ||
    (Constants as any).executionEnvironment === 'storeClient'
  );
}

function getNotifications(): typeof import('expo-notifications') | null {
  if (isRunningInExpoGo()) return null;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('expo-notifications');
}

let initialized = false;
let foregroundListener: { remove(): void } | undefined;
let responseListener: { remove(): void } | undefined;
let lastNotificationResponse: unknown;

function ensureHandler() {
  if (initialized) return;
  initialized = true;
  const N = getNotifications();
  if (!N) return;
  N.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export function getLastNotificationResponse() {
  return lastNotificationResponse;
}

export function clearLastNotificationResponse() {
  lastNotificationResponse = undefined;
}

async function registerTokenWithBackend(token: string) {
  try {
    await http.post('/api/notifications/push-token/register', { token });
  } catch {
  }
}

async function unregisterTokenWithBackend(token: string) {
  try {
    await http.delete('/api/notifications/push-token/remove', { data: { token } });
  } catch {
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  const N = getNotifications();
  if (!N || !Device.isDevice) return null;

  const { status: existingStatus } = await N.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  const tokenData = await N.getExpoPushTokenAsync();
  return tokenData.data;
}

export async function setupAndroidChannel() {
  const N = getNotifications();
  if (!N || Platform.OS !== 'android') return;
  await N.setNotificationChannelAsync('default', {
    name: 'General',
    importance: N.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3F6FE3',
    sound: 'default',
  });
}

export async function initPushNotifications() {
  const N = getNotifications();
  if (!N) return null;

  ensureHandler();
  await setupAndroidChannel();

  const token = await getExpoPushToken();
  if (token) {
    await registerTokenWithBackend(token);
  }
  return token;
}

export async function logoutPushNotifications() {
  const N = getNotifications();
  if (!N) return;
  const token = await getExpoPushToken();
  if (token) {
    await unregisterTokenWithBackend(token);
  }
}

export function startForegroundListener() {
  const N = getNotifications();
  if (!N || foregroundListener) return;
  ensureHandler();
  foregroundListener = N.addNotificationReceivedListener(() => {});
}

export function startResponseListener(
  onNotificationResponse?: (response: unknown) => void,
) {
  const N = getNotifications();
  if (!N || responseListener) return;
  ensureHandler();
  responseListener = N.addNotificationResponseReceivedListener((response) => {
    lastNotificationResponse = response;
    onNotificationResponse?.(response);
  });
}

export function cleanupListeners() {
  foregroundListener?.remove();
  foregroundListener = undefined;
  responseListener?.remove();
  responseListener = undefined;
}
