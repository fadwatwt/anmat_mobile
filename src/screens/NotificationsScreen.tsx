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
import {
  Bell,
  Check,
  CheckCheck,
  ListTodo,
  FolderKanban,
  CalendarOff,
  CalendarCheck,
  Coins,
  Users,
  FileText,
  User,
  Building2,
  RefreshCcw,
  Settings,
  Mail,
  Calendar,
  Ticket,
  CornerUpRight,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { Modal } from '../components/Modal';
import {
  fetchNotificationsPage,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  isUnread,
  AppNotification,
} from '../services/notifications';
import { font, radii, spacing } from '../theme';

const PRIORITY_BAR: Record<string, string> = {
  high: '#EF4444',
  normal: '#F59E0B',
  low: '#3B82F6',
};

const STATUS_COLOR: Record<string, string> = {
  pending: '#6B7280',
  delivered: '#D97706',
  read: '#22C55E',
  failed: '#EF4444',
};

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  delivered: 'Delivered',
  read: 'Read',
  failed: 'Failed',
};

const PRIORITY_LABEL: Record<string, string> = {
  high: 'High Priority',
  normal: 'Normal Priority',
  low: 'Low Priority',
};

const MODEL_CONFIG: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  Task: { icon: ListTodo, color: '#8B5CF6', bg: '#EDE9FE' },
  Project: { icon: FolderKanban, color: '#6366F1', bg: '#E0E7FF' },
  Leave: { icon: CalendarOff, color: '#F59E0B', bg: '#FEF3C7' },
  Attendance: { icon: CalendarCheck, color: '#10B981', bg: '#D1FAE5' },
  SalaryTransaction: { icon: Coins, color: '#22C55E', bg: '#DCFCE7' },
  Employee: { icon: Users, color: '#3B82F6', bg: '#DBEAFE' },
  EmployeeRequest: { icon: FileText, color: '#06B6D4', bg: '#CFFAFE' },
  EmployeeDetail: { icon: User, color: '#3B82F6', bg: '#DBEAFE' },
  Department: { icon: Building2, color: '#14B8A6', bg: '#CCFBF1' },
  Subscription: { icon: RefreshCcw, color: '#EC4899', bg: '#FCE7F3' },
  SubscriptionPlan: { icon: Settings, color: '#EC4899', bg: '#FCE7F3' },
  User: { icon: User, color: '#6B7280', bg: '#F3F4F6' },
  EmailVerification: { icon: Mail, color: '#EF4444', bg: '#FEE2E2' },
  Organization: { icon: Building2, color: '#0EA5E9', bg: '#E0F2FE' },
  Appointment: { icon: Calendar, color: '#F97316', bg: '#FFEDD5' },
  support_tickets: { icon: Ticket, color: '#F43F5E', bg: '#FFE4E6' },
  EscalationRequest: { icon: CornerUpRight, color: '#EF4444', bg: '#FEE2E2' },
  Custom: { icon: Bell, color: '#3B82F6', bg: '#DBEAFE' },
  default: { icon: Bell, color: '#6B7280', bg: '#F3F4F6' },
};

const FILTER_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

const MESSAGE_PATTERNS: { regex: RegExp; ar: (m: RegExpMatchArray) => string }[] = [
  { regex: /^(.+?) has logged in to the system\.?$/, ar: (m) => `${m[1]} قام بتسجيل الدخول إلى النظام.` },
  { regex: /^(.+?) has logged out of the system\.?$/, ar: (m) => `${m[1]} قام بتسجيل الخروج من النظام.` },
  { regex: /^(.+?) requested a short leave on (.+?) from (.+?) to (.+?)$/, ar: (m) => `${m[1]} طلب إجازة قصيرة في ${m[2]} من ${m[3]} إلى ${m[4]}` },
  { regex: /^(.+?) updated their leave request for (.+?) from (.+?) to (.+?)$/, ar: (m) => `${m[1]} قام بتعديل طلب إجازته ليوم ${m[2]} من ${m[3]} إلى ${m[4]}` },
  { regex: /^(.+?) cancelled their leave request for (.+?)$/, ar: (m) => `${m[1]} قام بإلغاء طلب إجازته ليوم ${m[2]}` },
  { regex: /^(.+?) has checked in at (.+?)$/, ar: (m) => `${m[1]} قام بتسجيل الحضور في ${m[2]}` },
  { regex: /^(.+?) checked in (\d+) minutes late at (.+?)$/, ar: (m) => `${m[1]} قام بتسجيل الحضور متأخراً ${m[2]} دقيقة في ${m[3]}` },
  { regex: /^(.+?) has checked out at (.+?) \((.+?)h worked\)$/, ar: (m) => `${m[1]} قام بتسجيل الانصراف في ${m[2]} (${m[3]} ساعة عمل)` },
  { regex: /^(.+?) has submitted a new (.+?) request\.?$/, ar: (m) => `${m[1]} قدم طلب ${m[2]} جديد.` },
  { regex: /^(.+?) tokens added to your account$/, ar: (m) => `تمت إضافة ${m[1]} رمز إلى حسابك` },
  { regex: /^You have been assigned a new task: "(.+?)"\.?$/, ar: (m) => `تم تعيين مهمة جديدة لك: "${m[1]}".` },
  { regex: /^A new task "(.+?)" has been added to project "(.+?)"\.?$/, ar: (m) => `تمت إضافة مهمة جديدة "${m[1]}" إلى مشروع "${m[2]}".` },
  { regex: /^You have been unassigned from task: "(.+?)"\.?$/, ar: (m) => `تم إلغاء تعيينك من المهمة: "${m[1]}".` },
  { regex: /^An employee has updated task: "(.+?)"\.?$/, ar: (m) => `قام موظف بتحديث المهمة: "${m[1]}".` },
  { regex: /^Your task "(.+?)" has been updated\.?$/, ar: (m) => `تم تحديث مهمتك "${m[1]}".` },
  { regex: /^Your task "(.+?)" has been evaluated with a score of (.+?)\/5\.?$/, ar: (m) => `تم تقييم مهمتك "${m[1]}" بدرجة ${m[2]}/5.` },
  { regex: /^You have been assigned as manager for new project: "(.+?)"\.?$/, ar: (m) => `تم تعيينك كمدير لمشروع جديد: "${m[1]}".` },
  { regex: /^You have been assigned to new project: "(.+?)"\.?$/, ar: (m) => `تم تعيينك في مشروع جديد: "${m[1]}".` },
  { regex: /^You are no longer the manager for project: "(.+?)"\.?$/, ar: (m) => `لم تعد مديراً لمشروع: "${m[1]}".` },
  { regex: /^You have been assigned as manager for project: "(.+?)"\.?$/, ar: (m) => `تم تعيينك كمدير لمشروع: "${m[1]}".` },
  { regex: /^You have been unassigned from project: "(.+?)"\.?$/, ar: (m) => `تم إلغاء تعيينك من مشروع: "${m[1]}".` },
  { regex: /^You have been assigned to project: "(.+?)"\.?$/, ar: (m) => `تم تعيينك في مشروع: "${m[1]}".` },
  { regex: /^Your project "(.+?)" has been updated\.?$/, ar: (m) => `تم تحديث مشروعك "${m[1]}".` },
  { regex: /^"(.+?)": leaved from (.+?) to (.+?) in (.+?)$/, ar: (m) => `${m[1]}: مغادرة من ${m[2]} إلى ${m[3]} في ${m[4]}` },
  { regex: /^Your leave for (.+?) has been deleted by the administrator\.?$/, ar: (m) => `تم حذف إجازتك ليوم ${m[1]} من قِبَل المسؤول.` },
  { regex: /^An attendance record for (.+?) \((.+?) - (.+?)\) has been created by the administrator\.?$/, ar: (m) => `تم إنشاء سجل حضور ليوم ${m[1]} (${m[2]} - ${m[3]}) من قِبَل المسؤول.` },
  { regex: /^Your attendance record for (.+?) has been deleted by the administrator\.?$/, ar: (m) => `تم حذف سجل حضورك ليوم ${m[1]} من قِبَل المسؤول.` },
  { regex: /^Your (.+?) request status has been updated to "(.+?)"\.\s*Reason:\s*(.+?)$/, ar: (m) => `تم تحديث حالة طلبك ${m[1]} إلى "${m[2]}". السبب: ${m[3]}` },
  { regex: /^Your (.+?) request status has been updated to "(.+?)"\.?\s*$/, ar: (m) => `تم تحديث حالة طلبك ${m[1]} إلى "${m[2]}".` },
  { regex: /^Your (.+?) request has been deleted by the administrator\.?$/, ar: (m) => `تم حذف طلبك ${m[1]} من قِبَل المسؤول.` },
  { regex: /^Your department "(.+?)" information has been updated\.?$/, ar: (m) => `تم تحديث معلومات قسمك "${m[1]}".` },
  { regex: /^You have been assigned to the department "(.+?)"\.?$/, ar: (m) => `تم تعيينك في قسم "${m[1]}".` },
  { regex: /^You have been removed from the department "(.+?)"\.?$/, ar: (m) => `تم إزالتك من قسم "${m[1]}".` },
  { regex: /^Your profile information has been updated by the administrator\.?$/, ar: () => `تم تحديث معلومات ملفك الشخصي من قِبَل المسؤول.` },
  { regex: /^A salary transaction for (.+?) has been deleted from your account\.?$/, ar: (m) => `تم حذف معاملة راتب بقيمة ${m[1]} من حسابك.` },
  { regex: /^A salary transaction for (.+?) has been updated\.?$/, ar: (m) => `تم تحديث معاملة راتب بقيمة ${m[1]}.` },
  { regex: /^A new salary transaction of (.+?) has been added to your account\.?$/, ar: (m) => `تمت إضافة معاملة راتب جديدة بقيمة ${m[1]} إلى حسابك.` },
];

function translateMessage(text: string, lang: string): string {
  if (!text || lang !== 'ar') return text;
  for (const pattern of MESSAGE_PATTERNS) {
    const match = text.match(pattern.regex);
    if (match) return pattern.ar(match);
  }
  return text;
}

function timeAgo(dateStr?: string, locale?: string, t?: (k: string) => string): string {
  if (!dateStr) return '';
  const created = new Date(dateStr).getTime();
  if (isNaN(created)) return '';
  const diffMin = Math.floor((Date.now() - created) / 60000);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);
  if (diffMin < 1) return t ? t('Just now') : 'Just now';
  if (diffMin < 60) return `${diffMin} ${t ? t('min ago') : 'min ago'}`;
  if (diffHr < 24) return `${diffHr} ${t ? t('h ago') : 'h ago'}`;
  if (diffDay < 7) return `${diffDay} ${t ? t('d ago') : 'd ago'}`;
  return new Date(dateStr).toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDate(dateStr?: string, locale?: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function NotificationDetailsModal({
  notification,
  onClose,
  onMarkAsRead,
}: {
  notification: AppNotification | null;
  onClose: () => void;
  onMarkAsRead: (id: string) => void;
}) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  if (!notification) return null;

  const isUnreadN = isUnread(notification);
  const priority = PRIORITY_LABEL[notification.priority || ''] || 'Normal Priority';
  const status = STATUS_LABEL[notification.status || ''] || 'Pending';
  const modelType = notification.model_type || '';
  const ModelIcon = MODEL_CONFIG[modelType]?.icon || MODEL_CONFIG.default.icon;
  const modelColor = MODEL_CONFIG[modelType]?.color || MODEL_CONFIG.default.color;
  const modelBg = MODEL_CONFIG[modelType]?.bg || MODEL_CONFIG.default.bg;

  const title = notification.title_key
    ? String(t(notification.title_key, notification.meta as any))
    : notification.title || '';

  const content = translateMessage(
    notification.message_key
      ? String(t(notification.message_key, notification.meta as any))
      : notification.content || notification.message || '',
    i18n.language,
  );

  const row = (label: string, value: string) => (
    <View style={[styles.detailRow, { backgroundColor: colors.background, borderColor: colors.border }]}>
      <Text style={[styles.detailLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.detailValue, { color: colors.ink }]}>{value}</Text>
    </View>
  );

  return (
    <Modal visible={!!notification} onClose={onClose} title={t('Notification Details')} size="md">
      <View style={styles.detailWrap}>
        <View style={[styles.detailHeader, { backgroundColor: isUnreadN ? '#EEF2FF' : colors.background, borderColor: isUnreadN ? '#C7D2FE' : colors.border }]}>
          <View style={[styles.detailIcon, { backgroundColor: modelBg }]}>
            <ModelIcon size={20} color={modelColor} />
          </View>
          <View style={styles.detailHeaderText}>
            <Text style={[styles.detailTitle, { color: colors.ink }]}>{title || t('Notification')}</Text>
            <Text style={[styles.detailContent, { color: colors.textMuted }]}>{content}</Text>
          </View>
        </View>

        <View style={styles.detailGrid}>
          {row(t('Priority'), t(priority))}
          {row(t('Status'), t(status))}
          {row(t('Created At'), formatDate(notification.created_at || notification.createdAt, i18n.language))}
          {notification.delivered_at ? row(t('Delivered At'), formatDate(notification.delivered_at, i18n.language)) : null}
          {notification.read_at ? row(t('Read At'), formatDate(notification.read_at, i18n.language)) : null}
          {modelType ? row(t('Related To'), modelType) : null}
        </View>

        {isUnreadN && (
          <TouchableOpacity
            onPress={() => {
              onMarkAsRead(notification.id || notification._id);
              onClose();
            }}
            style={[styles.detailMarkBtn, { borderColor: '#C7D2FE' }]}
          >
            <Check size={16} color="#3B82F6" />
            <Text style={[styles.detailMarkText, { color: '#3B82F6' }]}>{t('Mark as read')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </Modal>
  );
}

export function NotificationsScreen() {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { locale, isRTL } = useLocale();
  const { user } = useAuth();
  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<AppNotification | null>(null);

  const load = useCallback(
    async (isRefresh = false) => {
      if (!user?._id || !user?.type) {
        setLoading(false);
        return;
      }
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      try {
        const result = await fetchNotificationsPage(user._id, user.type, 1, 20);
        setItems(result.items.filter((n) => n.model_type !== 'Chat'));
        setPage(result.pagination.page || 1);
        setTotalPages(result.pagination.totalPages || 1);
      } catch {
        setItems([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [user?._id, user?.type],
  );

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!user?._id || !user?.type || loadingMore || page >= totalPages) return;
    setLoadingMore(true);
    try {
      const result = await fetchNotificationsPage(user._id, user.type, page + 1, 20);
      setItems((prev) => [...prev, ...result.items.filter((n) => n.model_type !== 'Chat')]);
      setPage(result.pagination.page || page + 1);
      setTotalPages(result.pagination.totalPages || 1);
    } catch {
      // ignore load-more errors
    } finally {
      setLoadingMore(false);
    }
  };

  const unreadCount = useMemo(() => items.filter(isUnread).length, [items]);

  const filtered = useMemo(() => {
    if (activeFilter === 'unread') return items.filter(isUnread);
    if (activeFilter === 'read') return items.filter((n) => !isUnread(n));
    return items;
  }, [items, activeFilter]);

  const handleMarkRead = async (id: string) => {
    setItems((prev) => prev.map((n) => (n._id === id || n.id === id ? { ...n, status: 'read', is_read: true, isRead: true } : n)));
    try {
      await markNotificationAsRead(id);
    } catch {
      load();
    }
  };

  const handleMarkAll = async () => {
    setItems((prev) => prev.map((n) => ({ ...n, status: 'read', is_read: true, isRead: true })));
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

      {/* Filters */}
      <View style={[styles.filters, { backgroundColor: colors.background, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {FILTER_OPTIONS.map((f) => {
          const isActive = activeFilter === f.value;
          return (
            <TouchableOpacity
              key={f.value}
              onPress={() => setActiveFilter(f.value)}
              style={[styles.filterBtn, isActive && { backgroundColor: colors.surface }]}
            >
              <Text style={[styles.filterText, { color: isActive ? colors.primary : colors.textMuted }, isActive && { fontWeight: font.weights.semibold }]}>
                {t(f.label)}
              </Text>
              {f.value === 'unread' && unreadCount > 0 && (
                <View style={styles.filterBadge}>
                  <Text style={styles.filterBadgeText}>{unreadCount > 99 ? '99+' : unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <EmptyState
            title={t('No notifications')}
            message={t("You're all caught up! Notifications will appear here when you receive them.")}
            icon="🔔"
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            title={t('No notifications')}
            message={t("You're all caught up! Notifications will appear here when you receive them.")}
            icon="🔔"
          />
        ) : (
          <>
            {filtered.map((n) => {
              const unread = isUnread(n);
              const modelType = n.model_type || '';
              const ModelIcon = MODEL_CONFIG[modelType]?.icon || MODEL_CONFIG.default.icon;
              const modelColor = MODEL_CONFIG[modelType]?.color || MODEL_CONFIG.default.color;
              const modelBg = MODEL_CONFIG[modelType]?.bg || MODEL_CONFIG.default.bg;
              const title = n.title_key ? String(t(n.title_key, n.meta as any)) : n.title || '';
              const content = translateMessage(
                n.message_key ? String(t(n.message_key, n.meta as any)) : n.content || n.message || '',
                i18n.language,
              );
              const status = n.status || 'pending';
              return (
                <TouchableOpacity
                  key={n._id || n.id}
                  onPress={() => setSelected(n)}
                  style={[
                    styles.card,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    unread && { borderColor: '#93C5FD' },
                  ]}
                >
                  <View style={[styles.priorityBar, { backgroundColor: PRIORITY_BAR[n.priority || 'normal'] || '#F59E0B' }]} />
                  <View style={styles.cardInner}>
                    <View style={[styles.modelIcon, { backgroundColor: modelBg }]}>
                      <ModelIcon size={20} color={modelColor} />
                    </View>
                    <View style={styles.cardBody}>
                      <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.title, unread && styles.titleUnread, { color: unread ? colors.ink : colors.textMuted, textAlign: align }]} numberOfLines={1}>
                          {title || t('Notification')}
                        </Text>
                        <Text style={[styles.time, { color: colors.textMuted }]}>{timeAgo(n.created_at || n.createdAt, locale, t)}</Text>
                      </View>
                      <Text style={[styles.message, { color: colors.textMuted, textAlign: align }]} numberOfLines={2}>
                        {content}
                      </Text>
                      <View style={[styles.cardFooter, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        {modelType && modelType !== 'Custom' ? (
                          <View style={[styles.modelChip, { backgroundColor: modelBg }]}>
                            <ModelIcon size={10} color={modelColor} />
                            <Text style={[styles.modelChipText, { color: modelColor }]}>{t(modelType)}</Text>
                          </View>
                        ) : null}
                        <View style={[styles.statusChip, { backgroundColor: STATUS_COLOR[status] || '#6B7280' }]}>
                          <Text style={styles.statusChipText}>{t(STATUS_LABEL[status] || 'Pending')}</Text>
                        </View>
                        {unread && (
                          <TouchableOpacity
                            onPress={() => handleMarkRead(n._id || n.id || '')}
                            style={[styles.markOne, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                            hitSlop={6}
                          >
                            <Check size={13} color={colors.primary} />
                            <Text style={[styles.markOneText, { color: colors.primary }]}>{t('Mark as read')}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}

            {page < totalPages && (
              <TouchableOpacity
                onPress={loadMore}
                disabled={loadingMore}
                style={[styles.loadMore, { borderColor: colors.border }]}
              >
                {loadingMore ? (
                  <ActivityIndicator color={colors.primary} size="small" />
                ) : (
                  <Text style={[styles.loadMoreText, { color: colors.primary }]}>{t('Load More')}</Text>
                )}
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <NotificationDetailsModal
        notification={selected}
        onClose={() => setSelected(null)}
        onMarkAsRead={handleMarkRead}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { alignItems: 'center', borderBottomWidth: 1, justifyContent: 'space-between', paddingBottom: spacing.sm, paddingHorizontal: spacing.xs },
  barTitle: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  card: { borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, overflow: 'hidden' },
  cardBody: { flex: 1, gap: spacing.xs, padding: spacing.md },
  cardFooter: { alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap', marginTop: 2 },
  cardHead: { alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  cardInner: { flex: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md, paddingBottom: spacing.sm },
  container: { flex: 1, paddingTop: spacing.sm },
  content: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.md },
  filterBadge: { backgroundColor: '#EF4444', borderRadius: 999, minWidth: 18, paddingHorizontal: 5, paddingVertical: 1, alignItems: 'center', marginLeft: 4 },
  filterBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
  filterBtn: { alignItems: 'center', borderRadius: radii.lg, flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: 7 },
  filterText: { fontSize: font.sizes.xs },
  filters: { borderBottomWidth: 1, gap: 4, paddingHorizontal: spacing.sm, paddingTop: spacing.sm },
  loadMore: { alignItems: 'center', borderWidth: 1, borderRadius: radii.lg, paddingVertical: 10 },
  loadMoreText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  markAll: { alignItems: 'center', gap: spacing.xs },
  markAllText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  markOne: { alignItems: 'center', gap: 4, marginLeft: 'auto' },
  markOneText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  message: { fontSize: font.sizes.sm },
  modelChip: { alignItems: 'center', borderRadius: 6, flexDirection: 'row', gap: 4, paddingHorizontal: 6, paddingVertical: 2 },
  modelChipText: { fontSize: 10, fontWeight: '600' },
  modelIcon: { alignItems: 'center', borderRadius: radii.lg, height: 40, justifyContent: 'center', width: 40 },
  priorityBar: { width: 4 },
  statusChip: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  statusChipText: { color: '#FFF', fontSize: 10, fontWeight: '600' },
  time: { fontSize: font.sizes.xs },
  title: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  titleUnread: { fontWeight: font.weights.bold },
  detailWrap: { gap: spacing.md },
  detailHeader: { alignItems: 'flex-start', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  detailIcon: { alignItems: 'center', borderRadius: radii.lg, height: 40, justifyContent: 'center', width: 40 },
  detailHeaderText: { flex: 1, gap: 4 },
  detailTitle: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  detailContent: { fontSize: font.sizes.sm, lineHeight: 20 },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  detailRow: { borderRadius: radii.lg, borderWidth: 1, flexDirection: 'column', gap: 4, minWidth: 140, padding: spacing.sm },
  detailLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  detailValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  detailMarkBtn: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', paddingVertical: 10 },
  detailMarkText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
