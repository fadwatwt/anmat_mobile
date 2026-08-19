import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, Pencil, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { EmptyState } from '../components/EmptyState';
import { StatusActions } from '../components/StatusActions';
import { AddLeaveModal } from '../modals/AddLeaveModal';
import { fetchMyLeaves, deleteMyLeave, LeaveRow } from '../services/leaves';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

function formatTime(time?: string) {
  if (!time) return '—';
  const [h, m] = time.split(':').map(Number);
  if (isNaN(h)) return time;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m ?? 0).padStart(2, '0')} ${period}`;
}

export function LeavesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [rows, setRows] = useState<LeaveRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<LeaveRow | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchMyLeaves();
      const sorted = [...data].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setRows(sorted);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (r: LeaveRow) => { setEditing(r); setModalOpen(true); };

  const handleDelete = (r: LeaveRow) => {
    Alert.alert(t('Delete Leave Request'), t('Are you sure? This action cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try { await deleteMyLeave(r._id); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  return (
    <>
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
              <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{t('Date')}</Text>
              <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{t('Start Time')}</Text>
              <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{t('End Time')}</Text>
              <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{t('Reason')}</Text>
              <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{t('Status')}</Text>
              <Text style={[styles.thCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{''}</Text>
            </View>
            {rows.map((r) => {
              const st =
                r.status === 'approved'
                  ? { bg: colors.successBg, text: colors.successText }
                  : r.status === 'rejected'
                    ? { bg: colors.dangerBg, text: colors.dangerText }
                    : { bg: colors.warningBg, text: colors.warningText };
              const statusLabel = r.status ? r.status.charAt(0).toUpperCase() + r.status.slice(1) : t('Pending');
              return (
                <View key={r._id} style={[styles.tableRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.tdCell, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{r.date || '—'}</Text>
                  <Text style={[styles.tdCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{formatTime(r.start_time)}</Text>
                  <Text style={[styles.tdCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{formatTime(r.end_time)}</Text>
                  <Text style={[styles.tdCell, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{r.reason || '—'}</Text>
                  <View style={[styles.badge, { backgroundColor: st.bg }]}>
                    <Text style={[styles.badgeText, { color: st.text }]} numberOfLines={1}>{t(statusLabel)}</Text>
                  </View>
                  <View>
                    {r.status === 'pending' ? (
                      <StatusActions actions={[
                        { label: t('Edit'), icon: <Pencil size={16} color="#375DFB" />, onPress: () => openEdit(r) },
                        { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(r), destructive: true },
                      ]} />
                    ) : null}
                  </View>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>

      <AddLeaveModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
        leave={editing}
      />
    </>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  badgeText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 100 },
  fab: {
    alignItems: 'center',
    borderRadius: radii.full,
    bottom: spacing.xl,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    end: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 44,
  },
  table: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
  tableHead: { borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  tableRow: { alignItems: 'center', borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  tdCell: { flex: 1, fontSize: font.sizes.sm },
  thCell: { flex: 1, fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  title: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
});
