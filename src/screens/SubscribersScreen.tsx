import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { ToggleRight, ToggleLeft, Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchSubscribers, toggleSubscriberActivation, Subscriber } from '../services/subscribers';
import { extractErrorMessage } from '../lib/http';
import { font } from '../theme';

export default function SubscribersScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();
  const [reloadKey, setReloadKey] = useState(0);

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
      titleKey: 'Organization',
      width: 150,
      render: (item: Subscriber) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.organization?.name || '--'}
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
    {
      key: 'createdAt',
      titleKey: 'Joined',
      width: 110,
      render: (item: Subscriber) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {item.createdAt || '--'}
        </Text>
      ),
    },
  ];

  return (
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
      ]}
    />
  );
}
