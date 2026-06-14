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
import { useFocusEffect } from '@react-navigation/native';
import { Zap, Sparkles, Power, Trash2, Coins, Plus, Pencil } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Badge } from '../components/Badge';
import { StatusActions } from '../components/StatusActions';
import { EmptyState } from '../components/EmptyState';
import { CreatePlanModal } from '../modals/CreatePlanModal';
import { CreateTokenPackageModal } from '../modals/CreateTokenPackageModal';
import {
  fetchSubscriptionPlans,
  deleteSubscriptionPlan,
  toggleSubscriptionPlanActive,
  toggleSubscriptionPlanTrial,
  fetchTokenPackages,
  deleteTokenPackage,
  toggleTokenPackageActive,
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
  const { isRTL } = useLocale();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPlan, setEditPlan] = useState<SubscriptionPlan | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setPlans(await fetchSubscriptionPlans());
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const handleDelete = (p: SubscriptionPlan) =>
    confirmDestructive(t('Delete Plan'), t('Are you sure? This action cannot be undone.'), async () => {
      try { await deleteSubscriptionPlan(p._id); load(); }
      catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
    }, t('Delete'));

  const handleToggleActive = async (p: SubscriptionPlan) => {
    try { await toggleSubscriptionPlanActive(p._id); load(); }
    catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
  };

  const handleToggleTrial = async (p: SubscriptionPlan) => {
    try { await toggleSubscriptionPlanTrial(p._id); load(); }
    catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
  };

  const openEdit = (p: SubscriptionPlan) => { setEditPlan(p); setModalOpen(true); };
  const openCreate = () => { setEditPlan(null); setModalOpen(true); };

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
            const price = p.pricing?.[0] ? `${p.pricing[0].price} / ${p.pricing[0].interval}` : t('N/A');
            return (
              <View key={p._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Zap size={18} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{p.name}</Text>
                  </View>
                  <StatusActions actions={[
                    { label: t('Edit'), icon: <Pencil size={16} color={colors.primary} />, onPress: () => openEdit(p) },
                    { label: p.is_active ? t('Deactivate Plan') : t('Activate Plan'), icon: <Power size={16} color="#F59E0B" />, onPress: () => handleToggleActive(p) },
                    { label: p.trial?.is_active ? t('Stop Free Trial') : t('Start Free Trial'), icon: <Sparkles size={16} color="#3B82F6" />, onPress: () => handleToggleTrial(p) },
                    { label: t('Delete'), icon: <Trash2 size={16} color="#EF4444" />, onPress: () => handleDelete(p), destructive: true },
                  ]} />
                </View>

                <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.price, { color: colors.ink }]}>{price}</Text>
                  <Badge label={p.is_active ? t('Active') : t('Inactive')} variant={p.is_active ? 'success' : 'default'} />
                </View>

                <Text style={[styles.trial, { color: colors.textMuted, textAlign: align }]}>
                  {t('Trial')}: {p.trial?.trial_days || 0} {t('days')} · {p.trial?.is_active ? t('Active') : t('Inactive')}
                </Text>

                {!!p.features?.length && (
                  <View style={styles.features}>
                    {p.features.slice(0, 4).map((f, i) => (
                      <View key={i} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <View style={[styles.dot, { backgroundColor: colors.primary }]} />
                        <Text style={[styles.featureText, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>
                          {f.plan_feature?.title || f.feature_type?.title || t('Feature')}
                        </Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })
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

      <CreatePlanModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
        plan={editPlan}
      />
    </>
  );
}

// ===== AI Token Packages tab =====
function AIPlansTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editPkg, setEditPkg] = useState<TokenPackage | null>(null);

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
    try { await toggleTokenPackageActive(pkg._id, !!pkg.is_active); load(); }
    catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
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
          <EmptyState title={t('No packages')} message={t('No items to display')} icon="✨" />
        ) : (
          packages.map((pkg) => (
            <View key={pkg._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Sparkles size={18} color="#8B5CF6" />
                  <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{pkg.name}</Text>
                </View>
                <StatusActions actions={[
                  { label: t('Edit'), icon: <Pencil size={16} color={colors.primary} />, onPress: () => openEdit(pkg) },
                  { label: pkg.is_active ? t('Deactivate') : t('Activate'), icon: <Power size={16} color="#F59E0B" />, onPress: () => handleToggle(pkg) },
                  { label: t('Delete'), icon: <Trash2 size={16} color="#EF4444" />, onPress: () => handleDelete(pkg), destructive: true },
                ]} />
              </View>

              <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Coins size={15} color="#F59E0B" />
                  <Text style={[styles.price, { color: colors.ink }]}>{(pkg.tokens ?? 0).toLocaleString()}</Text>
                </View>
                <Badge label={pkg.is_active ? t('Active') : t('Inactive')} variant={pkg.is_active ? 'success' : 'default'} />
              </View>

              {!!pkg.price_label && (
                <Text style={[styles.trial, { color: colors.textMuted, textAlign: align }]}>{pkg.price_label}</Text>
              )}

              {!!pkg.features?.length && (
                <View style={styles.features}>
                  {pkg.features.slice(0, 4).map((f, i) => (
                    <View key={i} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <View style={[styles.dot, { backgroundColor: '#8B5CF6' }]} />
                      <Text style={[styles.featureText, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[styles.fab, { backgroundColor: '#8B5CF6' }]}
        onPress={openCreate}
        activeOpacity={0.85}
      >
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>

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

  const tabs = [
    { name: 'SubscriptionPlans', component: SubscriptionPlansTab, icon: Zap, title: t('Subscription Plans') },
    { name: 'AITokenPlans', component: AIPlansTab, icon: Sparkles, title: t('AI Token Plans') },
  ] as const;

  return (
    <View style={styles.container}>
      <Tab.Navigator
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
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 100 },
  dot: { borderRadius: radii.full, height: 6, marginTop: 6, width: 6 },
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
  featureRow: { alignItems: 'flex-start', gap: spacing.xs },
  featureText: { flex: 1, fontSize: font.sizes.sm },
  features: { gap: spacing.xs },
  loading: { marginTop: spacing.xxl },
  metaRow: { alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  titleRow: { alignItems: 'center', flex: 1, gap: spacing.xs },
  trial: { fontSize: font.sizes.xs },
});
