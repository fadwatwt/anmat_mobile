import React, { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Edit3, Plus, ShieldCheck, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchAdminRoles, deleteAdminRole, AdminRole } from '../services/adminRoles';
import { AdminRoleModal } from '../modals/AdminRoleModal';
import { font, spacing, radii } from '../theme';

export default function AdminRolesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'sync'>('create');
  const [selectedRole, setSelectedRole] = useState<AdminRole | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canCreate = has('admin.admin_roles.create');
  const canUpdate = has('admin.admin_roles.update');
  const canDelete = has('admin.admin_roles.delete');

  const fetchData = useCallback(async () => {
    const data = await fetchAdminRoles();
    return { data, total: Array.isArray(data) ? data.length : 0 };
  }, [refreshKey]);

  const handleDelete = (item: AdminRole) => {
    Alert.alert(
      t('Delete Role'),
      `${t('Are you sure you want to delete')} "${item.name}"?`,
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

  const openCreate = () => {
    setModalMode('create');
    setSelectedRole(null);
    setModalOpen(true);
  };

  const openSync = (item: AdminRole) => {
    setModalMode('sync');
    setSelectedRole(item);
    setModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      titleKey: 'Role Name',
      width: 160,
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
      key: 'permissions',
      titleKey: 'Permissions',
      width: 200,
      render: (item: AdminRole) => {
        const perms = item.admin_permissions_ids || [];
        if (perms.length === 0) {
          return <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm }}>--</Text>;
        }
        const shown = perms.slice(0, 6);
        const extra = perms.length - shown.length;
        return (
          <View style={[s.badges, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {shown.map((p) => (
              <View key={p._id} style={[s.badge, { backgroundColor: colors.primaryLight }]}>
                <Text style={[s.badgeText, { color: colors.primary }]} numberOfLines={1}>
                  {p.name}
                </Text>
              </View>
            ))}
            {extra > 0 && (
              <View style={[s.badge, s.extraBadge, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[s.badgeText, { color: colors.textMuted }]}>+{extra}</Text>
              </View>
            )}
          </View>
        );
      },
    },
  ];

  const rowActions = (item: AdminRole) => {
    const actions = [];
    if (canUpdate) {
      actions.push({
        label: t('Sync Permissions'),
        icon: <Edit3 size={16} color="#375DFB" />,
        onPress: () => openSync(item),
      });
    }
    if (canDelete) {
      actions.push({
        label: t('Delete'),
        icon: <Trash2 size={16} color="#DF1C41" />,
        onPress: () => handleDelete(item),
        destructive: true,
      });
    }
    return actions;
  };

  return (
    <>
      <ListScreen
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: AdminRole) => item._id}
        searchable
        searchPlaceholderKey="Search roles..."
        emptyTitleKey="No admin roles"
        emptyMessageKey="No roles have been created yet"
        actions={
          canCreate
            ? [
                {
                  labelKey: 'Add Role',
                  icon: <Plus size={16} color="#FFF" />,
                  onPress: openCreate,
                },
              ]
            : undefined
        }
        rowActions={rowActions}
      />
      <AdminRoleModal
        visible={modalOpen}
        mode={modalMode}
        role={selectedRole}
        onClose={() => setModalOpen(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    </>
  );
}

const s = StyleSheet.create({
  badge: {
    alignItems: 'center',
    borderRadius: radii.lg,
    maxWidth: 130,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  badgeText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  badges: { flexWrap: 'wrap', gap: spacing.xs },
  extraBadge: { borderWidth: 1 },
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
