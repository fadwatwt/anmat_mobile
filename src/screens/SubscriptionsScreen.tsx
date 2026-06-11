import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchAdminSubscriptions } from '../services/dashboard';
import { SubscriptionBasic } from '../types';
import { font } from '../theme';

const fetchData = async (_params: any) => {
  const res = await fetchAdminSubscriptions(1, 50);
  return { data: res.data, total: res.total };
};

export default function SubscriptionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const columns = [
    {
      key: 'subscriber',
      titleKey: 'Subscriber',
      width: 150,
      render: (item: SubscriptionBasic) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.subscriber?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'organization',
      titleKey: 'Organization',
      width: 150,
      render: (item: SubscriptionBasic) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.organization?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 100,
      render: (item: SubscriptionBasic) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }}>
          {item.status || '--'}
        </Text>
      ),
    },
    {
      key: 'starts_at',
      titleKey: 'Start Date',
      width: 110,
      render: (item: SubscriptionBasic) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {item.starts_at || '--'}
        </Text>
      ),
    },
    {
      key: 'expires_at',
      titleKey: 'Expiry Date',
      width: 110,
      render: (item: SubscriptionBasic) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {item.expires_at || '--'}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: SubscriptionBasic) => item._id}
      searchable
      searchPlaceholderKey="Search subscriptions..."
      emptyTitleKey="No subscriptions found"
      emptyMessageKey="No subscriptions to display"
    />
  );
}
