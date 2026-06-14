import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../generators/ListScreen';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchOrgSalaryTransactions, deleteOrgSalaryTransaction, OrgSalaryTransaction } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { AddSalaryModal } from '../modals/AddSalaryModal';
import { font, radii, spacing } from '../theme';

export default function HRSalaryScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(
    async ({ page, limit, search }: { page?: number; limit?: number; search?: string }) => {
      const res = await fetchOrgSalaryTransactions({ page, limit, search });
      return { data: res.data, total: res.total };
    },
    [reloadKey],
  );

  const handleDelete = (item: OrgSalaryTransaction) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrgSalaryTransaction(item._id);
            setReloadKey(k => k + 1);
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const columns = [
    {
      key: 'employee',
      titleKey: 'Employee',
      width: 130,
      render: (item: OrgSalaryTransaction) => (
        <Text style={[{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }]} numberOfLines={1}>
          {item.employee?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'amount',
      titleKey: 'Salary Amount',
      width: 100,
      render: (item: OrgSalaryTransaction) => (
        <Text style={[{ color: colors.ink, fontSize: font.sizes.sm, fontWeight: '600', textAlign: align }]}>
          {item.amount != null ? `$${item.amount.toLocaleString()}` : '--'}
        </Text>
      ),
    },
    {
      key: 'bonus',
      titleKey: 'Bonus',
      width: 80,
      render: (item: OrgSalaryTransaction) => (
        <Text style={[{ color: '#10B981', fontSize: font.sizes.sm, textAlign: align }]}>
          {item.bonus ? `+$${item.bonus.toLocaleString()}` : '--'}
        </Text>
      ),
    },
    {
      key: 'discount',
      titleKey: 'Deduction',
      width: 80,
      render: (item: OrgSalaryTransaction) => (
        <Text style={[{ color: '#EF4444', fontSize: font.sizes.sm, textAlign: align }]}>
          {item.discount ? `-$${item.discount.toLocaleString()}` : '--'}
        </Text>
      ),
    },
    {
      key: 'comment',
      titleKey: 'Comment',
      width: 120,
      render: (item: OrgSalaryTransaction) => (
        <Text style={[{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }]} numberOfLines={2}>
          {item.comment || '--'}
        </Text>
      ),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ListScreen<OrgSalaryTransaction>
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item) => item._id}
        searchable
        searchPlaceholderKey="Search salary transactions..."
        emptyTitleKey="No salary transactions"
        emptyMessageKey="No items to display"
        rowActions={(item) => [
          {
            label: t('Delete'),
            onPress: () => handleDelete(item),
            destructive: true,
          },
        ]}
      />

      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => setModalOpen(true)}
      >
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <AddSalaryModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => setReloadKey(k => k + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    alignItems: 'center',
    borderRadius: 22,
    bottom: spacing.xl,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    width: 44,
  },
});
