import { http } from '../lib/http';

// Mirrors the web `notificationsApi` (/api/notifications/...).
export type AppNotification = {
  _id: string;
  id?: string;
  title?: string;
  message?: string;
  content?: string;
  title_key?: string;
  message_key?: string;
  meta?: Record<string, any>;
  priority?: 'high' | 'normal' | 'low' | string;
  status?: 'pending' | 'delivered' | 'read' | 'failed' | string;
  is_read?: boolean;
  isRead?: boolean;
  action_url?: string;
  model_type?: string;
  model_id?: string;
  delivered_at?: string;
  read_at?: string;
  created_at?: string;
  createdAt?: string;
};

export type NotificationsPage = {
  items: AppNotification[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
  meta: { unreadCount: number };
};

export function isUnread(n: AppNotification): boolean {
  // Backend may use status, is_read or isRead; treat missing as unread.
  if (n.status) return n.status !== 'read';
  if (typeof n.is_read === 'boolean') return !n.is_read;
  if (typeof n.isRead === 'boolean') return !n.isRead;
  return true;
}

export async function fetchNotifications(
  recipientId: string,
  recipientType: string,
): Promise<AppNotification[]> {
  const page = await fetchNotificationsPage(recipientId, recipientType, 1, 50);
  return page.items;
}

export async function fetchNotificationsPage(
  recipientId: string,
  recipientType: string,
  page = 1,
  limit = 20,
): Promise<NotificationsPage> {
  const response = await http.get<any>(
    `/api/notifications/${recipientId}/${recipientType}?page=${page}&limit=${limit}`,
  );
  const body = response.data ?? {};
  const items = Array.isArray(body.data) ? body.data : Array.isArray(body) ? body : [];
  return {
    items,
    pagination:
      body?.pagination || { total: items.length, page, limit, totalPages: items.length > 0 ? 1 : 0 },
    meta: body?.meta || { unreadCount: 0 },
  };
}

export async function markNotificationAsRead(id: string): Promise<void> {
  // Background read-receipt: don't show the global processing overlay.
  await http.patch(`/api/notifications/mark-as-read/${id}`, undefined, { silent: true } as any);
}

export async function markAllNotificationsAsRead(): Promise<void> {
  await http.patch('/api/notifications/mark-all-as-read', undefined, { silent: true } as any);
}
