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
import { fetchMyLeaves, LeaveRow } from '../services/leaves';
import { font, radii, spacing } from '../theme';

export function LeavesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setRows(await fetchMyLeaves());
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

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <Text style={[styles.title, { color: colors.ink, textAlign: align }]}>{t('Short Leaves History')}</Text>

      {rows.length === 0 ? (
        <EmptyState title={t('No short leaves')} message={t('No items to display')} icon="🏖" />
      ) : (
        <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tableHead, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]}>{t('Date')}</Text>
            <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]}>{t('Start Time')}</Text>
            <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]}>{t('End Time')}</Text>
          </View>
          {rows.map((r) => (
            <View key={r._id} style={[styles.tableRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.tdCell, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{r.date || '—'}</Text>
              <Text style={[styles.tdCell, { color: colors.textMuted, textAlign: align }]}>{r.start_time || '—'}</Text>
              <Text style={[styles.tdCell, { color: colors.textMuted, textAlign: align }]}>{r.end_time || '—'}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  table: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  tableHead: { borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tableRow: { alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  tdCell: { flex: 1, fontSize: font.sizes.sm },
  thCell: { flex: 1, fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  title: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
});
