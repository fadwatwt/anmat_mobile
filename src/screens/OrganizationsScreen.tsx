import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet, Alert, TouchableOpacity, Modal, Pressable, TextInput, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Edit3, Trash2, Plus, Building2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchAllOrganizations, Organization } from '../services/organizations';
import { font, spacing, radii } from '../theme';

export default function OrganizationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async (params: any) => {
    void refreshKey;
    return await fetchAllOrganizations(params);
  }, [refreshKey]);

  const columns = [
    {
      key: 'name',
      titleKey: 'Name',
      width: 180,
      sortable: true,
      render: (item: Organization) => (
        <View style={[s.nameRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[s.avatar, { backgroundColor: colors.primaryLight }]}>
            <Building2 size={16} color={colors.primary} />
          </View>
          <Text style={[s.nameText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {item.name}
          </Text>
        </View>
      ),
    },
    {
      key: 'email',
      titleKey: 'Email',
      width: 160,
      render: (item: Organization) => (
        <Text style={[s.cellText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {item.email || '—'}
        </Text>
      ),
    },
    {
      key: 'industry',
      titleKey: 'Industry',
      width: 120,
      render: (item: Organization) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {item.industry?.name || '—'}
        </Text>
      ),
    },
    {
      key: 'employees_count',
      titleKey: 'Employees',
      width: 90,
      render: (item: Organization) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.employees_count ?? '—'}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: Organization) => item._id}
      searchable
      searchPlaceholderKey="Search organizations..."
      emptyTitleKey="No organizations"
      emptyMessageKey="No organizations found"
    />
  );
}

const s = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
