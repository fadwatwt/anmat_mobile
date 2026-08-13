import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Zap, Sparkles, Leaf, Languages, Check, X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { StatusActions } from '../components/StatusActions';
import { EmptyState } from '../components/EmptyState';
import { TranslateModal } from '../modals/TranslateModal';
import { fetchSubscriptionPlans, SubscriptionPlan, TokenPackage, fetchTokenPackages } from '../services/plans';
import { Industry, fetchIndustries } from '../services/industries';
import { fetchPlanTranslations, fetchIndustryTranslations, fetchTokenPackageTranslations } from '../services/translations';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

function TranslationBadge({ has }: { has: boolean }) {
  return (
    <View style={[styles.badge, has ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEE2E5', borderWidth: 1, borderColor: '#FECDD3' }]}>
      {has ? <Check size={10} color="#16A34A" /> : <X size={10} color="#DC2626" />}
    </View>
  );
}

// ===== Subscription Plans tab =====
function SubscriptionPlansTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [translationMap, setTranslationMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canUpdate = has('admin.subscription_plans.update');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchSubscriptionPlans();
      setPlans(data);
      const map: Record<string, string[]> = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const trs = await fetchPlanTranslations(p._id);
            map[p._id] = trs.map((tr) => tr.locale);
          } catch {
            map[p._id] = [];
          }
        }),
      );
      setTranslationMap(map);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.ink, textAlign: align }]}>{t('Subscription Plans Translations')}</Text>

        {plans.length === 0 ? (
          <EmptyState title={t('No plans')} message={t('No items to display')} icon="⚡" />
        ) : (
          plans.map((p) => {
            const locs = translationMap[p._id] || [];
            const price = p.pricing?.[0] ? `${p.pricing[0].price} / ${p.pricing[0].interval}` : t('N/A');
            return (
              <View key={p._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Zap size={18} color={colors.primary} />
                    <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{p.name}</Text>
                  </View>
                  <StatusActions actions={canUpdate ? [
                    { label: t('Translate'), icon: <Languages size={16} color="#3B82F6" />, onPress: () => { setSelectedPlan(p); setModalOpen(true); } },
                  ] : []} />
                </View>
                <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.price, { color: colors.ink }]}>{price}</Text>
                  <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.badgeLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>{t('Arabic')}</Text>
                      <TranslationBadge has={locs.includes('ar')} />
                    </View>
                    <View style={[styles.badgeLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>{t('English')}</Text>
                      <TranslationBadge has={locs.includes('en')} />
                    </View>
                  </View>
                  <Badge label={p.is_active ? t('Active') : t('Inactive')} variant={p.is_active ? 'success' : 'default'} />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TranslateModal
        visible={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedPlan(null); }}
        onSaved={() => load()}
        kind="plan"
        item={selectedPlan}
      />
    </>
  );
}

// ===== AI Token Packages tab =====
function TokenPackagesTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [translationMap, setTranslationMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPkg, setSelectedPkg] = useState<TokenPackage | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canUpdate = has('admin.subscription_plans.update');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchTokenPackages();
      setPackages(data);
      const map: Record<string, string[]> = {};
      await Promise.all(
        data.map(async (p) => {
          try {
            const trs = await fetchTokenPackageTranslations(p._id);
            map[p._id] = trs.map((tr) => tr.locale);
          } catch {
            map[p._id] = [];
          }
        }),
      );
      setTranslationMap(map);
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.ink, textAlign: align }]}>{t('AI Token Packages Translations')}</Text>

        {packages.length === 0 ? (
          <EmptyState title={t('No packages')} message={t('No items to display')} icon="✨" />
        ) : (
          packages.map((pkg) => {
            const locs = translationMap[pkg._id] || [];
            return (
              <View key={pkg._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Sparkles size={18} color="#8B5CF6" />
                    <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{pkg.name}</Text>
                  </View>
                  <StatusActions actions={canUpdate ? [
                    { label: t('Translate'), icon: <Languages size={16} color="#3B82F6" />, onPress: () => { setSelectedPkg(pkg); setModalOpen(true); } },
                  ] : []} />
                </View>
                <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.price, { color: colors.ink }]}>{(pkg.tokens ?? 0).toLocaleString()}</Text>
                  {!!pkg.price_label && <Text style={[styles.price, { color: colors.ink }]}>{pkg.price_label}</Text>}
                  <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.badgeLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>{t('Arabic')}</Text>
                      <TranslationBadge has={locs.includes('ar')} />
                    </View>
                    <View style={[styles.badgeLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>{t('English')}</Text>
                      <TranslationBadge has={locs.includes('en')} />
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TranslateModal
        visible={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedPkg(null); }}
        onSaved={() => load()}
        kind="package"
        item={selectedPkg}
      />
    </>
  );
}

// ===== Industries tab =====
function IndustriesTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [translationMap, setTranslationMap] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canUpdate = has('admin.industries.update');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const response = await fetchIndustries();
      setIndustries(response);
      const map: Record<string, string[]> = {};
      await Promise.all(
        response.map(async (ind) => {
          try {
            const trs = await fetchIndustryTranslations(ind._id);
            map[ind._id] = trs.map((tr) => tr.locale);
          } catch {
            map[ind._id] = [];
          }
        }),
      );
      setTranslationMap(map);
    } catch {
      setIndustries([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: colors.ink, textAlign: align }]}>{t('Industries Translations')}</Text>

        {industries.length === 0 ? (
          <EmptyState title={t('No industries')} message={t('No items to display')} icon="🌿" />
        ) : (
          industries.map((ind) => {
            const locs = translationMap[ind._id] || [];
            return (
              <View key={ind._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Leaf size={18} color="#22C55E" />
                    <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>{ind.name}</Text>
                  </View>
                  <StatusActions actions={canUpdate ? [
                    { label: t('Translate'), icon: <Languages size={16} color="#3B82F6" />, onPress: () => { setSelectedIndustry(ind); setModalOpen(true); } },
                  ] : []} />
                </View>
                <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.price, { color: colors.ink }]}>{ind.organizations_count ?? 0} {t('organizations')}</Text>
                  <View style={[styles.badgeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={[styles.badgeLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>{t('Arabic')}</Text>
                      <TranslationBadge has={locs.includes('ar')} />
                    </View>
                    <View style={[styles.badgeLabel, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Text style={[styles.badgeText, { color: colors.textMuted }]}>{t('English')}</Text>
                      <TranslationBadge has={locs.includes('en')} />
                    </View>
                  </View>
                  <Badge label={ind.is_allowed ? t('Allowed') : t('Not allowed')} variant={ind.is_allowed ? 'success' : 'default'} />
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      <TranslateModal
        visible={modalOpen}
        onClose={() => { setModalOpen(false); setSelectedIndustry(null); }}
        onSaved={() => load()}
        kind="industry"
        item={selectedIndustry}
      />
    </>
  );
}

export default function TranslationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { permissions } = useAuth();

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const canViewPlans = has('admin.subscription_plans.list');
  const canViewIndustries = has('admin.industries.list');

  const tabs = [] as { name: string; component: React.ComponentType<any>; icon: React.ComponentType<any>; title: string }[];
  if (canViewPlans) {
    tabs.push({ name: 'SubscriptionPlans', component: SubscriptionPlansTab, icon: Zap, title: t('Subscription Plans') });
    tabs.push({ name: 'AITokenPlans', component: TokenPackagesTab, icon: Sparkles, title: t('AI Token Plans') });
  }
  if (canViewIndustries) {
    tabs.push({ name: 'Industries', component: IndustriesTab, icon: Leaf, title: t('Industries') });
  }

  if (tabs.length === 0) {
    return (
      <View style={[styles.container, styles.center]}>
        <EmptyState title={t('No access')} message={t('You do not have permission to view translations.')} icon="🌐" />
      </View>
    );
  }

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

// ===== Style definitions =====
const styles = StyleSheet.create({
  badge: { alignItems: 'center', borderRadius: radii.full, height: 16, justifyContent: 'center', paddingHorizontal: 4, width: 16 },
  badgeLabel: { alignItems: 'center', gap: 4 },
  badgeRow: { alignItems: 'center', gap: spacing.md },
  badgeText: { fontSize: font.sizes.xs },
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { flex: 1, fontSize: font.sizes.base, fontWeight: font.weights.bold },
  center: { alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 100 },
  loading: { marginTop: spacing.xxl },
  metaRow: { alignItems: 'center', justifyContent: 'space-between' },
  price: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  title: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  titleRow: { alignItems: 'center', flex: 1, gap: spacing.xs },
});
