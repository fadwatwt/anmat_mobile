import { Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import * as Device from 'expo-device';
import { http } from '../lib/http';

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

let Notifications: typeof import('expo-notifications') | null = null;
if (!isExpoGo) {
  Notifications = require('expo-notifications');
}

if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

let lastNotificationResponse: any;
let responseListener: any;
let foregroundListener: any;

export function getLastNotificationResponse() {
  return lastNotificationResponse;
}

export function clearLastNotificationResponse() {
  lastNotificationResponse = undefined;
}

function getApiBase(): string {
  return http.defaults.baseURL || '';
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
  if (!Notifications || !Device.isDevice) {
    return null;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    return null;
  }

  const tokenData = await Notifications.getExpoPushTokenAsync();
  return tokenData.data;
}

export async function setupAndroidChannel() {
  if (!Notifications || Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH as any,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#3F6FE3',
    sound: 'default',
  });
}

export async function initPushNotifications() {
  if (!Notifications) return null;

  await setupAndroidChannel();

  const token = await getExpoPushToken();
  if (token) {
    await registerTokenWithBackend(token);
  }
  return token;
}

export async function logoutPushNotifications() {
  if (!Notifications) return;
  const token = await getExpoPushToken();
  if (token) {
    await unregisterTokenWithBackend(token);
  }
}

export function startForegroundListener() {
  if (!Notifications || foregroundListener) return;
  foregroundListener = Notifications.addNotificationReceivedListener(() => {
  });
}

export function startResponseListener(
  onNotificationResponse?: (response: any) => void,
) {
  if (!Notifications || responseListener) return;
  responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
    lastNotificationResponse = response;
    onNotificationResponse?.(response);
  });
}

export function cleanupListeners() {
  if (foregroundListener) {
    foregroundListener.remove();
    foregroundListener = undefined;
  }
  if (responseListener) {
    responseListener.remove();
    responseListener = undefined;
  }
}
