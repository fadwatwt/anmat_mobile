import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Button } from '../components/Button';
import { EmptyState } from '../components/EmptyState';
import { fetchMyAttendances, checkIn, checkOut, AttendanceRow } from '../services/attendance';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

function todayString() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function AttendanceScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [records, setRecords] = useState<AttendanceRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchMyAttendances();
      setRecords(data);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // "Checked in" = today has a record with start_time but no end_time.
  const hasOpenRecord = useMemo(
    () => records.some((r) => r.date === todayString() && r.start_time && !r.end_time),
    [records],
  );

  const handleCheckIn = () => {
    Alert.alert(
      t('Confirm Check In'),
      t('Are you sure you want to check in now? Your check-in time will be recorded immediately.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Check In'),
          onPress: async () => {
            setSubmitting(true);
            try {
              await checkIn(nowHHMM());
              await load();
            } catch (e) {
              Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to check in. Please try again.'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const handleCheckOut = () => {
    Alert.alert(
      t('Confirm Check Out'),
      t('Are you sure you want to check out now? Your check-out time will be recorded immediately.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Check Out'),
          onPress: async () => {
            setSubmitting(true);
            try {
              await checkOut(nowHHMM());
              await load();
            } catch (e) {
              Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to check out. Please try again.'));
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <ScrollView
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Check-in / Check-out action card */}
      <View style={[styles.actionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={{ gap: 4 }}>
          <Text style={[styles.time, { color: colors.ink, textAlign: align }]}>{nowHHMM()}</Text>
          <View style={[styles.statusRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.dot, { backgroundColor: hasOpenRecord ? '#10B981' : colors.textMuted }]} />
            <Text style={[styles.statusText, { color: colors.textMuted }]}>
              {hasOpenRecord ? t('Currently Checked In') : t('Not Checked In')}
            </Text>
          </View>
        </View>
        {!hasOpenRecord ? (
          <Button label={t('Check In')} onPress={handleCheckIn} loading={submitting} />
        ) : (
          <Button label={t('Check Out')} variant="danger" onPress={handleCheckOut} loading={submitting} />
        )}
      </View>

      {/* History */}
      <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Attendance History')}</Text>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xl }} />
      ) : records.length === 0 ? (
        <EmptyState title={t('No attendance records')} message={t('No items to display')} icon="📅" />
      ) : (
        <View style={[styles.table, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.tableHead, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]}>{t('Date')}</Text>
            <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]}>{t('Check In')}</Text>
            <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]}>{t('Check Out')}</Text>
          </View>
          {records.map((r) => (
            <View key={r._id} style={[styles.tableRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.tdCell, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{r.date || '—'}</Text>
              <Text style={[styles.tdCell, { color: colors.ink, textAlign: align }]}>{r.start_time || '—'}</Text>
              <Text style={[styles.tdCell, { textAlign: align }]}>
                {r.end_time ? (
                  <Text style={{ color: colors.ink }}>{r.end_time}</Text>
                ) : (
                  <Text style={{ color: '#C2540A' }}>{t('In Progress')}</Text>
                )}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actionCard: {
    alignItems: 'center',
    borderRadius: radii.xl,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  dot: { borderRadius: radii.full, height: 10, width: 10 },
  sectionTitle: { fontSize: font.sizes.base, fontWeight: font.weights.semibold, marginTop: spacing.sm },
  statusRow: { alignItems: 'center', gap: spacing.xs },
  statusText: { fontSize: font.sizes.xs },
  table: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  tableHead: { borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tableRow: { alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  tdCell: { flex: 1, fontSize: font.sizes.sm },
  thCell: { flex: 1, fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  time: { fontSize: 28, fontWeight: font.weights.bold },
});
