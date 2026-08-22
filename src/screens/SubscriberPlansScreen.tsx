import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Zap, CheckCircle, Shield, Clock } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { fetchSubscriberSubscriptionPlans, SubscriptionPlan, PlanPricing } from '../services/plans';
import { font, radii, spacing } from '../theme';

const getFeatureTitle = (feature: any): string =>
  feature?.plan_feature?.title ||
  feature?.feature_type?.title ||
  feature?.feature_type_id?.title ||
  feature?.title ||
  '';

const getFeatureValue = (feature: any): string => {
  const propValues = (feature?.properties || []).map((p: any) => p.value);
  const hasFormattedValue = propValues.some(
    (v: any) => typeof v === 'string' && v.trim() !== '' && isNaN(Number(v)),
  );
  if (hasFormattedValue) return propValues.join(' · ');
  const details = feature?.plan_feature?.details || feature?.details || '';
  if (details && /\d/.test(details) && details.length < 40) return details;
  return propValues.join(' · ');
};

export default function SubscriberPlansScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { logout } = useAuth();
  const navigation = useNavigation<any>();
  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInterval, setSelectedInterval] = useState<'month' | 'year'>('month');

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const data = await fetchSubscriberSubscriptionPlans();
      setPlans(data.filter((p) => p.is_active));
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const getPricingForInterval = (plan: SubscriptionPlan): PlanPricing | undefined => {
    return plan.pricing?.find(
      (p) => p.interval === selectedInterval && p.is_active !== false,
    ) || plan.pricing?.[0];
  };

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('Loading plans...')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} tintColor={colors.primary} />}
    >
      <View style={styles.header}>
        <Text style={[styles.label, { color: colors.primary }]}>{t('Pricing Plans')}</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{t('Flexible plans for every team')}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {t('Choose the plan that suits your team size and requirements. All plans include 30 days free trial.')}
        </Text>
      </View>

      <View style={[styles.intervalToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.intervalBtn,
            selectedInterval === 'month' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setSelectedInterval('month')}
        >
          <Text style={[
            styles.intervalText,
            { color: selectedInterval === 'month' ? '#FFF' : colors.textSecondary },
          ]}>{t('Monthly')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.intervalBtn,
            selectedInterval === 'year' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setSelectedInterval('year')}
        >
          <Text style={[
            styles.intervalText,
            { color: selectedInterval === 'year' ? '#FFF' : colors.textSecondary },
          ]}>{t('Yearly')}</Text>
        </TouchableOpacity>
      </View>

      {plans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Zap size={48} color={colors.textMuted} />
          <Text style={[styles.emptyTitle, { color: colors.textMuted }]}>{t('No plans available')}</Text>
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No plans to display')}</Text>
        </View>
      ) : (
        plans.map((plan) => {
          const pricing = getPricingForInterval(plan);
          const trial = plan.trial;
          const features = plan.features || [];

          return (
            <View key={plan._id} style={[styles.planCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {trial?.is_active && trial.trial_days ? (
                <View style={[styles.trialBadge, { backgroundColor: colors.warningBg, borderColor: colors.warning }]}>
                  <Clock size={12} color={colors.warning} />
                  <Text style={[styles.trialText, { color: colors.warningText }]}>
                    {t('{{days}} days free trial', { days: trial.trial_days })}
                  </Text>
                </View>
              ) : null}

              <View style={styles.planHeader}>
                <View style={[styles.planIcon, { backgroundColor: colors.primaryLight }]}>
                  <Zap size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: colors.ink }]}>{plan.name}</Text>
                  {plan.description ? (
                    <Text style={[styles.planDesc, { color: colors.textSecondary }]} numberOfLines={2}>{plan.description}</Text>
                  ) : null}
                </View>
              </View>

              {pricing ? (
                <View style={[styles.priceSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.price, { color: colors.ink }]}>${pricing.price}</Text>
                  <View>
                    <Text style={[styles.pricePeriod, { color: colors.textMuted }]}>
                      /{pricing.interval === 'month' ? t('mth') : t('yr')}
                    </Text>
                    {(pricing.discount ?? 0) > 0 ? (
                      <Text style={[styles.discount, { color: '#16A34A' }]}>
                        {t('Save {{discount}}%', { discount: pricing.discount })}
                      </Text>
                    ) : null}
                  </View>
                </View>
              ) : null}

              {features.length > 0 ? (
                <View style={[styles.featuresSection, { borderTopColor: colors.border }]}>
                  <Text style={[styles.featuresLabel, { color: colors.ink }]}>{t('Whats included:')}</Text>
                  {features.map((f, i) => {
                    const title = getFeatureTitle(f);
                    const value = getFeatureValue(f);
                    return (
                      <View key={i} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <CheckCircle size={18} color={colors.primary} style={{ marginTop: 2 }} />
                        <Text style={[styles.featureText, { color: colors.textSecondary, textAlign: align }]}>
                          {title}{value ? `: ${value}` : ''}
                        </Text>
                      </View>
                    );
                  })}
                </View>
              ) : null}

              <TouchableOpacity
                style={[styles.subscribeBtn, { backgroundColor: colors.primary }]}
                activeOpacity={0.85}
                onPress={() => {
                  if (!pricing) return;
                  navigation.navigate('StripePayment', {
                    planId: plan._id,
                    priceId: pricing._id || plan._id,
                    planName: plan.name,
                    amount: pricing.price,
                    interval: pricing.interval,
                    trialDays: trial?.is_active ? trial.trial_days : undefined,
                  });
                }}
              >
                <Text style={styles.subscribeBtnText}>
                  {t('Get started with')} {plan.name}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Text style={[styles.logoutText, { color: colors.danger }]}>{t('Sign Out')}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  contentContainer: { padding: spacing.md, paddingBottom: spacing.xxl * 2 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: spacing.md, fontSize: font.sizes.sm },

  header: { alignItems: 'center', marginBottom: spacing.xl, paddingTop: spacing.xl },
  label: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 2, marginBottom: spacing.xs },
  title: { fontSize: font.sizes.xxl, fontWeight: '800', textAlign: 'center', marginBottom: spacing.sm },
  subtitle: { fontSize: font.sizes.sm, textAlign: 'center', lineHeight: 20, paddingHorizontal: spacing.md },

  intervalToggle: {
    flexDirection: 'row',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 3,
    marginBottom: spacing.xl,
  },
  intervalBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  intervalText: { fontSize: font.sizes.sm, fontWeight: '600' },

  planCard: {
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    overflow: 'hidden',
  },

  trialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.md,
  },
  trialText: { fontSize: 10, fontWeight: '700' },

  planHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planName: { fontSize: font.sizes.lg, fontWeight: '800', marginBottom: 2 },
  planDesc: { fontSize: font.sizes.xs, lineHeight: 18 },

  priceSection: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.xs,
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginBottom: spacing.md,
  },
  price: { fontSize: 30, fontWeight: '900' },
  pricePeriod: { fontSize: font.sizes.xs },
  discount: { fontSize: 10, fontWeight: '700', marginTop: 2 },

  featuresSection: {
    borderTopWidth: 1,
    paddingTop: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  featuresLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.5 },
  featureRow: { alignItems: 'flex-start', gap: spacing.sm },
  featureText: { flex: 1, fontSize: font.sizes.sm, lineHeight: 20 },

  subscribeBtn: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  subscribeBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: '700' },

  emptyContainer: { alignItems: 'center', paddingVertical: spacing.xxl * 2, gap: spacing.sm },
  emptyTitle: { fontSize: font.sizes.base, fontWeight: '700' },
  emptyText: { fontSize: font.sizes.sm },

  logoutBtn: { alignItems: 'center', paddingVertical: spacing.xl },
  logoutText: { fontSize: font.sizes.sm, fontWeight: '600' },
});
