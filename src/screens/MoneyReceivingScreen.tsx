import React, { useCallback, useEffect, useState } from 'react';
import { Alert, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Wallet, Landmark, Plus } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  fetchMoneyReceivingMethods,
  deleteMoneyReceivingMethod,
  toggleMoneyReceivingMethodActiveStatus,
  getMoneyReceivingTypeLabel,
  MoneyReceivingMethod,
} from '../services/moneyReceiving';
import { EmptyState } from '../components/EmptyState';
import { StatusActions } from '../components/StatusActions';
import { MoneyReceivingModal } from '../modals/MoneyReceivingModal';
import { extractErrorMessage } from '../lib/http';
import { font, spacing, radii } from '../theme';

export default function MoneyReceivingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [methods, setMethods] = useState<MoneyReceivingMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<MoneyReceivingMethod | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canCreate = has('admin.money_receiving_methods.create');
  const canUpdate = has('admin.money_receiving_methods.update');
  const canDelete = has('admin.money_receiving_methods.delete');
  const canToggleActivity = has('admin.money_receiving_methods.toggle_activity');

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

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (m: MoneyReceivingMethod) => { setEditing(m); setModalOpen(true); };

  const handleToggle = (m: MoneyReceivingMethod) => {
    Alert.alert(
      m.is_active ? t('Deactivate Money Receiving Method') : t('Activate Money Receiving Method'),
      m.is_active
        ? t('Are you sure you want to deactivate the method?')
        : t('Are you sure you want to activate the method?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Confirm'),
          onPress: async () => {
            try { await toggleMoneyReceivingMethodActiveStatus(m._id); loadData(); }
            catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
          },
        },
      ],
    );
  };

  const handleDelete = (m: MoneyReceivingMethod) => {
    Alert.alert(t('Delete Money Receiving Method'), t('Are you sure? This action cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try { await deleteMoneyReceivingMethod(m._id); loadData(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: MoneyReceivingMethod }) => (
    <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.cardRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[s.iconWrap, { backgroundColor: colors.primaryLight }]}>
          <Landmark size={24} color={colors.primary} />
        </View>
        <View style={[s.cardInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
          <Text style={[s.name, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{item.title}</Text>
          <Text style={[s.type, { color: colors.textMuted }]}>{t(getMoneyReceivingTypeLabel(item.type))}</Text>
          <View style={[s.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[s.statusBadge, { backgroundColor: item.is_active ? '#E7F8ED' : '#FEE2E5' }]}>
              <Text style={[s.statusText, { color: item.is_active ? '#1F7A3F' : '#C9372C' }]}>
                {item.is_active ? t('Active') : t('Inactive')}
              </Text>
            </View>
            {item.is_default && (
              <View style={[s.statusBadge, { backgroundColor: '#E0F2FE' }]}>
                <Text style={[s.statusText, { color: '#0369A1' }]}>{t('Default')}</Text>
              </View>
            )}
          </View>
        </View>
        <StatusActions actions={[
          ...(canUpdate ? [{ label: t('Edit'), icon: <Wallet size={16} color="#375DFB" />, onPress: () => openEdit(item) }] : []),
          ...(canToggleActivity ? [{
            label: item.is_active ? t('Deactivate Money Receiving Method') : t('Activate Money Receiving Method'),
            icon: <Wallet size={16} color="#F59E0B" />,
            onPress: () => handleToggle(item),
          }] : []),
          ...(canDelete ? [{ label: t('Delete'), icon: <Wallet size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true }] : []),
        ]} />
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Wallet size={40} color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={methods}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <EmptyState title={t('No methods')} message={t('No money receiving methods configured')} icon="🏦" />
        }
      />

      {canCreate && (
        <TouchableOpacity style={[s.fab, { backgroundColor: colors.primary }]} onPress={openCreate} activeOpacity={0.85}>
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      <MoneyReceivingModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); loadData(); }}
        method={editing}
      />
    </>
  );
}

const s = StyleSheet.create({
  badgeRow: { gap: spacing.xs },
  card: { borderWidth: 1, borderRadius: radii.xxl, padding: spacing.md },
  cardInfo: { flex: 1, gap: 2 },
  cardRow: { alignItems: 'center', gap: spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
  iconWrap: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  list: { gap: spacing.md, padding: spacing.md, paddingBottom: 100 },
  name: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  statusBadge: { borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  statusText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  type: { fontSize: font.sizes.sm },
});
