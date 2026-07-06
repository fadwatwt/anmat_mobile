import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { useTranslation } from 'react-i18next';
import { KeyRound } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchAdminPermissions, AdminPermission } from '../services/adminPermissions';
import { EmptyState } from '../components/EmptyState';
import { font, spacing, radii } from '../theme';

export default function AdminPermissionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [permissions, setPermissions] = useState<AdminPermission[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const data = await fetchAdminPermissions();
      setPermissions(Array.isArray(data) ? data : []);
    } catch {
      setPermissions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const groupedByModule = permissions.reduce<Record<string, AdminPermission[]>>((acc, p) => {
    const module = p.module || 'General';
    if (!acc[module]) acc[module] = [];
    acc[module].push(p);
    return acc;
  }, {});

  const renderModule = ({ item: [module, perms] }: { item: [string, AdminPermission[]] }) => (
    <View style={[s.section, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[s.moduleTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
        {module}
      </Text>
      <View style={s.permsList}>
        {perms.map((perm) => (
          <View key={perm._id} style={[s.permItem, { backgroundColor: colors.background, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <KeyRound size={14} color={colors.textMuted} />
            <Text style={[s.permName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{perm.name}</Text>
            <Text style={[s.permKey, { color: colors.textMuted }]}>{perm.key}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (permissions.length === 0) {
    return (
      <EmptyState title={t('No permissions')} message={t('No permissions found')} />
    );
  }

  return (
    <FlatList
      data={Object.entries(groupedByModule)}
      keyExtractor={([module]) => module}
      renderItem={renderModule}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const s = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    gap: spacing.md,
    padding: spacing.md,
  },
  moduleTitle: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.bold,
    marginBottom: spacing.sm,
  },
  permItem: {
    alignItems: 'center',
    borderRadius: radii.md,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  permKey: {
    fontSize: font.sizes.xs,
    fontFamily: 'monospace',
    marginLeft: 'auto',
  },
  permName: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
    flex: 1,
  },
  permsList: {
    gap: spacing.xs,
  },
  section: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
  },
});
