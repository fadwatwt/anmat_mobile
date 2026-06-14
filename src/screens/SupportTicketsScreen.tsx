import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { CreateTicketModal } from '../modals/CreateTicketModal';
import { fetchSupportTickets, SupportTicket } from '../services/supportTickets';
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

export default function SupportTicketsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await fetchSupportTickets();
    return { data, total: data.length };
  }, [reloadKey]);

  const columns = [
    {
      key: 'title',
      titleKey: 'Ticket',
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
    {
      key: 'created_by',
      titleKey: 'Created By',
      width: 130,
      render: (item: SupportTicket) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.created_by?.name || '--'}
        </Text>
      ),
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
      key: 'createdAt',
      titleKey: 'Date',
      width: 110,
      render: (item: SupportTicket) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {item.createdAt || '--'}
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

        onCreate={() => setModalOpen(true)}
        emptyTitleKey="No tickets found"
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
