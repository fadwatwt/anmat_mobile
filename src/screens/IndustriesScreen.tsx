import React, { useCallback, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Edit3, Trash2, Ban, CheckCircle2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchIndustriesOrganizationsCount } from '../services/dashboard';
import { deleteIndustry, updateIndustry } from '../services/industries';
import { CreateIndustryModal } from '../modals/CreateIndustryModal';
import { extractErrorMessage } from '../lib/http';
import { IndustryCount } from '../types';
import { font, radii, spacing } from '../theme';

export default function IndustriesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<IndustryCount | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canCreate = has('admin.industries.create');
  const canUpdate = has('admin.industries.update');
  const canDelete = has('admin.industries.delete');

  const fetchData = useCallback(async () => {
    const data = await fetchIndustriesOrganizationsCount();
    return { data, total: data.length };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleCreate = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (item: IndustryCount) => {
    setEditing(item);
    setModalOpen(true);
  };
  const handleDelete = (item: IndustryCount) => {
    Alert.alert(t('Delete'), `${t('Are you sure you want to delete')} "${item.name}"? ${t('This action cannot be undone.')}`, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try { await deleteIndustry(item._id); reload(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };
  const handleToggleAllowed = (item: IndustryCount) => {
    const next = !item.is_allowed;
    Alert.alert(
      next ? t('Enable Industry') : t('Disable Industry'),
      `${t('Are you sure you want to')} ${next ? t('enable') : t('disable')} "${item.name}"?`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Yes, Confirm'),
          style: next ? 'default' : 'destructive',
          onPress: async () => {
            try { await updateIndustry(item._id, { name: item.name, is_allowed: next }); reload(); }
            catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
          },
        },
      ],
    );
  };

  const columns = [
    {
      key: 'name',
      titleKey: 'Industry Name',
      width: 170,
      render: (item: IndustryCount) => (
        <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.name || '--'}
        </Text>
      ),
    },
    {
      key: 'icon',
      titleKey: 'Icon',
      width: 90,
      render: (item: IndustryCount) => (
        <View style={[s.iconBadge, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
          <Text style={[s.iconText, { color: colors.textMuted }]} numberOfLines={1}>
            {item.icon_name || t('None')}
          </Text>
        </View>
      ),
    },
    {
      key: 'by_subscriber',
      titleKey: 'Created By',
      width: 100,
      render: (item: IndustryCount) => (
        <View style={[s.byBadge, { backgroundColor: item.is_by_subscriber ? colors.primaryLight : colors.statusBg }]}>
          <Text style={[s.byText, { color: item.is_by_subscriber ? colors.primary : colors.textMuted }]}>
            {item.is_by_subscriber ? t('Subscriber') : t('Admin')}
          </Text>
        </View>
      ),
    },
    {
      key: 'subscribers_count',
      titleKey: 'Subscribers',
      width: 90,
      render: (item: IndustryCount) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, fontWeight: font.weights.semibold, textAlign: 'center' }}>
          {item.subscribers_count ?? 0}
        </Text>
      ),
    },
    {
      key: 'is_allowed',
      titleKey: 'Allowed',
      width: 90,
      render: (item: IndustryCount) => (
        <Pressable disabled={!canUpdate} onPress={() => handleToggleAllowed(item)}>
          <View
            style={[
              s.allowedBadge,
              {
                backgroundColor: item.is_allowed ? colors.successBg : colors.dangerBg,
                flexDirection: isRTL ? 'row-reverse' : 'row',
              },
            ]}
          >
            {item.is_allowed
              ? <CheckCircle2 size={12} color={colors.successText} />
              : <Ban size={12} color={colors.dangerText} />}
            <Text style={[s.allowedText, { color: item.is_allowed ? colors.successText : colors.dangerText }]}>
              {item.is_allowed ? t('Allowed') : t('Blocked')}
            </Text>
          </View>
        </Pressable>
      ),
    },
  ];

  const rowActions = (item: IndustryCount) => {
    const actions = [];
    if (canUpdate) {
      actions.push({ label: t('Edit'), icon: <Edit3 size={16} color="#375DFB" />, onPress: () => handleEdit(item) });
      actions.push({
        label: item.is_allowed ? t('Disable') : t('Enable'),
        icon: item.is_allowed ? <Ban size={16} color="#F17B2C" /> : <CheckCircle2 size={16} color="#38C793" />,
        onPress: () => handleToggleAllowed(item),
      });
    }
    if (canDelete) {
      actions.push({ label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true });
    }
    return actions;
  };

  return (
    <>
      <ListScreen
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: IndustryCount) => item._id}
        searchable
        searchPlaceholderKey="Search industries..."
        onCreate={canCreate ? handleCreate : undefined}
        rowActions={rowActions}
        emptyTitleKey="No industries found"
        emptyMessageKey="No industries to display"
      />
      <CreateIndustryModal visible={modalOpen} onClose={() => setModalOpen(false)} onSaved={reload} industry={editing} />
    </>
  );
}

const s = StyleSheet.create({
  allowedBadge: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  allowedText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  byBadge: { alignSelf: 'flex-start', borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  byText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  iconBadge: { alignSelf: 'flex-start', borderRadius: radii.md, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  iconText: { fontSize: font.sizes.xs, fontFamily: 'monospace' },
});
