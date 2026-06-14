import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { EmptyState } from '../components/EmptyState';
import { fetchMySalaryTransactions, SalaryRow } from '../services/salary';
import { font, radii, spacing } from '../theme';

function fmt(n?: number) {
  if (n == null) return '0';
  return n.toLocaleString();
}

export function SalaryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [rows, setRows] = useState<SalaryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setRows(await fetchMySalaryTransactions());
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  if (rows.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <EmptyState title={t('No salary transactions')} message={t('No items to display')} icon="💰" />
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {rows.map((r) => (
        <View key={r._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.amount, { color: colors.ink, textAlign: align }]}>{fmt(r.amount)}$</Text>
            <Text style={[styles.date, { color: colors.textMuted }]}>{r.created_at || '—'}</Text>
          </View>
          <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Bonus')}</Text>
              <Text style={[styles.metaValue, { color: '#10B981', textAlign: align }]}>+{fmt(r.bonus)}$</Text>
            </View>
            <View style={styles.metaItem}>
              <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Deduction')}</Text>
              <Text style={[styles.metaValue, { color: '#EF4444', textAlign: align }]}>-{fmt(r.discount)}$</Text>
            </View>
          </View>
          {!!r.comment && (
            <Text style={[styles.comment, { color: colors.textMuted, textAlign: align }]} numberOfLines={2}>
              {r.comment}
            </Text>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  amount: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between' },
  comment: { fontSize: font.sizes.sm },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  date: { fontSize: font.sizes.xs },
  emptyWrap: { flex: 1, padding: spacing.md },
  metaItem: { flex: 1, gap: 2 },
  metaLabel: { fontSize: font.sizes.xs },
  metaRow: { gap: spacing.md },
  metaValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
