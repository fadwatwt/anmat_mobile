import { createNavigationContainerRef } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

export type NotificationPayload = {
  model_type?: string;
  model_id?: string;
  notification_id?: string;
  sender_id?: string;
  [key: string]: unknown;
};

// A tap can arrive before login / before the navigator is ready
// (or when the app was killed). Stash it and consume after auth.
let pendingPayload: NotificationPayload | null = null;

export function stashNotificationPayload(data: NotificationPayload | null | undefined) {
  if (data && (data.model_type || data.model_id)) {
    pendingPayload = data;
  }
}

export function popPendingNotificationPayload(): NotificationPayload | null {
  const p = pendingPayload;
  pendingPayload = null;
  return p;
}

function navigateToPayload(data: NotificationPayload) {
  if (!navigationRef.isReady()) {
    stashNotificationPayload(data);
    return;
  }
  const model = String(data.model_type || '').toLowerCase();
  const id = data.model_id ? String(data.model_id) : undefined;

  switch (model) {
    case 'chat':
      navigationRef.navigate('Conversations', id ? { chatId: id } : undefined);
      break;
    case 'task':
      if (id) navigationRef.navigate('TaskDetail', { task_id: id });
      else navigationRef.navigate('Notifications');
      break;
    case 'project':
      if (id) navigationRef.navigate('ProjectDetail', { project_id: id });
      else navigationRef.navigate('Notifications');
      break;
    case 'appointment':
      if (id) navigationRef.navigate('AppointmentDetail', { appointment_id: id });
      else navigationRef.navigate('Notifications');
      break;
    case 'supportticket':
    case 'support_ticket':
      if (id) navigationRef.navigate('SupportTicketDetail', { ticket_id: id });
      else navigationRef.navigate('Notifications');
      break;
    default:
      navigationRef.navigate('Notifications');
      break;
  }
}

/** Entry point for notification taps (foreground, background, killed). */
export function handleNotificationTap(data: NotificationPayload | null | undefined) {
  if (!data) return;
  navigateToPayload(data);
}

/** Flush a stashed tap once the authed UI is mounted. */
export function flushPendingNotification() {
  const p = popPendingNotificationPayload();
  if (p) navigateToPayload(p);
}
