import React, { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Bird, Globe, Trash2, Pencil, Plus, FolderCog } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { AccountQuotaCard } from '../components/social/AccountQuotaCard';
import { TwitterAccountModal } from '../modals/TwitterAccountModal';
import { ManageCategoriesModal } from '../modals/ManageCategoriesModal';
import {
  fetchSocialMediaQuota, fetchTwitterAccounts, deleteTwitterAccount,
  SocialMediaQuota, TwitterAccount,
} from '../services/socialMedia';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

function statusVariant(s?: string): 'success' | 'warning' | 'danger' | 'default' {
  if (s === 'Normal') return 'success';
  if (s === 'Email Verify' || s === 'Phone Verify' || s === 'FA Verify') return 'warning';
  if (!s || s === 'Unknown') return 'default';
  return 'danger';
}

function TwitterTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [quota, setQuota] = useState<SocialMediaQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [accountModal, setAccountModal] = useState(false);
  const [editAccount, setEditAccount] = useState<TwitterAccount | null>(null);
  const [catModal, setCatModal] = useState(false);

  const load = useCallback(async () => {
    try {
      const [accs, q] = await Promise.all([
        fetchTwitterAccounts({}).catch(() => []),
        fetchSocialMediaQuota().catch(() => null),
      ]);
      setAccounts(accs);
      setQuota(q);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleDelete = (acc: TwitterAccount) => {
    Alert.alert(t('Confirm Delete'), t('Are you sure you want to delete this Twitter account?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => { await deleteTwitterAccount(acc._id).catch(() => {}); load(); },
      },
    ]);
  };

  const openCreate = () => { setEditAccount(null); setAccountModal(true); };
  const openEdit = (acc: TwitterAccount) => { setEditAccount(acc); setAccountModal(true); };

  const quotaFull = !!quota && !quota.unlimited && quota.limit > 0 && quota.used >= quota.limit;

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.tabContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <AccountQuotaCard used={quota?.used} limit={quota?.limit} unlimited={quota?.unlimited} />

        {/* Quick actions */}
        <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.primary, opacity: quotaFull ? 0.5 : 1 }]}
            onPress={openCreate}
            disabled={quotaFull}
          >
            <Plus size={16} color="#FFF" />
            <Text style={styles.actionText}>{t('Add Account')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtnOutline, { borderColor: colors.border }]}
            onPress={() => setCatModal(true)}
          >
            <FolderCog size={16} color={colors.primary} />
            <Text style={[styles.actionTextOutline, { color: colors.primary }]}>{t('Manage Categories')}</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Twitter Accounts')}</Text>

        {accounts.length === 0 ? (
          <EmptyState
            title={t('No Twitter accounts yet')}
            message={t('No Twitter accounts yet. Add your first account to get started.')}
            icon="🐦"
          />
        ) : (
          accounts.map((acc) => (
            <View key={acc._id} style={[styles.accountCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.accountInfo}>
                <View style={[styles.accountHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.accountName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                    {acc.AccountDataInfo1?.FullName || acc.name}
                  </Text>
                  <Badge label={t(acc.AccountStatus || 'Unknown')} variant={statusVariant(acc.AccountStatus)} size="sm" />
                </View>
                <Text style={[styles.accountHandle, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>@{acc.name}</Text>
                <View style={[styles.accountMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{t('Category')}: {acc.Category?.name || '-'}</Text>
                  <Text style={[styles.metaText, { color: colors.textMuted }]}>{t('Followers')}: {acc.AccountDataInfo1?.Followers ?? '-'}</Text>
                </View>
                {!!acc.Description && (
                  <Text style={[styles.accountDesc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
                    {acc.Description}
                  </Text>
                )}
              </View>
              <View style={styles.cardActions}>
                <TouchableOpacity style={styles.delBtn} onPress={() => openEdit(acc)}>
                  <Pencil size={18} color={colors.primary} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.delBtn} onPress={() => handleDelete(acc)}>
                  <Trash2 size={18} color={colors.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TwitterAccountModal
        visible={accountModal}
        onClose={() => setAccountModal(false)}
        onSaved={() => { setAccountModal(false); load(); }}
        account={editAccount}
      />
      <ManageCategoriesModal
        visible={catModal}
        onClose={() => setCatModal(false)}
        onChanged={load}
      />
    </>
  );
}

function FacebookTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.tabContent}>
      <EmptyState title={t('Facebook')} message={t('Facebook content goes here')} icon="📘" />
    </ScrollView>
  );
}

export default function SocialMediaScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const tabs = [
    { name: 'Twitter', component: TwitterTab, icon: Bird, title: t('Twitter') },
    { name: 'Facebook', component: FacebookTab, icon: Globe, title: t('Facebook') },
  ] as const;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = tabs.find((tb) => tb.name === route.name);
        return {
          tabBarLabel: cfg?.title,
          tabBarIcon: ({ color }) => {
            const Icon = cfg?.icon;
            return Icon ? <Icon size={18} color={color} strokeWidth={2} /> : <></>;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0 },
          tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
          tabBarLabelStyle: { fontSize: 12, fontWeight: '600', textTransform: 'none' },
          headerShown: false,
        };
      }}
    >
      {tabs.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  accountCard: { alignItems: 'center', borderRadius: radii.xl, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  accountDesc: { fontSize: font.sizes.xs, marginTop: 2 },
  accountHandle: { fontSize: font.sizes.xs },
  accountHead: { alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between' },
  accountInfo: { flex: 1, gap: 2 },
  accountMeta: { flexWrap: 'wrap', gap: spacing.md, marginTop: 2 },
  accountName: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  actionBtn: { alignItems: 'center', borderRadius: radii.lg, flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', paddingVertical: spacing.sm },
  actionBtnOutline: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flex: 1, flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', paddingVertical: spacing.sm },
  actionText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  actionTextOutline: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  actions: { gap: spacing.sm },
  cardActions: { gap: spacing.xs },
  delBtn: { padding: spacing.xs },
  loading: { flex: 1, padding: spacing.xxl },
  metaText: { fontSize: font.sizes.xs },
  sectionTitle: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  tabContent: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
});
