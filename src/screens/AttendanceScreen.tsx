import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../components/Badge';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { extractErrorMessage } from '../lib/http';
import { checkIn, checkOut, fetchAttendance } from '../services/attendance';
import { font, radii, spacing } from '../theme';
import { AttendanceItem } from '../types';

function formatDate(value?: string) {
  if (!value) return '--';
  return new Date(value).toLocaleString('ar', { hour: '2-digit', minute: '2-digit' });
}

function getStatusVariant(s?: string): 'success' | 'warning' | 'danger' | 'default' {
  if (!s) return 'default';
  const l = s.toLowerCase();
  if (l === 'present' || l === 'on_time') return 'success';
  if (l === 'late') return 'warning';
  if (l === 'absent') return 'danger';
  return 'default';
}

function getStatusLabel(s?: string): string {
  if (!s) return 'سجل';
  const l = s.toLowerCase();
  if (l === 'present' || l === 'on_time') return 'حاضر';
  if (l === 'late') return 'متأخر';
  if (l === 'absent') return 'غائب';
  return s;
}

export default function AttendanceScreen() {
  const { colors } = useTheme();
  const [records, setRecords] = useState<AttendanceItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<'in' | 'out' | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setRecords(await fetchAttendance()); } catch (e) { setError(extractErrorMessage(e)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function runAction(type: 'in' | 'out') {
    setAction(type); setError('');
    try { type === 'in' ? await checkIn() : await checkOut(); await load(); } catch (e) { setError(extractErrorMessage(e)); } finally { setAction(null); }
  }

  return (
    <View style={styles.container}>
      <View style={styles.actionsRow}>
        <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.actionIcon}>🟢</Text>
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>حضور</Text>
          <Button label={action === 'in' ? '...' : 'تسجيل'} loading={action === 'in'} onPress={() => runAction('in')} size="sm" />
        </View>
        <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={styles.actionIcon}>🔴</Text>
          <Text style={[styles.actionLabel, { color: colors.textMuted }]}>خروج</Text>
          <Button label={action === 'out' ? '...' : 'تسجيل'} loading={action === 'out'} onPress={() => runAction('out')} variant="secondary" size="sm" />
        </View>
      </View>
      {error ? <EmptyState title="خطأ" message={error} icon="⚠️" /> : null}
      {loading && !records.length ? <ActivityIndicator color={colors.primary} /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={records}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={!loading && !error ? <EmptyState title="لا يوجد سجل" message="سيظهر السجل هنا" icon="📅" /> : null}
        onRefresh={load}
        refreshing={loading}
        renderItem={({ item }) => (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.cardTop}>
              <Badge label={getStatusLabel(item.status)} variant={getStatusVariant(item.status)} size="md" />
              <Text style={[styles.date, { color: colors.textMuted }]}>{formatDate(item.date || item.createdAt)}</Text>
            </View>
            <View style={styles.cardRow}>
              <View style={styles.cardItem}>
                <Text style={[styles.cardLabel, { color: colors.textMuted }]}>حضور</Text>
                <Text style={[styles.cardValue, { color: colors.ink }]}>{formatDate(item.check_in)}</Text>
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.cardItem}>
                <Text style={[styles.cardLabel, { color: colors.textMuted }]}>خروج</Text>
                <Text style={[styles.cardValue, { color: colors.ink }]}>{formatDate(item.check_out)}</Text>
              </View>
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  actionsRow: { flexDirection: 'row', gap: spacing.md, paddingHorizontal: 0 },
  actionCard: { alignItems: 'center', borderWidth: 1, borderRadius: radii.xxl, flex: 1, gap: spacing.sm, padding: spacing.md },
  actionIcon: { fontSize: 24 },
  actionLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  card: { borderWidth: 1, borderRadius: radii.xxl, gap: spacing.md, padding: spacing.md },
  cardItem: { alignItems: 'center', flex: 1, gap: spacing.xs },
  cardLabel: { fontSize: font.sizes.xs },
  cardRow: { flexDirection: 'row' },
  cardTop: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardValue: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  container: { flex: 1, gap: spacing.md, paddingTop: spacing.md },
  date: { fontSize: font.sizes.sm },
  divider: { height: 1, width: 1 },
  list: { gap: spacing.md, padding: spacing.md },
});
