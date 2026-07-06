import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Edit3, Trash2, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchAdminRoles, deleteAdminRole, AdminRole } from '../services/adminRoles';
import { font, spacing, radii } from '../theme';

export default function AdminRolesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async (params: any) => {
    void refreshKey;
    const data = await fetchAdminRoles();
    return { data, total: Array.isArray(data) ? data.length : 0 };
  }, [refreshKey]);

  const handleDelete = (item: AdminRole) => {
    Alert.alert(
      t('Delete Role'),
      t('Are you sure you want to delete this role?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteAdminRole(item._id);
              setRefreshKey(k => k + 1);
            } catch {
              Alert.alert(t('Error'), t('Failed to delete role'));
            }
          },
        },
      ],
    );
  };

  const columns = [
    {
      key: 'name',
      titleKey: 'Name',
      width: 180,
      sortable: true,
      render: (item: AdminRole) => (
        <View style={[s.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <ShieldCheck size={16} color={colors.primary} />
          <Text style={[s.nameText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      ),
    },
    {
      key: 'description',
      titleKey: 'Description',
      width: 200,
      render: (item: AdminRole) => (
        <Text style={[s.cellText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {item.description || '—'}
        </Text>
      ),
    },
    {
      key: 'permissions',
      titleKey: 'Permissions',
      width: 100,
      render: (item: AdminRole) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.permissions?.length ?? 0}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: AdminRole) => item._id}
      searchable
      searchPlaceholderKey="Search roles..."
      emptyTitleKey="No admin roles"
      emptyMessageKey="No roles have been created yet"
      rowActions={(item: AdminRole) => [
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
  cellText: {
    fontSize: font.sizes.sm,
  },
  nameRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  nameText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
    flex: 1,
  },
});
