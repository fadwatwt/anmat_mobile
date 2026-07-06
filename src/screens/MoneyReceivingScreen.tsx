import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wallet, Banknote, Landmark, Smartphone } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchMoneyReceivingMethods, MoneyReceivingMethod } from '../services/moneyReceiving';
import { EmptyState } from '../components/EmptyState';
import { font, spacing, radii } from '../theme';

const typeIcons: Record<string, typeof Wallet> = {
  bank: Landmark,
  wallet: Wallet,
  cash: Banknote,
  other: Smartphone,
};

const typeLabels: Record<string, string> = {
  bank: 'Bank',
  wallet: 'Wallet',
  cash: 'Cash',
  other: 'Other',
};

export default function MoneyReceivingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [methods, setMethods] = useState<MoneyReceivingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchMoneyReceivingMethods();
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const renderItem = ({ item }: { item: MoneyReceivingMethod }) => {
    const Icon = typeIcons[item.type] || Wallet;
    return (
      <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[s.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[s.iconWrap, { backgroundColor: colors.primaryLight }]}>
            <Icon size={24} color={colors.primary} />
          </View>
          <View style={[s.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
            <Text style={[s.name, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{item.name}</Text>
            <Text style={[s.type, { color: colors.textMuted }]}>{t(typeLabels[item.type] || item.type)}</Text>
            {item.details && (
              <Text style={[s.details, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{item.details}</Text>
            )}
          </View>
          <View style={[s.statusBadge, { backgroundColor: item.is_active ? '#E7F8ED' : '#FEE2E5' }]}>
            <Text style={[s.statusText, { color: item.is_active ? '#1F7A3F' : '#C9372C' }]}>
              {item.is_active ? t('Active') : t('Inactive')}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (methods.length === 0) {
    return (
      <EmptyState title={t('No methods')} message={t('No money receiving methods configured')} />
    );
  }

  return (
    <FlatList
      data={methods}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const s = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
  },
  cardInfo: {
    flex: 1,
    gap: 2,
  },
  cardRow: {
    alignItems: 'center',
    gap: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  details: {
    fontSize: font.sizes.xs,
    marginTop: spacing.xs,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.md,
    padding: spacing.md,
  },
  name: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.semibold,
  },
  statusBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  statusText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
  type: {
    fontSize: font.sizes.sm,
  },
});
