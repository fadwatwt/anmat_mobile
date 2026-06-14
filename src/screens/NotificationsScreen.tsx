import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Check, CheckCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  isUnread,
  AppNotification,
} from '../services/notifications';
import { font, radii, spacing } from '../theme';

function priorityColor(p?: string): string {
  switch (p) {
    case 'high': return '#EF4444';
    case 'normal': return '#F59E0B';
    default: return '#3B82F6';
  }
}

export function NotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (!user?._id || !user?.type) { setLoading(false); return; }
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setItems(await fetchNotifications(user._id, user.type));
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?._id, user?.type]);

  useEffect(() => { load(); }, [load]);

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items]);

  const handleMarkRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, is_read: true, isRead: true } : n)));
    try {
      await markNotificationAsRead(id);
    } catch {
      load();
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, is_read: true, isRead: true })));
    try {
      await markAllNotificationsAsRead();
    } catch {
      load();
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  return (
    <View style={styles.container}>
      {/* Header bar */}
      <View style={[styles.bar, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Text style={[styles.barTitle, { color: colors.ink }]}>
          {t('Notifications')}{unreadCount > 0 ? ` (${unreadCount})` : ''}
        </Text>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={handleMarkAll} style={[styles.markAll, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <CheckCheck size={14} color={colors.primary} />
            <Text style={[styles.markAllText, { color: colors.primary }]}>{t('Mark all as read')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <EmptyState title={t('No new notifications')} message={t('No items to display')} icon="🔔" />
        ) : (
          items.map((n) => {
            const unread = isUnread(n);
            return (
              <View
                key={n._id}
                style={[
                  styles.card,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                  unread && { borderColor: colors.primary },
                  { flexDirection: isRTL ? 'row-reverse' : 'row' },
                ]}
              >
                <View style={[styles.priorityBar, { backgroundColor: priorityColor(n.priority) }]} />
                <View style={styles.cardBody}>
                  <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.title, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                      {n.title ? t(n.title) : t('Notification')}
                    </Text>
                    <Text style={[styles.time, { color: colors.textMuted }]}>{n.created_at || n.createdAt || ''}</Text>
                  </View>
                  {!!n.message && (
                    <Text style={[styles.message, { color: colors.textMuted, textAlign: align }]} numberOfLines={3}>
                      {t(n.message)}
                    </Text>
                  )}
                  {unread && (
                    <TouchableOpacity onPress={() => handleMarkRead(n._id)} style={[styles.markOne, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Check size={13} color={colors.primary} />
                      <Text style={[styles.markOneText, { color: colors.primary }]}>{t('Mark as read')}</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', borderBottomWidth: 1, justifyContent: 'space-between', paddingBottom: spacing.sm, paddingHorizontal: spacing.xs },
  barTitle: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, overflow: 'hidden' },
  cardBody: { flex: 1, gap: spacing.xs, padding: spacing.md },
  cardHead: { alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  container: { flex: 1, paddingTop: spacing.sm },
  content: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  markAll: { alignItems: 'center', gap: spacing.xs },
  markAllText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  markOne: { alignItems: 'center', alignSelf: 'flex-start', gap: 4, marginTop: spacing.xs },
  markOneText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  message: { fontSize: font.sizes.sm },
  priorityBar: { width: 4 },
  time: { fontSize: font.sizes.xs },
  title: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
