import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trash2, Plus, DollarSign } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchAllSalaryTransactions, deleteSalaryTransaction, SalaryTransaction } from '../services/financial';
import { font, spacing, radii } from '../theme';

export default function FinancialScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async (params: any) => {
    void refreshKey;
    return await fetchAllSalaryTransactions(params);
  }, [refreshKey]);

  const handleDelete = (item: SalaryTransaction) => {
    Alert.alert(
      t('Delete Transaction'),
      t('Are you sure you want to delete this transaction?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSalaryTransaction(item._id);
              setRefreshKey(k => k + 1);
            } catch {
              Alert.alert(t('Error'), t('Failed to delete transaction'));
            }
          },
        },
      ],
    );
  };

  const typeColors: Record<string, string> = {
    salary: '#1F7A3F',
    bonus: '#1E40AF',
    deduction: '#C9372C',
    advance: '#B45309',
    overtime: '#6B7280',
    allowance: '#7C3AED',
  };

  const statusColors: Record<string, string> = {
    paid: '#1F7A3F',
    pending: '#B45309',
    cancelled: '#C9372C',
  };

  const columns = [
    {
      key: 'employee',
      titleKey: 'Employee',
      width: 150,
      render: (item: SalaryTransaction) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {item.employee?.name || '—'}
        </Text>
      ),
    },
    {
      key: 'type',
      titleKey: 'Type',
      width: 100,
      render: (item: SalaryTransaction) => {
        const color = typeColors[item.type] || '#6B7280';
        return (
          <View style={[s.chip, { backgroundColor: color + '20' }]}>
            <Text style={[s.chipText, { color }]}>{t(item.type)}</Text>
          </View>
        );
      },
    },
    {
      key: 'amount',
      titleKey: 'Amount',
      width: 110,
      sortable: true,
      render: (item: SalaryTransaction) => (
        <Text style={[s.amountText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.amount?.toLocaleString() || '0'}
        </Text>
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 90,
      render: (item: SalaryTransaction) => {
        const color = statusColors[item.status] || '#6B7280';
        return (
          <View style={[s.chip, { backgroundColor: color + '20' }]}>
            <Text style={[s.chipText, { color }]}>{t(item.status)}</Text>
          </View>
        );
      },
    },
    {
      key: 'month',
      titleKey: 'Period',
      width: 100,
      render: (item: SalaryTransaction) => (
        <Text style={[s.cellText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.month || ''} {item.year || ''}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: SalaryTransaction) => item._id}
      searchable
      searchPlaceholderKey="Search transactions..."
      emptyTitleKey="No salary transactions"
      emptyMessageKey="No transactions found"
      pageSize={15}
      rowActions={(item: SalaryTransaction) => [
        {
          label: t('Delete'),
          icon: <Trash2 size={16} color="#DF1C41" />,
          onPress: () => handleDelete(item),
          destructive: true,
        },
      ]}
    />
  );
}

const s = StyleSheet.create({
  amountText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
  },
  cellText: {
    fontSize: font.sizes.sm,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
});
