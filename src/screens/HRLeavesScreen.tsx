import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../generators/ListScreen';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchOrgLeaves, deleteOrgLeave, OrgLeave } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { AddShortLeaveModal } from '../modals/AddShortLeaveModal';
import { font, radii, spacing } from '../theme';

export default function HRLeavesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(
    async ({ page, limit, search }: { page?: number; limit?: number; search?: string }) => {
      const res = await fetchOrgLeaves({ page, limit, search });
      return { data: res.data, total: res.total };
    },
    [reloadKey],
  );

  const handleDelete = (item: OrgLeave) => {
    Alert.alert(t('Delete Short Leave Record'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try {
            await deleteOrgLeave(item._id);
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
      width: 140,
      render: (item: OrgLeave) => (
        <Text style={[{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }]} numberOfLines={1}>
          {item.employee?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'date',
      titleKey: 'Date',
      width: 105,
      render: (item: OrgLeave) => (
        <Text style={[{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }]}>{item.date || '--'}</Text>
      ),
    },
    {
      key: 'start_time',
      titleKey: 'Start Time',
      width: 90,
      render: (item: OrgLeave) => (
        <Text style={[{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }]}>{item.start_time || '--'}</Text>
      ),
    },
    {
      key: 'end_time',
      titleKey: 'End Time',
      width: 90,
      render: (item: OrgLeave) => (
        <Text style={[{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }]}>{item.end_time || '--'}</Text>
      ),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ListScreen<OrgLeave>
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item) => item._id}
        searchable
        searchPlaceholderKey="Search leaves..."
        emptyTitleKey="No leave records"
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

      <AddShortLeaveModal
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
