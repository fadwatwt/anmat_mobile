import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { Plus, X } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import {
  fetchMyRequests,
  cancelRequest,
  EmployeeAuthRequest,
  EmployeeAuthRequestType,
} from '../services/requests';
import { CreateRequestModal } from './requests/CreateRequestModal';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const TABS: { id: EmployeeAuthRequestType; labelKey: string }[] = [
  { id: 'DAY_OFF', labelKey: 'Day Off' },
  { id: 'SALARY_ADVANCE', labelKey: 'Financial' },
  { id: 'WORK_DELAY', labelKey: 'Delay' },
];

function statusVariant(status?: string): 'success' | 'danger' | 'warning' | 'default' {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected':
    case 'cancelled': return 'danger';
    case 'open':
    case 'pending': return 'warning';
    default: return 'default';
  }
}

export function RequestsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [all, setAll] = useState<EmployeeAuthRequest[]>([]);
  const [activeTab, setActiveTab] = useState<EmployeeAuthRequestType>('DAY_OFF');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setAll(await fetchMyRequests());
    } catch {
      setAll([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const rows = useMemo(() => all.filter((r) => r.type === activeTab), [all, activeTab]);

  const handleCancel = (item: EmployeeAuthRequest) => {
    Alert.alert(t('Cancel Request'), t('Are you sure you want to cancel this request?'), [
      { text: t('Back'), style: 'cancel' },
      {
        text: t('Confirm'),
        style: 'destructive',
        onPress: async () => {
          try {
            await cancelRequest(item._id);
            await load();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to cancel request'));
          }
        },
      },
    ]);
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {TABS.map((tab) => {
          const active = tab.id === activeTab;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, active && { backgroundColor: colors.surface }]}
              onPress={() => setActiveTab(tab.id)}
            >
              <Text style={[styles.tabText, { color: active ? colors.primary : colors.textMuted }]}>{t(tab.labelKey)}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xl }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
          showsVerticalScrollIndicator={false}
        >
          {rows.length === 0 ? (
            <EmptyState title={t('No requests')} message={t('No items to display')} icon="📝" />
          ) : (
            rows.map((r) => (
              <View key={r._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.date, { color: colors.textMuted }]}>{r.created_at || '—'}</Text>
                  <Badge label={t(r.status || 'open')} variant={statusVariant(r.status)} />
                </View>

                {activeTab === 'DAY_OFF' && (
                  <Detail labelKey="Vacation Date" value={r.vacation_date} align={align} />
                )}
                {activeTab === 'SALARY_ADVANCE' && (
                  <>
                    <Detail labelKey="Advance By" value={String(r.advance_salary_by ?? '—')} align={align} />
                    <Detail labelKey="Old Salary" value={String(r.old_salary_amount ?? '—')} align={align} />
                  </>
                )}
                {activeTab === 'WORK_DELAY' && (
                  <Detail labelKey="Work Due At" value={r.work_due_at} align={align} />
                )}

                <Detail labelKey="Reason" value={r.reason} align={align} />

                {r.status === 'open' && (
                  <TouchableOpacity
                    style={[styles.cancelBtn, { borderColor: '#EF4444', flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                    onPress={() => handleCancel(r)}
                  >
                    <X size={14} color="#EF4444" />
                    <Text style={styles.cancelText}>{t('Cancel')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }, isRTL ? { left: spacing.lg } : { right: spacing.lg }]}
        onPress={() => setModalOpen(true)}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <CreateRequestModal visible={modalOpen} onClose={() => setModalOpen(false)} onCreated={load} />
    </View>
  );
}

function Detail({ labelKey, value, align }: { labelKey: string; value?: string; align: 'right' | 'left' }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <View style={{ gap: 2 }}>
      <Text style={[styles.detailLabel, { color: colors.textMuted, textAlign: align }]}>{t(labelKey)}</Text>
      <Text style={[styles.detailValue, { color: colors.ink, textAlign: align }]}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cancelBtn: {
    alignItems: 'center', alignSelf: 'flex-start', borderRadius: radii.md, borderWidth: 1,
    gap: spacing.xs, marginTop: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs,
  },
  cancelText: { color: '#EF4444', fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between' },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  date: { fontSize: font.sizes.xs },
  detailLabel: { fontSize: font.sizes.xs },
  detailValue: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  fab: {
    alignItems: 'center', borderRadius: radii.full, bottom: spacing.lg, elevation: 4,
    height: 44, justifyContent: 'center', position: 'absolute', width: 44,
  },
  tab: { alignItems: 'center', borderRadius: radii.md, flex: 1, paddingVertical: spacing.sm },
  tabBar: { borderRadius: radii.lg, borderWidth: 1, margin: spacing.md, padding: spacing.xs },
  tabText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
