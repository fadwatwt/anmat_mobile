import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { X, UserPlus, Bell } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchSystemAdmins, SystemAdmin, unassignAdminRole } from '../services/systemAdmins';
import { CreateAdminModal } from '../modals/CreateAdminModal';
import { AssignRoleModal } from '../modals/AssignRoleModal';
import { SendAdminNotificationModal } from '../modals/SendAdminNotificationModal';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

export default function SystemAdminsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [createOpen, setCreateOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [notifyOpen, setNotifyOpen] = useState(false);
  const [selected, setSelected] = useState<SystemAdmin | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canManageRoles = has('admin.admin_roles.update');
  const canCreate = has('admin.system_admins.create');

  const fetchData = useCallback(async () => {
    const data = await fetchSystemAdmins();
    return { data, total: data.length };
  }, [reloadKey]);

  const handleUnassign = (admin: SystemAdmin, roleId: string, roleName: string) => {
    Alert.alert(t('Unassign Role'), `${t('Are you sure you want to unassign the role')} "${roleName}" ${t('from')} ${admin.name || ''}?`, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Unassign'),
        style: 'destructive',
        onPress: async () => {
          try {
            await unassignAdminRole(admin._id, roleId);
            setReloadKey((k) => k + 1);
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const columns = [
    {
      key: 'name',
      titleKey: 'Admin',
      width: 160,
      render: (item: SystemAdmin) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
            {item.name || '--'}
          </Text>
          {item.email && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'roles',
      titleKey: 'Roles',
      width: 150,
      render: (item: SystemAdmin) => {
        const roles = item.admin_system_roles || [];
        if (roles.length === 0) {
          return <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm }}>--</Text>;
        }
        return (
          <View style={[styles.rolesWrap, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {roles.map((role) => (
              <View key={role._id} style={[styles.rolePill, { backgroundColor: colors.primaryLight, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.rolePillText, { color: colors.primary }]} numberOfLines={1}>
                  {role.name}
                </Text>
                {canManageRoles && (
                  <Pressable
                    hitSlop={6}
                    onPress={() => handleUnassign(item, role._id, role.name)}
                    style={styles.unassignBtn}
                  >
                    <X size={12} color={colors.danger} />
                  </Pressable>
                )}
              </View>
            ))}
          </View>
        );
      },
    },
    {
      key: 'is_active',
      titleKey: 'Status',
      width: 100,
      render: (item: SystemAdmin) => (
        <Badge label={item.is_active ? t('Active') : t('Inactive')} variant={item.is_active ? 'success' : 'danger'} />
      ),
    },
  ];

  const rowActions = (item: SystemAdmin) => {
    const actions = [];
    if (canManageRoles) {
      actions.push({
        label: t('Assign Role'),
        icon: <UserPlus size={16} color="#375DFB" />,
        onPress: () => {
          setSelected(item);
          setAssignOpen(true);
        },
      });
    }
    actions.push({
      label: t('Send Notification'),
      icon: <Bell size={16} color="#375DFB" />,
      onPress: () => {
        setSelected(item);
        setNotifyOpen(true);
      },
    });
    return actions;
  };

  return (
    <>
      <ListScreen
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: SystemAdmin) => item._id}
        searchable
        searchPlaceholderKey="Search admins..."
        onCreate={canCreate ? () => setCreateOpen(true) : undefined}
        rowActions={rowActions}
        emptyTitleKey="No admins found"
        emptyMessageKey="No system admins to display"
      />
      <CreateAdminModal visible={createOpen} onClose={() => setCreateOpen(false)} onSaved={() => setReloadKey((k) => k + 1)} />
      <AssignRoleModal
        visible={assignOpen}
        admin={selected}
        onClose={() => setAssignOpen(false)}
        onAssigned={() => setReloadKey((k) => k + 1)}
      />
      <SendAdminNotificationModal
        visible={notifyOpen}
        preSelectedUser={selected}
        sourceType="admin"
        onClose={() => setNotifyOpen(false)}
        onSent={() => setReloadKey((k) => k + 1)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  rolePill: {
    alignItems: 'center',
    borderRadius: radii.lg,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  rolePillText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, maxWidth: 100 },
  rolesWrap: { flexWrap: 'wrap', gap: spacing.xs },
  unassignBtn: { padding: 1 },
});
