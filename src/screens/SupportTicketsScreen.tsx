import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { ListScreen } from '../generators/ListScreen';
import { CreateTicketModal } from '../modals/CreateTicketModal';
import {
  fetchSupportTickets,
  deleteSupportTicket,
  SupportTicket,
} from '../services/supportTickets';
import { extractErrorMessage } from '../lib/http';
import { font } from '../theme';

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  open: 'default',
  pending: 'warning',
  resolved: 'success',
  closed: 'info',
  rejected: 'danger',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  pending: 'Pending',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
};

const priorityVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  urgent: 'danger',
  high: 'warning',
  medium: 'default',
  low: 'success',
};

export default function SupportTicketsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user, permissions } = useAuth();
  const navigation = useNavigation<any>();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const isAdmin = user?.type === 'Admin';
  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canCreate = !isAdmin && has('support_tickets.create');
  const canDelete = has(isAdmin ? 'admin.support_tickets.delete' : 'support_tickets.delete');

  const fetchData = useCallback(async () => {
    const data = await fetchSupportTickets();
    const sorted = [...data].sort((a, b) => {
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      if (dateB.getTime() !== dateA.getTime()) return dateB.getTime() - dateA.getTime();
      return (b._id || '').localeCompare(a._id || '');
    });
    return { data: sorted, total: sorted.length };
  }, [reloadKey]);

  const handleDelete = (ticket: SupportTicket) => {
    Alert.alert(
      t('Delete Ticket'),
      t(`Are you sure you want to delete "${ticket.title}"? This action cannot be undone.`),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Yes, Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSupportTicket(ticket._id);
              setReloadKey((k) => k + 1);
            } catch (e) {
              Alert.alert(t('Error'), extractErrorMessage(e));
            }
          },
        },
      ],
    );
  };

  const formatDate = (value?: string) => {
    if (!value) return '--';
    const d = new Date(value);
    if (isNaN(d.getTime())) return value.slice(0, 10);
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US');
  };

  const { locale } = useLocale();

  const columns = [
    {
      key: 'title',
      titleKey: 'Title',
      width: 200,
      render: (item: SupportTicket) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
            {item.title || '--'}
          </Text>
          {item.description && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      ),
    },
    ...(isAdmin
      ? [{
          key: 'subscriber',
          titleKey: 'Subscriber',
          width: 130,
          render: (item: SupportTicket) => (
            <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.subscriber?.name || item.created_by?.name || '--'}
            </Text>
          ),
        }]
      : []),
    {
      key: 'priority',
      titleKey: 'Priority',
      width: 100,
      render: (item: SupportTicket) => {
        const p = (item.priority || '').toLowerCase();
        return <Badge label={t(p || 'low')} variant={priorityVariant[p] || 'default'} />;
      },
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 100,
      render: (item: SupportTicket) => {
        const s = (item.status || '').toLowerCase();
        return <Badge label={t(statusLabels[s] || item.status || '--')} variant={statusVariant[s] || 'default'} />;
      },
    },
    {
      key: 'created_at',
      titleKey: 'Created At',
      width: 110,
      render: (item: SupportTicket) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {formatDate(item.created_at || item.createdAt)}
        </Text>
      ),
    },
  ];

  return (
    <>
      <ListScreen
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: SupportTicket) => item._id}
        searchable
        searchPlaceholderKey="Search tickets..."
        onRowPress={(item: SupportTicket) => navigation.navigate('SupportTicketDetail', { id: item._id })}
        rowActions={(item: SupportTicket) => {
          const actions: { label: string; onPress: () => void; destructive?: boolean }[] = [
            {
              label: t('View'),
              onPress: () => navigation.navigate('SupportTicketDetail', { id: item._id }),
            },
          ];
          if (canDelete) {
            actions.push({
              label: t('Delete'),
              onPress: () => handleDelete(item),
              destructive: true,
            });
          }
          return actions;
        }}
        onCreate={canCreate ? () => setModalOpen(true) : undefined}
        emptyTitleKey="No support tickets found"
        emptyMessageKey="No support tickets to display"
      />
      <CreateTicketModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); setReloadKey((k) => k + 1); }}
      />
    </>
  );
}
