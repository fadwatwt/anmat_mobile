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
import { useFocusEffect, useRoute } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import {
  Building2,
  Users,
  HardDrive,
  Bird,
  Sparkles,
  Power,
  TrendingUp,
  RefreshCw,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Badge } from '../components/Badge';
import { StatusActions } from '../components/StatusActions';
import { IncreaseFeaturesModal } from '../modals/IncreaseFeaturesModal';
import { SetSocialMediaQuotaModal } from '../modals/SetSocialMediaQuotaModal';
import {
  fetchSubscriberById,
  fetchSubscriberSubscriptions,
  fetchSubscriberSocialQuota,
  toggleSubscriberActivation,
  updateSubscriptionStatus,
  Subscriber,
  Subscription,
  SubscriberSocialQuota,
} from '../services/subscribers';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const SUB_STATUSES = ['active', 'inactive', 'terminated', 'expired', 'cancelled'];

function statusVariant(s?: string): 'success' | 'warning' | 'danger' | 'default' {
  if (s === 'active') return 'success';
  if (s === 'inactive' || s === 'expired') return 'warning';
  if (s === 'terminated' || s === 'cancelled') return 'danger';
  return 'default';
}

function fmtDate(d?: string): string {
  if (!d) return '—';
  const date = new Date(d);
  return isNaN(date.getTime()) ? d : date.toLocaleDateString();
}

function daysBetween(a?: string, b?: string): number | null {
  if (!a || !b) return null;
  const start = new Date(a).getTime();
  const end = new Date(b).getTime();
  if (isNaN(start) || isNaN(end)) return null;
  return Math.max(0, Math.round((end - start) / 86400000));
}

export function SubscriberDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const route = useRoute<any>();
  const subscriberId = route.params?.subscriber_id as string;

  const [subscriber, setSubscriber] = useState<Subscriber | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [quota, setQuota] = useState<SubscriberSocialQuota | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [featuresModal, setFeaturesModal] = useState(false);
  const [quotaModal, setQuotaModal] = useState(false);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [sub, subs, q] = await Promise.all([
        fetchSubscriberById(subscriberId).catch(() => null),
        fetchSubscriberSubscriptions(subscriberId).catch(() => []),
        fetchSubscriberSocialQuota(subscriberId).catch(() => null),
      ]);
      setSubscriber(sub);
      setSubscriptions(subs);
      setQuota(q);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subscriberId]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  // Most recent subscription = "current".
  const current = subscriptions[0];

  const handleToggleActivation = () => {
    if (!subscriber) return;
    Alert.alert(t('Toggle Status'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Confirm'),
        onPress: async () => {
          try { await toggleSubscriberActivation(subscriber._id); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const handleChangeStatus = () => {
    if (!current) return;
    Alert.alert(
      t('Update Subscription Status'),
      '',
      [
        ...SUB_STATUSES.map((s) => ({
          text: t(s.charAt(0).toUpperCase() + s.slice(1)),
          onPress: async () => {
            try { await updateSubscriptionStatus(current._id, s); load(); }
            catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
          },
        })),
        { text: t('Cancel'), style: 'cancel' as const },
      ],
    );
  };

  if (loading) return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;
  if (!subscriber) {
    return (
      <View style={styles.loading}>
        <Text style={{ color: colors.textMuted }}>{t('No subscribers found')}</Text>
      </View>
    );
  }

  const org = subscriber.organization;
  const usedStorageMB = org?.used_storage ? Math.round(org.used_storage / (1024 * 1024)) : 0;
  const storageLimit = subscriber.plan_limits?.storage?.maxBytes;
  const employeeLimit = subscriber.plan_limits?.employees?.max;
  const planPricing = current?.plan_id?.pricing?.[0];

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={[styles.row, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'left' : 'right' }]} numberOfLines={2}>{value ?? '—'}</Text>
    </View>
  );

  return (
    <>
      <ScrollView
        style={{ backgroundColor: colors.background }}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Building2 size={20} color={colors.primary} />
              <Text style={[styles.name, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                {subscriber.name || subscriber.email || '—'}
              </Text>
            </View>
            <Badge label={subscriber.is_active ? t('Active') : t('Inactive')} variant={subscriber.is_active ? 'success' : 'danger'} />
          </View>
          <Row label={t('Email')} value={subscriber.email} />
          <Row label={t('Phone')} value={subscriber.phone} />
          <Row label={t('Joined')} value={fmtDate(subscriber.createdAt)} />
        </View>

        {/* Organization */}
        {org && (
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Organization')}</Text>
            <Row label={t('Company Name')} value={org.name} />
            <Row label={t('Website')} value={org.website} />
            <Row label={t('Industry')} value={org.industry?.name} />
            <Row label={t('Country')} value={org.country} />
            <Row label={t('City')} value={org.city} />
          </View>
        )}

        {/* Resource usage */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Resource Usage')}</Text>
          <UsageRow icon={<Users size={16} color="#3B82F6" />} label={t('Employees')} used={subscriber.total_users ?? 0} limit={employeeLimit} />
          <UsageRow icon={<HardDrive size={16} color="#10B981" />} label={t('Storage (MB)')} used={usedStorageMB} limit={storageLimit} />
          <UsageRow icon={<Bird size={16} color="#1DA1F2" />} label={t('Twitter Accounts')} used={quota?.used ?? 0} limit={quota?.unlimited ? t('Unlimited') : quota?.limit} />
        </View>

        {/* Subscription */}
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Subscription')}</Text>
            {current && (
              <StatusActions actions={[
                { label: t('Update Subscription Status'), icon: <RefreshCw size={16} color={colors.primary} />, onPress: handleChangeStatus },
                { label: t('Increase Features'), icon: <TrendingUp size={16} color="#10B981" />, onPress: () => setFeaturesModal(true) },
                { label: t('Set Social Media Quota'), icon: <Sparkles size={16} color="#8B5CF6" />, onPress: () => setQuotaModal(true) },
                { label: subscriber.is_active ? t('Deactivate Account') : t('Activate Account'), icon: <Power size={16} color="#F59E0B" />, onPress: handleToggleActivation },
              ]} />
            )}
          </View>

          {!current ? (
            <Text style={[styles.empty, { color: colors.textMuted }]}>{t('No active subscription')}</Text>
          ) : (
            <>
              <View style={[styles.subHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.planName, { color: colors.ink, textAlign: align }]}>{current.plan_id?.name || '—'}</Text>
                <Badge label={t((current.status || '').charAt(0).toUpperCase() + (current.status || '').slice(1)) || '—'} variant={statusVariant(current.status)} />
              </View>
              <Row label={t('Price')} value={planPricing?.price != null ? `$${planPricing.price}` : '—'} />
              {!!planPricing?.discount && <Row label={t('Discount')} value={`${planPricing.discount}%`} />}
              <Row label={t('Subscription Date')} value={fmtDate(current.starts_at)} />
              <Row label={t('Duration')} value={daysBetween(current.starts_at, current.expires_at) != null ? `${daysBetween(current.starts_at, current.expires_at)} ${t('days')}` : '—'} />

              {/* Features */}
              {!!current.plan_id?.features?.length && (
                <View style={styles.featuresBlock}>
                  <Text style={[styles.featuresTitle, { color: colors.textMuted, textAlign: align }]}>{t('Features')}</Text>
                  {current.plan_id.features.map((f, i) => {
                    const title = typeof f.feature_type_id === 'object' ? f.feature_type_id?.title : '';
                    const props = (f.properties || []).map((p) => `${p.key}: ${p.value}`).join(', ');
                    return (
                      <Text key={i} style={[styles.featureItem, { color: colors.ink, textAlign: align }]}>
                        • {title || t('Feature')}{props ? ` (${props})` : ''}
                      </Text>
                    );
                  })}
                </View>
              )}

              {/* Applied overrides */}
              {!!current.extra_features?.length && (
                <View style={styles.featuresBlock}>
                  <Text style={[styles.featuresTitle, { color: '#10B981', textAlign: align }]}>{t('Applied Overrides')}</Text>
                  {current.extra_features.map((f, i) => {
                    const title = typeof f.feature_type_id === 'object' ? f.feature_type_id?.title : '';
                    const props = (f.properties || []).map((p) => `${p.key}: ${p.value}`).join(', ');
                    return (
                      <Text key={i} style={[styles.featureItem, { color: colors.ink, textAlign: align }]}>
                        • {title || t('Feature')}{props ? ` (${props})` : ''}
                      </Text>
                    );
                  })}
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>

      {current && (
        <IncreaseFeaturesModal
          visible={featuresModal}
          onClose={() => setFeaturesModal(false)}
          onSaved={() => { setFeaturesModal(false); load(); }}
          subscriptionId={current._id}
          currentExtraFeatures={current.extra_features}
        />
      )}
      <SetSocialMediaQuotaModal
        visible={quotaModal}
        onClose={() => setQuotaModal(false)}
        onSaved={() => { setQuotaModal(false); load(); }}
        subscriberId={subscriber._id}
        currentQuota={quota}
      />
    </>
  );
}

function UsageRow({ icon, label, used, limit }: { icon: React.ReactNode; label: string; used: number; limit?: number | string }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const limitText = limit == null ? t('Unlimited') : String(limit);
  return (
    <View style={[styles.usageRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {icon}
        <Text style={[styles.usageLabel, { color: colors.ink }]}>{label}</Text>
      </View>
      <Text style={[styles.usageValue, { color: colors.textMuted }]}>{used} / {limitText}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.xs, padding: spacing.md },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  empty: { fontSize: font.sizes.sm, paddingVertical: spacing.md, textAlign: 'center' },
  featureItem: { fontSize: font.sizes.xs, lineHeight: 18 },
  featuresBlock: { gap: 2, marginTop: spacing.sm },
  featuresTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.bold, marginBottom: 2 },
  headerRow: { alignItems: 'center', justifyContent: 'space-between' },
  loading: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.xxl },
  name: { flex: 1, fontSize: font.sizes.base, fontWeight: font.weights.bold },
  planName: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  row: { borderBottomWidth: StyleSheet.hairlineWidth, gap: spacing.sm, justifyContent: 'space-between', paddingVertical: spacing.sm },
  rowLabel: { flex: 1, fontSize: font.sizes.xs },
  rowValue: { flex: 1.4, fontSize: font.sizes.sm },
  sectionTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.bold, marginBottom: spacing.xs },
  subHead: { alignItems: 'center', gap: spacing.sm, justifyContent: 'space-between', marginBottom: spacing.xs },
  titleRow: { alignItems: 'center', flex: 1, gap: spacing.xs },
  usageLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  usageRow: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, justifyContent: 'space-between', paddingVertical: spacing.sm },
  usageValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
