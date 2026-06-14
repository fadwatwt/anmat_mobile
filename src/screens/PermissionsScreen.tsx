import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { ListScreen } from '../generators/ListScreen';
import { fetchPermissions, Permission } from '../services/permissions';
import { font } from '../theme';

export function PermissionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.type === 'Admin';

  const fetchData = async () => {
    const data = await fetchPermissions(isAdmin);
    return { data, total: data.length };
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const columns = [
    {
      key: 'name',
      titleKey: 'Name',
      width: 200,
      render: (item: Permission) => (
        <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={2}>
          {item.name}
        </Text>
      ),
    },
    {
      key: 'action',
      titleKey: 'Action',
      width: 110,
      render: (item: Permission) => (item.action ? <Badge label={item.action} variant="info" /> : <Text style={{ color: colors.textMuted }}>--</Text>),
    },
    {
      key: 'model_type',
      titleKey: 'Model Type',
      width: 130,
      render: (item: Permission) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
          {item.model_type || '--'}
        </Text>
      ),
    },
    {
      key: 'createdAt',
      titleKey: 'Created At',
      width: 130,
      render: (item: Permission) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
          {item.createdAt ? item.createdAt.slice(0, 10) : '--'}
        </Text>
      ),
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <ListScreen
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: Permission) => item._id}
        searchable
        searchPlaceholderKey="Search permissions..."
        emptyTitleKey="No permissions found"
        emptyMessageKey="No items to display"
      />
    </View>
  );
}
