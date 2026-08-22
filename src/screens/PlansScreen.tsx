import React, { useCallback, useState } from 'react';
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
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { Zap, Sparkles, Power, Trash2, Coins, Plus, Pencil, Languages } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Badge } from '../components/Badge';
import { StatusActions } from '../components/StatusActions';
import { EmptyState } from '../components/EmptyState';
import { CreatePlanModal } from '../modals/CreatePlanModal';
import { CreateTokenPackageModal } from '../modals/CreateTokenPackageModal';
import { PlanTranslationsModal } from '../modals/PlanTranslationsModal';
import {
  fetchSubscriptionPlans,
  fetchPublicSubscriptionPlans,
  deleteSubscriptionPlan,
  toggleSubscriptionPlanActive,
  toggleSubscriptionPlanTrial,
  fetchTokenPackages,
  deleteTokenPackage,
  toggleTokenPackageActive,
  seedTokenPackages,
  SubscriptionPlan,
  TokenPackage,
} from '../services/plans';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

function confirmDestructive(title: string, message: string, onConfirm: () => void, confirmLabel: string) {
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: 'destructive', onPress: onConfirm },
  ]);
}

// ===== Subscription Plans tab =====
function SubscriptionPlansTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL, locale } = useLocale();
  const { permissions, user } = useAuth();
  const isSubscriber = user?.type === 'Subscriber';
  const needsPublicPlans = isSubscriber && user?.has_subscription_access === false;
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);
  const [translationsOpen, setTranslationsOpen] = useState(false);
  const [translatePlan, setTranslatePlan] = useState<SubscriptionPlan | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canCreate = has('admin.subscription_plans.create');
  const canUpdate = has('admin.subscription_plans.update');
  const canDelete = has('admin.subscription_plans.delete');
  const canToggleActivity = has('admin.subscription_plans.toggle_activity');
  const canManageTrial = has('admin.subscription_plans.manage_trial');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setPlans(needsPublicPlans ? await fetchPublicSubscriptionPlans() : await fetchSubscriptionPlans());
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [needsPublicPlans]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const formatDate = (iso: string | undefined) => {
    if (!iso) return '--';
    try {
      const d = new Date(iso);
      if (Number.isNaN(d.getTime())) return '--';
      return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' });
    } catch {
      return '--';
    }
  };

  const handleDelete = (p: SubscriptionPlan) =>
    confirmDestructive(t('Delete Plan'), t('Are you sure? This action cannot be undone.'), async () => {
      try { await deleteSubscriptionPlan(p._id); load(); }
      catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
    }, t('Delete'));

  const handleToggleActive = (p: SubscriptionPlan) => {
    Alert.alert(p.is_active ? t('Deactivate Plan') : t('Activate Plan'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Confirm'),
        onPress: async () => {
          try { await toggleSubscriptionPlanActive(p._id); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const handleToggleTrial = (p: SubscriptionPlan) => {
    Alert.alert(p.trial?.is_active ? t('Stop Free Trial') : t('Start Free Trial'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Confirm'),
        onPress: async () => {
          try { await toggleSubscriptionPlanTrial(p._id); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const openEdit = (p: SubscriptionPlan) => { setEditPlan(p); setModalOpen(true); };
  const openCreate = () => { setEditPlan(null); setModalOpen(true); };
  const openTranslations = (p: SubscriptionPlan) => { setTranslatePlan(p); setTranslationsOpen(true); };

  if (loading) return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {plans.length === 0 ? (
          <EmptyState title={t('No plans')} message={t('No items to display')} icon="⚡" />
        ) : (
          plans.map((p) => {
            const price = p.pricing?.[0] ? `${p.pricing[0].price} / ${t(p.pricing[0].interval)}` : t('N/A');
            const actions = [];
            if (canUpdate) actions.push({ label: t('Edit'), icon: <Pencil size={16} color={colors.primary} />, onPress: () => openEdit(p) });
            if (canUpdate) actions.push({ label: t('Translations'), icon: <Languages size={16} color="#3B82F6" />, onPress: () => openTranslations(p) });
            if (canToggleActivity) actions.push({ label: p.is_active ? t('Deactivate Plan') : t('Activate Plan'), icon: <Power size={16} color="#F59E0B" />, onPress: () => handleToggleActive(p) });
            if (canManageTrial) actions.push({ label: p.trial?.is_active ? t('Stop Free Trial') : t('Start Free Trial'), icon: <Sparkles size={16} color="#3B82F6" />, onPress: () => handleToggleTrial(p) });
            if (canDelete) actions.push({ label: t('Delete'), icon: <Trash2 size={16} color="#EF4444" />, onPress: () => handleDelete(p), destructive: true });
            return (
              <View key={p._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Zap size={18} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{p.name}</Text>
                  </View>
                  <StatusActions actions={actions} />
                </View>

                <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.price, { color: colors.ink }]}>{price}</Text>
                  <Badge label={p.is_active ? t('Active') : t('Inactive')} variant={p.is_active ? 'success' : 'default'} />
                </View>

                <Text style={[styles.trial, { color: colors.textMuted, textAlign: align }]}>
                  {t('Trial')}: {p.trial?.trial_days || 0} {t('days')} · {p.trial?.is_active ? t('Active') : t('Inactive')}
                </Text>

                <Text style={[styles.createdAt, { color: colors.textMuted, textAlign: align }]}>
                  {t('Created at')}: {formatDate(p.createdAt)}
                </Text>

                {!!p.features?.length && (
                  <View style={styles.features}>
                    {p.features.slice(0, 4).map((f, i) => (
                      <View key={i} style={styles.featureBlock}>
                        <View style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                          <Text style={[styles.featureText, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>
                            {f.plan_feature?.title || f.feature_type?.title || t('Feature')}
                          </Text>
                        </View>
                        {!!f.properties?.length && (
                          <View style={[styles.chips, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            {f.properties.map((prop, pi) => (
                              <View key={pi} style={[styles.chip, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                                <Text style={[styles.chipText, { color: colors.textMuted }]}>{prop.key}:</Text>
                                <Text style={[styles.chipValue, { color: colors.primary }]}>{prop.value}</Text>
                              </View>
                            ))}
                          </View>
                        )}
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {canCreate && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      <CreatePlanModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
        plan={editPlan}
      />
      <PlanTranslationsModal
        visible={translationsOpen}
        plan={translatePlan}
        onClose={() => { setTranslationsOpen(false); setTranslatePlan(null); }}
        onSaved={load}
      />
    </>
  );
}

// ===== AI Token Packages tab =====
function AIPlansTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<TokenPackage | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canCreate = has('admin.subscription_plans.create');
  const canUpdate = has('admin.subscription_plans.update');
  const canDelete = has('admin.subscription_plans.delete');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setPackages(await fetchTokenPackages());
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const handleDelete = (pkg: TokenPackage) =>
    confirmDestructive(t('Delete Package'), t('Are you sure? This action cannot be undone.'), async () => {
      try { await deleteTokenPackage(pkg._id); load(); }
      catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
    }, t('Delete'));

  const handleToggle = async (pkg: TokenPackage) => {
    Alert.alert(pkg.is_active ? t('Deactivate Package') : t('Activate Package'), `${t('Are you sure you want to')} ${pkg.is_active ? t('deactivate') : t('activate')} "${pkg.name}"?`, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Confirm'),
        onPress: async () => {
          try { await toggleTokenPackageActive(pkg._id, !!pkg.is_active); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const handleSeed = async () => {
    Alert.alert(t('Seed Default Packages'), t('Are you sure you want to seed the default packages?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Seed'),
        onPress: async () => {
          setSeeding(true);
          try {
            await seedTokenPackages();
            load();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          } finally {
            setSeeding(false);
          }
        },
      },
    ]);
  };

  const openEdit = (pkg: TokenPackage) => { setEditPkg(pkg); setModalOpen(true); };
  const openCreate = () => { setEditPkg(null); setModalOpen(true); };

  if (loading) return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {packages.length === 0 ? (
          <>
            <EmptyState title={t('No packages')} message={t('No items to display')} icon="✨" />
            {canCreate && (
              <TouchableOpacity
                style={[styles.seedBtn, { backgroundColor: '#EDE9FE', borderColor: '#8B5CF6' }]}
                onPress={handleSeed}
                disabled={seeding}
                activeOpacity={0.85}
              >
                <Sparkles size={16} color="#8B5CF6" />
                <Text style={[styles.seedBtnText, { color: '#7C3AED' }]}>
                  {seeding ? t('Seeding...') : t('Seed Default Packages')}
                </Text>
              </TouchableOpacity>
            )}
          </>
        ) : (
          packages.map((pkg) => {
            const pkgActions = [];
            if (canUpdate) pkgActions.push({ label: t('Edit'), icon: <Pencil size={16} color={colors.primary} />, onPress: () => openEdit(pkg) });
            if (canUpdate) pkgActions.push({ label: pkg.is_active ? t('Deactivate') : t('Activate'), icon: <Power size={16} color="#F59E0B" />, onPress: () => handleToggle(pkg) });
            if (canDelete) pkgActions.push({ label: t('Delete'), icon: <Trash2 size={16} color="#EF4444" />, onPress: () => handleDelete(pkg), destructive: true });
            return (
              <View key={pkg._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Sparkles size={18} color="#8B5CF6" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{pkg.name}</Text>
                      {!!pkg.description && (
                        <Text style={[styles.trial, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{pkg.description}</Text>
                      )}
                    </View>
                  </View>
                  <StatusActions actions={pkgActions} />
                </View>

                <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Coins size={15} color="#F59E0B" />
                    <Text style={[styles.price, { color: colors.ink }]}>{(pkg.tokens ?? 0).toLocaleString()}</Text>
                  </View>
                  <Badge label={pkg.is_active ? t('Active') : t('Inactive')} variant={pkg.is_active ? 'success' : 'default'} />
                </View>

                <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.price, { color: colors.ink }]}>{pkg.price_label || '--'}</Text>
                  {!!pkg.price_cents && (
                    <Text style={[styles.trial, { color: colors.textMuted, textAlign: align }]}>
                      {(pkg.price_cents ?? 0).toLocaleString()} {t('cents')}
                    </Text>
                  )}
                </View>

                {!!pkg.sort_order && (
                  <Text style={[styles.trial, { color: colors.textMuted, textAlign: align }]}>
                    {t('Order')}: {pkg.sort_order}
                  </Text>
                )}

                {!!pkg.features?.length && (
                  <View style={styles.features}>
                    {pkg.features.slice(0, 3).map((f, i) => (
                      <View key={i} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
                        <Text style={[styles.featureText, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{f}</Text>
                      </View>
                    ))}
                    {pkg.features.length > 3 && (
                      <Text style={[styles.moreText, { color: colors.primary, textAlign: align }]}>
                        +{pkg.features.length - 3} {t('more')}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            );
          })
        )}
      </ScrollView>

      {canCreate && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: '#8B5CF6' }]}
          onPress={openCreate}
          activeOpacity={0.85}
        >
          <Plus size={22} color="#FFF" />
        </TouchableOpacity>
      )}

      <CreateTokenPackageModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
        pkg={editPkg}
      />
    </>
  );
}

export default function PlansScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const route = useRoute();
  const initialTab = (route.params as { tab?: string } | undefined)?.tab;

  const tabs = [
    { name: 'SubscriptionPlans', component: SubscriptionPlansTab, icon: Zap, title: t('Subscription Plans') },
    { name: 'AITokenPlans', component: AIPlansTab, icon: Sparkles, title: t('AI Token Plans') },
  ] as const;

  return (
    <View style={styles.container}>
      <Tab.Navigator
        initialRouteName={initialTab === 'AITokenPlans' ? 'AITokenPlans' : 'SubscriptionPlans'}
        screenOptions={({ route }) => {
          const cfg = tabs.find((tb) => tb.name === route.name);
          return {
            tabBarLabel: cfg?.title,
            tabBarIcon: ({ color }: { color: string }) => {
              const Icon = cfg?.icon;
              return Icon ? <Icon size={18} color={color} strokeWidth={2} /> : <></>;
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0 },
            tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const, textTransform: 'none' as const },
            tabBarScrollEnabled: true,
            tabBarItemStyle: { width: 'auto', minWidth: 80, paddingHorizontal: spacing.xs },
            sceneStyle: { backgroundColor: colors.background },
            headerShown: false,
          };
        }}
      >
        {tabs.map(({ name, component }) => (
          <Tab.Screen key={name} name={name} component={component} />
        ))}
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: font.sizes.base, fontWeight: font.weights.bold },
  chip: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  chipValue: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  chips: { flexWrap: 'wrap', gap: spacing.xs },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 100 },
  createdAt: { fontSize: font.sizes.xs },
  dot: { borderRadius: radii.full, height: 6, marginTop: 6, width: 6 },
  fab: {
    alignItems: 'center',
    borderRadius: radii.full,
    bottom: spacing.xl,
    elevation: 4,
    height: 44,
    justifyContent: 'center',
    position: 'absolute',
    end: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    width: 44,
  },
  featureBlock: { gap: spacing.xs },
  featureRow: { alignItems: 'flex-start', gap: spacing.xs },
  featureText: { flex: 1, fontSize: font.sizes.sm },
  features: { gap: spacing.sm },
  loading: { marginTop: spacing.xxl },
  metaRow: { alignItems: 'center', justifyContent: 'space-between' },
  moreText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  price: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  seedBtn: {
    alignItems: 'center',
    alignSelf: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  seedBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  titleRow: { alignItems: 'center', flex: 1, gap: spacing.xs },
  trial: { fontSize: font.sizes.xs },
});
