import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2, ShieldCheck, KeyRound, Plus } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { StatusActions } from '../components/StatusActions';
import { EmptyState } from '../components/EmptyState';
import { RoleModal } from '../modals/RoleModal';
import {
  fetchAdminRoles,
  deleteAdminRole,
  fetchSubscriberRoles,
  deleteSubscriberRole,
  AppRole,
} from '../services/roles';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

export function RolesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const isAdmin = user?.type === 'Admin';

  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [syncRole, setSyncRole] = useState<AppRole | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      setRoles(isAdmin ? await fetchAdminRoles() : await fetchSubscriberRoles());
    } catch {
      setRoles([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isAdmin]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (role: AppRole) => {
    Alert.alert(
      t('Delete Role'),
      t('Are you sure? This action cannot be undone.'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (isAdmin) await deleteAdminRole(role._id);
              else await deleteSubscriberRole(role._id);
              load();
            } catch (e) {
              Alert.alert(t('Error'), extractErrorMessage(e));
            }
          },
        },
      ],
    );
  };

  const openCreate = () => { setSyncRole(null); setModalOpen(true); };
  const openSync = (role: AppRole) => { setSyncRole(role); setModalOpen(true); };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {roles.length === 0 ? (
          <EmptyState title={t('No roles')} message={t('No items to display')} icon="🛡" />
        ) : (
          roles.map((role) => (
            <View key={role._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <ShieldCheck size={18} color={colors.primary} />
                  <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{role.name}</Text>
                </View>
                <StatusActions actions={[
                  { label: t('Sync Permissions'), icon: <KeyRound size={16} color={colors.primary} />, onPress: () => openSync(role) },
                  { label: t('Delete'), icon: <Trash2 size={16} color="#EF4444" />, onPress: () => handleDelete(role), destructive: true },
                ]} />
              </View>

              <Text style={[styles.count, { color: colors.textMuted, textAlign: align }]}>
                {role.permissions.length} {t('Permissions')}
              </Text>

              {role.permissions.length > 0 && (
                <View style={[styles.chips, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  {role.permissions.slice(0, 6).map((p, i) => (
                    <View key={p._id || i} style={[styles.chip, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                      <Text style={[styles.chipText, { color: colors.textMuted }]} numberOfLines={1}>{p.name || '--'}</Text>
                    </View>
                  ))}
                  {role.permissions.length > 6 && (
                    <View style={[styles.chip, { backgroundColor: colors.primaryLight, borderColor: colors.primary }]}>
                      <Text style={[styles.chipText, { color: colors.primary }]}>+{role.permissions.length - 6}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>

      <RoleModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
        isAdmin={isAdmin}
        role={syncRole}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: font.sizes.base, fontWeight: font.weights.bold },
  chip: { borderRadius: radii.full, borderWidth: 1, maxWidth: 130, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  chipText: { fontSize: font.sizes.xs },
  chips: { flexWrap: 'wrap', gap: spacing.xs },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 100 },
  count: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  fab: {
    alignItems: 'center',
    borderRadius: radii.full,
    bottom: spacing.xl,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    right: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 44,
  },
  titleRow: { alignItems: 'center', flex: 1, gap: spacing.xs },
});
