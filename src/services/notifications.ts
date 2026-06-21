import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Mirrors the web `notificationsApi` (/api/notifications/...).
export type AppNotification = {
  _id: string;
  title?: string;
  message?: string;
  priority?: 'high' | 'normal' | 'low' | string;
  is_read?: boolean;
  isRead?: boolean;
  action_url?: string;
  model_type?: string;
  model_id?: string;
  created_at?: string;
  createdAt?: string;
};

export function isUnread(n: AppNotification): boolean {
  // Backend may use is_read or isRead; treat missing as unread.
  if (typeof n.is_read === 'boolean') return !n.is_read;
  if (typeof n.isRead === 'boolean') return !n.isRead;
  return true;
}

export async function fetchNotifications(
  recipientId: string,
  recipientType: string,
): Promise<AppNotification[]> {
  const response = await http.get<ApiResponse<AppNotification[]> | AppNotification[]>(
    `/api/notifications/${recipientId}/${recipientType}`,
  );
  const data = (response.data as ApiResponse<AppNotification[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function markNotificationAsRead(id: string): Promise<void> {
  // Background read-receipt: don't show the global processing overlay.
  await http.patch(`/api/notifications/mark-as-read/${id}`, undefined, { silent: true } as any);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await http.patch('/api/notifications/mark-all-as-read', undefined, { silent: true } as any);
}
