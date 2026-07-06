import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { CreditCard, Star, Plus } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchPaymentMethods, setDefaultPaymentMethod, PaymentMethod } from '../services/paymentMethods';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import { font, spacing, radii } from '../theme';

export default function PaymentMethodsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchPaymentMethods();
      setMethods(Array.isArray(data) ? data : []);
    } catch {
      setMethods([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSetDefault = async (id: string) => {
    try {
      await setDefaultPaymentMethod(id);
      await loadData();
      Alert.alert(t('Success'), t('Default payment method updated'));
    } catch {
      Alert.alert(t('Error'), t('Failed to update default payment method'));
    }
  };

  const renderItem = ({ item }: { item: PaymentMethod }) => (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[s.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <CreditCard size={24} color={colors.primary} />
        </View>
        <View style={[s.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <View style={[s.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[s.typeText, { color: colors.ink }]}>{t(item.type.replace('_', ' '))}</Text>
            {item.is_default && (
              <Star size={14} color="#F59E0B" fill="#F59E0B" />
            )}
          </View>
          {item.last_four && (
            <Text style={[s.lastFour, { color: colors.textMuted }]}>
              **** {item.last_four}
            </Text>
          )}
        </View>
        {!item.is_default && (
          <TouchableOpacity
            style={[s.defaultBtn, { borderColor: colors.border }]}
            onPress={() => handleSetDefault(item._id)}
          >
            <Text style={[s.defaultBtnText, { color: colors.primary }]}>{t('Set Default')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (methods.length === 0) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <EmptyState title={t('No payment methods')} message={t('Add a payment method to get started')} />
      </View>
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
  cardHeader: {
    alignItems: 'center',
    gap: spacing.xs,
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
    padding: spacing.xl,
  },
  defaultBtn: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  defaultBtnText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastFour: {
    fontSize: font.sizes.sm,
  },
  list: {
    gap: spacing.md,
    padding: spacing.md,
  },
  typeText: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.semibold,
  },
});
