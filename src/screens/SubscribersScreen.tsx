import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Bell, Eye, ToggleRight, ToggleLeft } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchSubscribers, toggleSubscriberActivation, Subscriber } from '../services/subscribers';
import { SendAdminNotificationModal } from '../modals/SendAdminNotificationModal';
import { extractErrorMessage } from '../lib/http';
import { font } from '../theme';

function formatDate(iso: string | undefined, locale: string, t: (k: string) => string): string {
  if (!iso) return '--';
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return '--';
    return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  } catch {
    return '--';
  }
}

export default function SubscribersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL, locale } = useLocale();
  const navigation = useNavigation<any>();
  const [reloadKey, setReloadKey] = useState(0);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [notifyTarget, setNotifyTarget] = useState<Subscriber | null>(null);

  const openDetail = (item: Subscriber) =>
    navigation.navigate('SubscriberDetail', { subscriber_id: item._id });

  const fetchData = useCallback(async () => {
    const data = await fetchSubscribers();
    return { data, total: data.length };
  }, [reloadKey]);

  const handleToggle = (item: Subscriber) => {
    Alert.alert(t('Toggle Status'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Confirm'),
        onPress: async () => {
          try {
            await toggleSubscriberActivation(item._id);
            setReloadKey((k) => k + 1);
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleNotify = (item: Subscriber) => {
    setNotifyTarget(item);
    setNotifyOpen(true);
  };

  const columns = [
    {
      key: 'name',
      titleKey: 'Subscriber',
      width: 150,
      render: (item: Subscriber) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
            {item.name || item.email || '--'}
          </Text>
          {item.email && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'organization',
      titleKey: 'Company',
      width: 150,
      render: (item: Subscriber) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
            {item.organization?.name || '--'}
          </Text>
          {item.organization?.website && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.organization.website}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'plan',
      titleKey: 'Plan',
      width: 110,
      render: (item: Subscriber) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.activePlan?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'industry',
      titleKey: 'Industry',
      width: 110,
      render: (item: Subscriber) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.organization?.industry?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'subscribed_at',
      titleKey: 'Subscribed at',
      width: 100,
      render: (item: Subscriber) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {formatDate(item.subscribed_at || item.createdAt, locale, t)}
        </Text>
      ),
    },
    {
      key: 'expires_at',
      titleKey: 'Expires at',
      width: 100,
      render: (item: Subscriber) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {formatDate(item.expires_at, locale, t)}
        </Text>
      ),
    },
    {
      key: 'total_users',
      titleKey: 'Users',
      width: 70,
      render: (item: Subscriber) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, fontWeight: font.weights.semibold, textAlign: 'center' }}>
          {item.total_users ?? 0}
        </Text>
      ),
    },
    {
      key: 'is_active',
      titleKey: 'Status',
      width: 100,
      render: (item: Subscriber) => (
        <Badge label={item.is_active ? t('Active') : t('Inactive')} variant={item.is_active ? 'success' : 'danger'} />
      ),
    },
  ];

  return (
    <>
      <ListScreen
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: Subscriber) => item._id}
        searchable
        searchPlaceholderKey="Search subscribers..."
        emptyTitleKey="No subscribers found"
        emptyMessageKey="No subscribers to display"
        onRowPress={openDetail}
        rowActions={(item: Subscriber) => [
          {
            label: t('View Details'),
            icon: <Eye size={16} color={colors.primary} />,
            onPress: () => openDetail(item),
          },
          {
            label: item.is_active ? t('Deactivate') : t('Activate'),
            icon: item.is_active ? <ToggleRight size={16} color="#F59E0B" /> : <ToggleLeft size={16} color="#10B981" />,
            onPress: () => handleToggle(item),
          },
          {
            label: t('Send Notification'),
            icon: <Bell size={16} color={colors.primary} />,
            onPress: () => handleNotify(item),
          },
        ]}
      />
      <SendAdminNotificationModal
        visible={notifyOpen}
        preSelectedUser={notifyTarget}
        sourceType="subscriber"
        onClose={() => { setNotifyOpen(false); setNotifyTarget(null); }}
        onSent={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}
