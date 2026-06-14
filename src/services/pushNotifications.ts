import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { http } from '../lib/http';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

let lastNotificationResponse: Notifications.NotificationResponse | undefined;
let responseListener: ReturnType<typeof Notifications.addNotificationResponseReceivedListener> | undefined;
let foregroundListener: ReturnType<typeof Notifications.addNotificationReceivedListener> | undefined;

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
    // Will retry on next login
  }
}

async function unregisterTokenWithBackend(token: string) {
  try {
    await http.delete('/api/notifications/push-token/remove', { data: { token } });
  } catch {
    // Best effort
  }
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) {
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
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'General',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#3F6FE3',
      sound: 'default',
    });
  }
}

export async function initPushNotifications() {
  await setupAndroidChannel();

  const token = await getExpoPushToken();
  if (token) {
    await registerTokenWithBackend(token);
  }
  return token;
}

export async function logoutPushNotifications() {
  const token = await getExpoPushToken();
  if (token) {
    await unregisterTokenWithBackend(token);
  }
}

export function startForegroundListener() {
  if (foregroundListener) return;
  foregroundListener = Notifications.addNotificationReceivedListener((notification) => {
    // notification is shown by the handler above — no special action needed
  });
}

export function startResponseListener(
  onNotificationResponse?: (response: Notifications.NotificationResponse) => void,
) {
  if (responseListener) return;
  responseListener = Notifications.addNotificationResponseReceivedListener((response) => {
    lastNotificationResponse = response;
    onNotificationResponse?.(response);
  });
}

export function cleanupListeners() {
  if (foregroundListener) {
    Notifications.removeNotificationSubscription(foregroundListener);
    foregroundListener = undefined;
  }
  if (responseListener) {
    Notifications.removeNotificationSubscription(responseListener);
    responseListener = undefined;
  }
}
