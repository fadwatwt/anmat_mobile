import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import {
  Diamond,
  Zap,
  Calendar,
  CreditCard,
  Users,
  HardDrive,
  CheckCircle,
  XCircle,
  Power,
  Ban,
  RefreshCw,
  Plus,
  Pencil,
  Star,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import { StatusActions } from '../components/StatusActions';
import { EmptyState } from '../components/EmptyState';
import { http } from '../lib/http';
import { ApiResponse, SubscriptionBasic } from '../types';
import { fetchAdminSubscriptions } from '../services/dashboard';
import {
  PaymentMethod,
  paymentMethodAttr,
  fetchPaymentMethods,
  setDefaultPaymentMethod,
  deletePaymentMethod,
} from '../services/paymentMethods';
import { PaymentMethodModal } from '../modals/PaymentMethodModal';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

// ===== Types =====
type MySubscription = {
  _id: string;
  status?: string;
  starts_at?: string;
  expires_at?: string;
  auto_renew?: boolean;
  usage?: { employees?: number };
  plan_id?: {
    _id?: string;
    name?: string;
    description?: string;
    pricing?: { price?: number; interval?: string; is_active?: boolean }[];
    features?: {
      feature_type_id?: { _id?: string; title?: string; type?: string } | string;
      properties?: { key: string; value: string }[];
    }[];
  };
};

type Payment = {
  _id: string;
  amount?: number;
  currency?: string;
  status?: string;
  stripe_invoice_id?: string;
  stripe_metadata?: string[];
  createdAt?: string;
};

type SubscriberPlan = {
  _id: string;
  name: string;
  description?: string;
  is_active?: boolean;
  stripe_price_ids?: string[];
  trial?: { trial_days?: number; is_active?: boolean };
  pricing?: { price?: number; interval?: string; is_active?: boolean }[];
  features?: {
    feature_type_id?: { _id?: string; title?: string } | string;
    plan_feature?: { title?: string };
    feature_type?: { title?: string };
    properties?: { key: string; value: string }[];
  }[];
};

// ===== Helpers =====
function formatPropValue(key: string, value: string): string {
  const storageKeys = ['size', 'storage', 'max_storage', 'limit_mb', 'disk'];
  if (storageKeys.some(k => key.toLowerCase().includes(k))) {
    const mb = Number(value);
    if (!isNaN(mb)) {
      return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`;
    }
  }
  return value;
}

function formatDate(d?: string) {
  if (!d) return 'N/A';
  return new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function statusColor(status?: string): string {
  switch (status?.toLowerCase()) {
    case 'active': return '#10B981';
    case 'inactive':
    case 'cancelled': return '#6B7280';
    case 'terminated': return '#EF4444';
    case 'pending': return '#F59E0B';
    default: return '#6B7280';
  }
}

async function fetchMySubscription(): Promise<MySubscription | null> {
  try {
    const res = await http.get<ApiResponse<MySubscription>>('/api/subscriptions/subscriber/my-subscription');
    return res.data.data ?? null;
  } catch {
    return null;
  }
}

async function fetchMyPayments(): Promise<Payment[]> {
  try {
    const res = await http.get<ApiResponse<Payment[]>>('/api/subscriptions/subscriber/my-payments');
    return Array.isArray(res.data.data) ? res.data.data : [];
  } catch {
    return [];
  }
}

async function fetchSubscriberPlans(): Promise<SubscriberPlan[]> {
  try {
    // Try subscriber-specific endpoint first, fall back to public
    const res = await http.get<ApiResponse<SubscriberPlan[]>>('/api/subscriber/subscription-plans');
    const data = (res.data as any).data ?? res.data;
    return Array.isArray(data) ? data : [];
  } catch {
    try {
      const res = await http.get<ApiResponse<SubscriberPlan[]>>('/api/subscription-plans/public');
      const data = (res.data as any).data ?? res.data;
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }
}

async function subscribeToPlan(payload: {
  plan_id: string;
  price_id?: string;
  payment_method_id?: string;
  auto_renew: boolean;
}): Promise<string | 'success' | null> {
  const res = await http.post<ApiResponse<{ checkout_url?: string; url?: string; status?: string }>>(
    '/api/subscriptions/subscriber/subscribe',
    payload,
  );
  const data = res.data.data ?? (res.data as any);
  if (data?.checkout_url || data?.url) return data.checkout_url ?? data.url ?? null;
  return 'success';
}

async function cancelRenewal(id: string): Promise<void> {
  await http.post(`/api/subscriptions/subscriber/${id}/cancel-renewal`, {});
}

async function reactivateRenewal(id: string): Promise<void> {
  await http.post(`/api/subscriptions/subscriber/${id}/reactivate-renewal`, {});
}

async function updateSubscriptionStatus(id: string, status: string): Promise<void> {
  await http.patch(`/api/subscriptions/admin/${id}/update-status`, { status });
}

// ===== Subscriber: Subscription Info Tab =====
function SubscriptionInfoTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();
  const [sub, setSub] = useState<MySubscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [acting, setActing] = useState(false);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setSub(await fetchMySubscription());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCancelRenewal = () => {
    if (!sub) return;
    Alert.alert(
      t('Cancel Renewal'),
      t('Are you sure you want to cancel the subscription renewal?'),
      [
        { text: t('No'), style: 'cancel' },
        {
          text: t('Yes, Stop'),
          style: 'destructive',
          onPress: async () => {
            setActing(true);
            try {
              await cancelRenewal(sub._id);
              await load();
            } catch (e: any) {
              Alert.alert(t('Error'), e?.message || t('Failed to cancel renewal'));
            } finally {
              setActing(false);
            }
          },
        },
      ],
    );
  };

  const handleReactivateRenewal = () => {
    if (!sub) return;
    Alert.alert(
      t('Reactivate Renewal'),
      t('Do you want to reactivate the subscription renewal?'),
      [
        { text: t('No'), style: 'cancel' },
        {
          text: t('Yes, Reactivate'),
          onPress: async () => {
            setActing(true);
            try {
              await reactivateRenewal(sub._id);
              await load();
            } catch (e: any) {
              Alert.alert(t('Error'), e?.message || t('Failed to reactivate renewal'));
            } finally {
              setActing(false);
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!sub) {
    return (
      <ScrollView
        contentContainerStyle={styles.center}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      >
        <EmptyState title={t('No active subscription')} message={t('You do not have an active subscription')} />
      </ScrollView>
    );
  }

  const plan = sub.plan_id || {};
  const activePricing = plan.pricing?.find(p => p.is_active) || plan.pricing?.[0];
  const price = activePricing?.price ?? 0;
  const interval = activePricing?.interval ?? 'month';

  const EMPLOYEE_FEATURE_ID = '69d3ce73f265322590686460';
  const STORAGE_FEATURE_ID = '69d3ce18f265322590686458';

  const userLimitFeature = plan.features?.find(f => {
    const ftId = typeof f.feature_type_id === 'object' ? f.feature_type_id?._id?.toString() : f.feature_type_id?.toString();
    const ftType = (typeof f.feature_type_id === 'object' ? (f.feature_type_id?.type ?? '') : '').toLowerCase();
    const ftTitle = (typeof f.feature_type_id === 'object' ? (f.feature_type_id?.title ?? '') : '').toLowerCase();
    return ftId === EMPLOYEE_FEATURE_ID || ftType.includes('user') || ftType.includes('employee') || ftTitle.includes('user') || ftTitle.includes('employee');
  });
  const userLimitProp = userLimitFeature?.properties?.find(p => ['max_emp_num', 'limit', 'max', 'count'].includes(p.key));
  const userLimit = userLimitProp?.value ?? t('Unlimited');

  const storageFeature = plan.features?.find(f => {
    const ftId = typeof f.feature_type_id === 'object' ? f.feature_type_id?._id?.toString() : f.feature_type_id?.toString();
    const ftType = (typeof f.feature_type_id === 'object' ? (f.feature_type_id?.type ?? '') : '').toLowerCase();
    const ftTitle = (typeof f.feature_type_id === 'object' ? (f.feature_type_id?.title ?? '') : '').toLowerCase();
    return ftId === STORAGE_FEATURE_ID || ftType.includes('storage') || ftTitle.includes('storage');
  });
  const storageSizeMB = storageFeature?.properties?.find(p => ['size', 'limit', 'max', 'value'].includes(p.key))?.value;
  const storageLabel = storageSizeMB != null
    ? Number(storageSizeMB) >= 1024 ? `${(Number(storageSizeMB) / 1024).toFixed(1)} GB` : `${storageSizeMB} MB`
    : t('Unlimited');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Plan header card */}
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.planHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
            <View style={[styles.iconInner, { backgroundColor: colors.primary + '30' }]}>
              <Diamond size={22} color={colors.primary} />
            </View>
          </View>
          <View style={{ flex: 1, gap: 2 }}>
            <Text style={[styles.planLabel, { color: colors.textMuted, textAlign: align }]}>
              {t("You're subscribed on")}
            </Text>
            <Text style={[styles.planName, { color: colors.primary, textAlign: align }]}>
              {plan.name || t('Unknown Plan')}
            </Text>
          </View>
          <Badge
            label={sub.status || 'N/A'}
            variant={sub.status === 'active' ? 'success' : sub.status === 'terminated' ? 'danger' : 'default'}
          />
        </View>

        <View style={styles.divider} />

        {/* Stats grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Users size={14} color={colors.primary} />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('Users')}</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.ink, textAlign: align }]}>
              {sub.usage?.employees ?? 0} {t('of')} {userLimit}
            </Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <HardDrive size={14} color="#8B5CF6" />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('Storage')}</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.ink, textAlign: align }]}>{storageLabel}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Calendar size={14} color="#F59E0B" />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('Expires')}</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.ink, textAlign: align }]}>{formatDate(sub.expires_at)}</Text>
          </View>
          <View style={styles.statItem}>
            <View style={[styles.statIcon, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <CreditCard size={14} color="#10B981" />
              <Text style={[styles.statLabel, { color: colors.textMuted }]}>{t('Price')}</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.ink, textAlign: align }]}>
              ${price}/{t(interval === 'month' ? 'mth' : 'yr')}
            </Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Auto renewal info */}
        <View style={[styles.renewRow, { flexDirection: isRTL ? 'row-reverse' : 'row', backgroundColor: colors.statusBg }]}>
          {sub.auto_renew
            ? <CheckCircle size={16} color="#10B981" />
            : <XCircle size={16} color="#6B7280" />
          }
          <Text style={[styles.renewText, { color: colors.textMuted }]}>
            {sub.auto_renew ? t('Auto renewal enabled') : t('Auto renewal disabled')}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actionBtns}>
          {sub.auto_renew ? (
            <TouchableOpacity
              style={[styles.actionBtn, styles.dangerBtn]}
              onPress={handleCancelRenewal}
              disabled={acting}
            >
              <XCircle size={15} color="#EF4444" />
              <Text style={styles.dangerBtnText}>
                {acting ? t('Processing...') : t('Cancel Renewal')}
              </Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={[styles.actionBtn, styles.successBtn]}
              onPress={handleReactivateRenewal}
              disabled={acting}
            >
              <RefreshCw size={15} color="#10B981" />
              <Text style={styles.successBtnText}>
                {acting ? t('Processing...') : t('Reactivate Renewal')}
              </Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, styles.upgradeBtn]}
            onPress={() => navigation.navigate('Pricing')}
          >
            <Zap size={15} color="#375DFB" />
            <Text style={styles.upgradeBtnText}>{t('Upgrade')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Starts at */}
      {sub.starts_at && (
        <View style={[styles.metaCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Subscription started')}</Text>
          <Text style={[styles.metaValue, { color: colors.ink, textAlign: align }]}>{formatDate(sub.starts_at)}</Text>
        </View>
      )}
    </ScrollView>
  );
}

// ===== Subscriber: Billing History Tab =====
function BillingHistoryTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setPayments(await fetchMyPayments());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {payments.length === 0 ? (
        <EmptyState title={t('No payments')} message={t('No billing history found')} />
      ) : (
        payments.map((p) => (
          <View key={p._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.paymentHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                <View style={[styles.iconInner, { backgroundColor: colors.primary + '30' }]}>
                  <Zap size={16} color={colors.primary} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.paymentProduct, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                  {p.stripe_metadata?.[0]?.split(': ')[1] || t('Subscription')}
                </Text>
                {!!p.stripe_invoice_id && (
                  <Text style={[styles.paymentRef, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>
                    {p.stripe_invoice_id}
                  </Text>
                )}
              </View>
              <Badge
                label={p.status || 'N/A'}
                variant={p.status === 'succeeded' || p.status === 'paid' ? 'success' : p.status === 'failed' ? 'danger' : 'default'}
              />
            </View>
            <View style={[styles.paymentMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.paymentDate, { color: colors.textMuted }]}>{formatDate(p.createdAt)}</Text>
              <Text style={[styles.paymentAmount, { color: colors.ink }]}>
                {(p.currency || '').toUpperCase()} {p.amount}
              </Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ===== Subscriber: Payment Methods Tab =====
function PaymentMethodsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [editMethod, setEditMethod] = useState<PaymentMethod | null>(null);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setMethods(await fetchPaymentMethods());
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleSetDefault = (pm: PaymentMethod) => {
    Alert.alert(
      t('Set as default'),
      `${t('Make this the default payment method?')}`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Confirm'),
          onPress: async () => {
            try {
              await setDefaultPaymentMethod(pm._id);
              await load();
            } catch (e: any) {
              Alert.alert(t('Error'), e?.message || t('Failed to update default payment method'));
            }
          },
        },
      ],
    );
  };

  const handleDelete = (pm: PaymentMethod) => {
    Alert.alert(
      t('Delete Payment Method'),
      t('Are you sure you want to delete this payment method?'),
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePaymentMethod(pm._id);
              await load();
            } catch (e: any) {
              Alert.alert(t('Error'), e?.message || t('Failed to delete payment method'));
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <TouchableOpacity
        style={[styles.addPmBtn, { backgroundColor: colors.primary }]}
        onPress={() => setAddOpen(true)}
        activeOpacity={0.85}
      >
        <Plus size={16} color="#FFF" />
        <Text style={styles.addPmBtnText}>{t('Add new method')}</Text>
      </TouchableOpacity>

      {methods.length === 0 ? (
        <EmptyState title={t('No payment methods found')} message={t('Add a payment method to manage your subscriptions')} />
      ) : (
        methods.map((pm) => {
          const brand = paymentMethodAttr(pm, 'brand') || t('Card');
          const last4 = paymentMethodAttr(pm, 'last4');
          const expMonth = paymentMethodAttr(pm, 'exp_month');
          const expYear = paymentMethodAttr(pm, 'exp_year');
          const country = paymentMethodAttr(pm, 'country');
          const isVisa = brand.toLowerCase().includes('visa');
          const isMaster = brand.toLowerCase().includes('master');
          const brandColor = isMaster ? '#F97316' : isVisa ? '#2563EB' : colors.textMuted;

          return (
            <View key={pm._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.pmHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.iconWrap, { backgroundColor: colors.statusBg }]}>
                  <View style={[styles.iconInner, { backgroundColor: brandColor + '20' }]}>
                    <CreditCard size={18} color={brandColor} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.paymentProduct, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                    {brand}
                  </Text>
                  {pm.is_default && (
                    <View style={[styles.defaultChip, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Star size={12} color="#10B981" fill="#10B981" />
                      <Text style={[styles.defaultChipText, { color: colors.textMuted }]}>{t('Default Card')}</Text>
                    </View>
                  )}
                </View>
                {!pm.is_default && (
                  <StatusActions
                    actions={[
                      {
                        label: t('Set as default'),
                        icon: <Star size={15} color="#10B981" />,
                        onPress: () => handleSetDefault(pm),
                      },
                    ]}
                  />
                )}
              </View>

              <View style={styles.divider} />

              <View style={[styles.pmInfo, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={styles.pmInfoItem}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Country')}</Text>
                  <Text style={[styles.metaValue, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                    {country || t('N/A')}
                  </Text>
                </View>
                <View style={styles.pmInfoItem}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Card Number')}</Text>
                  <Text style={[styles.metaValue, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                    {last4 ? `**** **** **** ${last4}` : t('N/A')}
                  </Text>
                </View>
                <View style={styles.pmInfoItem}>
                  <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Card Expiry')}</Text>
                  <Text style={[styles.metaValue, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                    {expMonth && expYear ? `${expMonth}/${expYear}` : t('N/A')}
                  </Text>
                </View>
              </View>

              <View style={[styles.pmActions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <TouchableOpacity
                  style={[styles.pmActionBtn, { borderColor: '#FCA5A5' }]}
                  onPress={() => handleDelete(pm)}
                >
                  <Ban size={14} color="#EF4444" />
                  <Text style={[styles.pmActionDanger, { color: '#EF4444' }]}>{t('Delete Card')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.pmActionBtn, { backgroundColor: colors.primary + '18', borderColor: colors.primary }]}
                  onPress={() => setEditMethod(pm)}
                >
                  <Pencil size={14} color={colors.primary} />
                  <Text style={[styles.pmActionPrimary, { color: colors.primary }]}>{t('Edit Payment Method')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <PaymentMethodModal
        visible={addOpen}
        onClose={() => setAddOpen(false)}
        onSaved={load}
      />
      <PaymentMethodModal
        visible={!!editMethod}
        onClose={() => setEditMethod(null)}
        onSaved={load}
        paymentMethod={editMethod}
      />
    </ScrollView>
  );
}

// ===== Subscriber: Pricing Tab =====
function PricingTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [plans, setPlans] = useState<SubscriberPlan[]>([]);
  const [currentSub, setCurrentSub] = useState<MySubscription | null>(null);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'month' | 'year'>('month');
  const [autoRenew, setAutoRenew] = useState(true);
  const [subscribingId, setSubscribingId] = useState<string | null>(null);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    const [p, s, pm] = await Promise.all([fetchSubscriberPlans(), fetchMySubscription(), fetchPaymentMethods()]);
    setPlans(p.filter(pl => pl.is_active));
    setCurrentSub(s);
    setPaymentMethods(Array.isArray(pm) ? pm : []);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const defaultPaymentMethod = paymentMethods.find(m => m.is_default && m.is_active);

  const handleSubscribe = async (plan: SubscriberPlan) => {
    const pricingIdx = plan.pricing?.findIndex(p => p.interval === billingCycle && p.is_active) ?? -1;
    const idx = pricingIdx >= 0 ? pricingIdx : 0;
    const priceId = plan.stripe_price_ids?.[idx];
    setSubscribingId(plan._id);
    try {
      const result = await subscribeToPlan({
        plan_id: plan._id,
        price_id: priceId,
        payment_method_id: defaultPaymentMethod?._id,
        auto_renew: autoRenew,
      });
      if (result === 'success') {
        Alert.alert(t('Success'), t('Subscription updated successfully.'));
        load();
      } else if (result) {
        await Linking.openURL(result);
      }
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || e?.message || t('Failed to subscribe.'));
    } finally {
      setSubscribingId(null);
    }
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Auto renewal + billing cycle toggle */}
      <View style={[styles.cycleCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.cycleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Switch
            value={autoRenew}
            onValueChange={setAutoRenew}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor={autoRenew ? '#FFF' : colors.textMuted}
          />
          <View style={{ flex: 1 }}>
            <Text style={[styles.cycleCardTitle, { color: colors.ink, textAlign: align }]}>{t('Auto renewal')}</Text>
            <Text style={[styles.cycleCardHint, { color: colors.textMuted, textAlign: align }]}>
              {t('Enabled by default and charged from your default card')}
            </Text>
          </View>
        </View>
        <View style={[styles.cycleToggle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <TouchableOpacity
            style={[styles.cycleBtn, billingCycle === 'month' && { backgroundColor: colors.primary }]}
            onPress={() => setBillingCycle('month')}
          >
            <Text style={[styles.cycleBtnText, { color: billingCycle === 'month' ? '#FFF' : colors.textMuted }]}>
              {t('Monthly')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cycleBtn, billingCycle === 'year' && { backgroundColor: colors.primary }]}
            onPress={() => setBillingCycle('year')}
          >
            <Text style={[styles.cycleBtnText, { color: billingCycle === 'year' ? '#FFF' : colors.textMuted }]}>
              {t('Yearly')} · {t('Save 25%')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {plans.length === 0 ? (
        <EmptyState title={t('No plans available')} message={t('No active plans found')} />
      ) : (
        plans.map((plan) => {
          const pricing = plan.pricing?.find(p => p.interval === billingCycle && p.is_active) || plan.pricing?.[0];
          const isCurrent = currentSub?.plan_id?._id === plan._id;

          return (
            <View
              key={plan._id}
              style={[
                styles.card,
                { backgroundColor: colors.surface, borderColor: isCurrent ? colors.primary : colors.border },
                isCurrent && { borderWidth: 2 },
              ]}
            >
              {/* Plan name + price */}
              <View style={[styles.pricingHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                  <View style={[styles.iconInner, { backgroundColor: colors.primary + '30' }]}>
                    <Zap size={16} color={colors.primary} />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: colors.primary, textAlign: align }]}>{plan.name}</Text>
                  {!!plan.description && (
                    <Text style={[styles.planLabel, { color: colors.textMuted, textAlign: align }]} numberOfLines={2}>
                      {plan.description}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.priceAmt, { color: colors.ink }]}>${pricing?.price ?? 0}</Text>
                  <Text style={[styles.priceInterval, { color: colors.textMuted }]}>
                    /{billingCycle === 'month' ? t('mth') : t('yr')}
                  </Text>
                </View>
              </View>

              {/* Features */}
              {!!plan.features?.length && (
                <>
                  <View style={styles.divider} />
                  <Text style={[styles.featuresTitle, { color: colors.textMuted, textAlign: align }]}>
                    {t("What's included")}
                  </Text>
                  <View style={styles.featuresList}>
                    {plan.features.map((f, i) => {
                      const title =
                        f.plan_feature?.title ||
                        f.feature_type?.title ||
                        (typeof f.feature_type_id === 'object' ? f.feature_type_id?.title : '') ||
                        t('Feature');
                      return (
                        <View key={i} style={[styles.featureItem, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                          <View style={[styles.featureItemHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                            <View style={[styles.featureIconDot, { backgroundColor: colors.primary + '20' }]}>
                              <CheckCircle size={14} color={colors.primary} />
                            </View>
                            <Text style={[styles.featureItemTitle, { color: colors.ink, textAlign: align }]}>{title}</Text>
                          </View>
                          {!!f.properties?.length && (
                            <View style={[styles.featureProps, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                              {f.properties.map((p, pi) => (
                                <View key={pi} style={[styles.featureProp, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                                  <Text style={[styles.featurePropKey, { color: colors.textMuted }]}>{p.key}:</Text>
                                  <Text style={[styles.featurePropVal, { color: colors.primary }]}>{formatPropValue(p.key, p.value)}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                        </View>
                      );
                    })}
                  </View>
                </>
              )}

              <View style={[styles.pricingFooter, { backgroundColor: colors.statusBg }]}>
                <TouchableOpacity
                  disabled={isCurrent || !!subscribingId}
                  style={[
                    styles.subscribeBtn,
                    { backgroundColor: isCurrent ? colors.border : colors.primary },
                    !!subscribingId && !isCurrent && { opacity: 0.7 },
                  ]}
                  onPress={() => handleSubscribe(plan)}
                >
                  {subscribingId === plan._id ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <Text style={[styles.subscribeBtnText, { color: isCurrent ? colors.textMuted : '#FFF' }]}>
                      {isCurrent ? t('Current Plan') : t('Upgrade / Subscribe')}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

// ===== Subscriber view: tab navigator =====
function SubscriberSubscriptionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const tabs = [
    { name: 'SubInfo', component: SubscriptionInfoTab, title: t('Subscription') },
    { name: 'Billing', component: BillingHistoryTab, title: t('Billing History') },
    { name: 'PaymentMethods', component: PaymentMethodsTab, title: t('Payment Methods') },
    { name: 'Pricing', component: PricingTab, title: t('Pricing') },
  ] as const;

  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={({ route }) => {
          const cfg = tabs.find(tb => tb.name === route.name);
          return {
            tabBarLabel: cfg?.title,
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

// ===== Admin view =====
function AdminSubscriptionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [subs, setSubs] = useState<SubscriptionBasic[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await fetchAdminSubscriptions(1, 100);
      setSubs(Array.isArray(res.data) ? res.data : []);
    } catch {
      setSubs([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleAction = (sub: SubscriptionBasic, status: string, label: string) => {
    Alert.alert(
      label,
      `${label} ${sub.subscriber?.name || t('this subscriber')}?`,
      [
        { text: t('Cancel'), style: 'cancel' },
        {
          text: t('Confirm'),
          style: status === 'terminated' ? 'destructive' : 'default',
          onPress: async () => {
            try {
              await updateSubscriptionStatus(sub._id, status);
              await load();
            } catch (e: any) {
              Alert.alert(t('Error'), e?.message || t('Action failed'));
            }
          },
        },
      ],
    );
  };

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {subs.length === 0 ? (
        <EmptyState title={t('No subscriptions')} message={t('No subscriptions to display')} />
      ) : (
        subs.map((sub) => (
          <View key={sub._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.adminCardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.adminSubscriber, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                  {sub.subscriber?.name || t('Unknown')}
                </Text>
                {sub.organization?.name && (
                  <Text style={[styles.adminOrg, { color: colors.textMuted, textAlign: align }]} numberOfLines={1}>
                    {sub.organization.name}
                  </Text>
                )}
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6, flexDirection: isRTL ? 'row-reverse' : 'row', alignSelf: 'flex-start' }}>
                <Badge
                  label={sub.status || 'N/A'}
                  variant={sub.status === 'active' ? 'success' : sub.status === 'terminated' ? 'danger' : 'default'}
                />
                <StatusActions
                  actions={[
                    {
                      label: t('Activate'),
                      icon: <Power size={15} color="#10B981" />,
                      onPress: () => handleAction(sub, 'active', t('Activate')),
                    },
                    {
                      label: t('Deactivate'),
                      icon: <XCircle size={15} color="#F59E0B" />,
                      onPress: () => handleAction(sub, 'inactive', t('Deactivate')),
                    },
                    {
                      label: t('Terminate'),
                      icon: <Ban size={15} color="#EF4444" />,
                      onPress: () => handleAction(sub, 'terminated', t('Terminate')),
                      destructive: true,
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.divider} />

            <View style={[styles.adminMeta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={styles.adminMetaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Start')}</Text>
                <Text style={[styles.metaValue, { color: colors.ink, textAlign: align }]}>{formatDate(sub.starts_at)}</Text>
              </View>
              <View style={styles.adminMetaItem}>
                <Text style={[styles.metaLabel, { color: colors.textMuted, textAlign: align }]}>{t('Expires')}</Text>
                <Text style={[styles.metaValue, { color: colors.ink, textAlign: align }]}>{formatDate(sub.expires_at)}</Text>
              </View>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

// ===== Root export =====
export default function SubscriptionsScreen() {
  const { user } = useAuth();

  if (user?.type === 'Admin') {
    return <AdminSubscriptionsScreen />;
  }

  return <SubscriberSubscriptionsScreen />;
}

// ===== Styles =====
const styles = StyleSheet.create({
  actionBtn: {
    alignItems: 'center',
    borderRadius: radii.md,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  actionBtns: { flexDirection: 'row', gap: spacing.sm },
  adminCardHead: { alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm },
  adminMeta: { gap: spacing.md },
  adminMetaItem: { flex: 1 },
  adminOrg: { fontSize: font.sizes.xs, marginTop: 2 },
  adminSubscriber: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.md,
  },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  cycleBtn: {
    borderRadius: radii.md,
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  cycleBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  cycleCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.md,
  },
  cycleCardHint: { fontSize: font.sizes.xs, marginTop: 2 },
  cycleCardTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  cycleRow: {
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    padding: spacing.xs,
  },
  cycleToggle: { borderWidth: 1, borderColor: '#E5E7EB', borderRadius: radii.lg, padding: spacing.xs, gap: spacing.xs },
  dangerBtn: { borderColor: '#FCA5A5' },
  dangerBtnText: { color: '#EF4444', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  defaultChip: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#2D9F7517',
    borderRadius: radii.md,
    gap: 4,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  defaultChipText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  addPmBtn: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radii.lg,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addPmBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  divider: { backgroundColor: '#E5E7EB', height: 1, marginVertical: spacing.xs },
  pmActions: { gap: spacing.sm },
  pmActionBtn: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingVertical: spacing.sm,
  },
  pmActionDanger: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  pmActionPrimary: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  pmHead: { alignItems: 'center', gap: spacing.sm },
  pmInfo: { gap: spacing.md },
  pmInfoItem: { flex: 1 },
  featureIconDot: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 26,
    justifyContent: 'center',
    width: 26,
  },
  featureItem: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.sm,
  },
  featureItemHead: { alignItems: 'center', gap: spacing.sm },
  featureItemTitle: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  featureProp: {
    alignItems: 'center',
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: 3,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
  },
  featurePropKey: { fontSize: font.sizes.xs },
  featurePropVal: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  featureProps: { flexWrap: 'wrap', gap: spacing.xs, paddingStart: 38 },
  featuresList: { gap: spacing.sm },
  featuresTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, letterSpacing: 0.5, marginBottom: spacing.xs, textTransform: 'uppercase' },
  iconInner: { borderRadius: radii.full, padding: spacing.sm },
  iconWrap: { borderRadius: radii.full, padding: 6 },
  metaCard: {
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: 4,
    padding: spacing.md,
  },
  metaLabel: { fontSize: font.sizes.xs },
  metaValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  paymentAmount: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  paymentDate: { fontSize: font.sizes.xs },
  paymentHead: { alignItems: 'center', gap: spacing.sm },
  paymentMeta: { justifyContent: 'space-between', marginTop: spacing.xs },
  paymentProduct: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  paymentRef: { fontSize: font.sizes.xs },
  planHeader: { alignItems: 'center', gap: spacing.md },
  planLabel: { fontSize: font.sizes.sm },
  planName: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  priceAmt: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  priceInterval: { fontSize: font.sizes.xs },
  pricingFooter: { borderRadius: radii.md, padding: spacing.md },
  pricingHead: { alignItems: 'center', gap: spacing.sm },
  renewRow: {
    alignItems: 'center',
    borderRadius: radii.md,
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
  },
  renewText: { flex: 1, fontSize: font.sizes.sm },
  scrollContent: { gap: spacing.md, padding: spacing.md, paddingBottom: 80 },
  statIcon: { alignItems: 'center', gap: spacing.xs },
  statItem: { flex: 1, gap: 4, minWidth: '45%' },
  statLabel: { fontSize: font.sizes.xs },
  statValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
  subscribeBtn: {
    alignItems: 'center',
    borderRadius: radii.md,
    paddingVertical: spacing.sm,
    width: '100%',
  },
  subscribeBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  successBtn: { borderColor: '#6EE7B7' },
  successBtnText: { color: '#10B981', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  upgradeBtn: { borderColor: '#C7D2FE' },
  upgradeBtnText: { color: '#375DFB', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
