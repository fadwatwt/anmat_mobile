import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ArrowLeft, Lock, CheckCircle, XCircle, ExternalLink, RefreshCw } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { font, radii, spacing } from '../theme';
import { createCheckoutSession } from '../services/stripe';

type Props = {
  navigation: any;
  route: {
    params: {
      planId: string;
      priceId: string;
      planName: string;
      amount: number;
      interval: string;
      trialDays?: number;
    };
  };
};

type PaymentStep = 'loading' | 'ready' | 'browser_open' | 'polling' | 'success' | 'error';

export default function StripePaymentScreen({ navigation, route }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { refreshUser } = useAuth();

  const { planId, priceId, planName, amount, interval, trialDays } = route.params;

  const [step, setStep] = useState<PaymentStep>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = useCallback(() => {
    setStep('polling');
    let attempts = 0;
    pollRef.current = setInterval(async () => {
      attempts++;
      if (attempts > 30) {
        if (pollRef.current) clearInterval(pollRef.current);
        setErrorMessage(t('Payment verification timed out. Please try again.'));
        setStep('error');
        return;
      }
      try {
        const user = await refreshUser();
        if (user?.has_subscription_access) {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep('success');
        }
      } catch {
        // keep polling
      }
    }, 3000);
  }, [refreshUser, t]);

  const handleOpenCheckout = useCallback(async () => {
    setStep('loading');
    try {
      const result = await createCheckoutSession(planId, priceId);
      if (result.url) {
        setStep('browser_open');
        await Linking.openURL(result.url);
        startPolling();
      } else {
        setErrorMessage(t('Failed to create checkout session.'));
        setStep('error');
      }
    } catch (err: any) {
      setErrorMessage(err?.message || t('Failed to initialize payment.'));
      setStep('error');
    }
  }, [planId, priceId, startPolling, t]);

  useEffect(() => {
    handleOpenCheckout();
  }, []);

  const renderContent = () => {
    switch (step) {
      case 'loading':
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              {t('Initializing secure checkout...')}
            </Text>
          </View>
        );

      case 'browser_open':
        return (
          <View style={styles.centered}>
            <ExternalLink size={48} color={colors.primary} />
            <Text style={[styles.loadingTitle, { color: colors.ink }]}>
              {t('Opening Stripe Checkout...')}
            </Text>
            <Text style={[styles.loadingText, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('Complete your payment in the browser. Return here when done.')}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={startPolling}
            >
              <Text style={styles.retryBtnText}>{t('I completed payment')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.retryBtnText, { color: colors.textSecondary }]}>{t('Cancel')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 'polling':
        return (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} size="large" />
            <Text style={[styles.loadingTitle, { color: colors.ink }]}>
              {t('Verifying payment...')}
            </Text>
            <Text style={[styles.loadingText, { color: colors.textSecondary, textAlign: 'center' }]}>
              {t('Please wait while we confirm your subscription.')}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={() => { handleOpenCheckout(); }}
            >
              <RefreshCw size={16} color="#FFF" style={{ marginRight: 8 }} />
              <Text style={styles.retryBtnText}>{t('Retry')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 'error':
        return (
          <View style={styles.centered}>
            <XCircle size={48} color={colors.danger} />
            <Text style={[styles.errorTitle, { color: colors.danger }]}>{t('Error')}</Text>
            <Text style={[styles.errorText, { color: colors.textSecondary }]}>{errorMessage}</Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.primary }]}
              onPress={handleOpenCheckout}
            >
              <Text style={styles.retryBtnText}>{t('Try Again')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border }]}
              onPress={() => navigation.goBack()}
            >
              <Text style={[styles.retryBtnText, { color: colors.textSecondary }]}>{t('Go Back')}</Text>
            </TouchableOpacity>
          </View>
        );

      case 'success':
        return (
          <View style={styles.centered}>
            <CheckCircle size={64} color="#16A34A" />
            <Text style={[styles.successTitle, { color: colors.ink }]}>
              {t('Subscription Activated!')}
            </Text>
            <Text style={[styles.successText, { color: colors.textSecondary }]}>
              {t('Welcome to')} {planName}. {t('Your subscription is now active.')}
            </Text>
            <TouchableOpacity
              style={[styles.retryBtn, { backgroundColor: '#16A34A' }]}
              onPress={() => navigation.getParent()?.reset({ index: 0, routes: [{ name: 'Dashboard' }] })}
            >
              <Text style={styles.retryBtnText}>{t('Go to Dashboard')}</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <ArrowLeft size={22} color={colors.ink} style={isRTL ? { transform: [{ rotate: '180deg' }] } : undefined} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: colors.ink }]}>{t('Checkout')}</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            {t('Secure payment via Stripe')}
          </Text>
        </View>
        <Lock size={16} color={colors.textMuted} />
      </View>

      <View style={[styles.planSummary, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('Plan')}</Text>
          <Text style={[styles.summaryValue, { color: colors.ink }]}>{planName}</Text>
        </View>
        <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('Amount')}</Text>
          <Text style={[styles.summaryValue, { color: colors.ink }]}>
            ${amount}/{interval === 'month' ? t('mth') : t('yr')}
          </Text>
        </View>
        {trialDays && trialDays > 0 ? (
          <View style={[styles.summaryRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>{t('Trial')}</Text>
            <Text style={[styles.summaryValue, { color: '#16A34A' }]}>
              {t('{{days}} days free trial', { days: trialDays })}
            </Text>
          </View>
        ) : null}
      </View>

      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  backBtn: { padding: spacing.xs },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: font.sizes.base, fontWeight: '700' },
  headerSubtitle: { fontSize: font.sizes.xs },

  planSummary: {
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  summaryRow: { justifyContent: 'space-between', alignItems: 'center' },
  summaryLabel: { fontSize: font.sizes.sm },
  summaryValue: { fontSize: font.sizes.sm, fontWeight: '700' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md },
  loadingTitle: { fontSize: font.sizes.lg, fontWeight: '700', marginTop: spacing.sm },
  loadingText: { fontSize: font.sizes.sm, lineHeight: 20 },

  errorTitle: { fontSize: font.sizes.lg, fontWeight: '700', marginTop: spacing.sm },
  errorText: { fontSize: font.sizes.sm, textAlign: 'center', lineHeight: 20 },

  successTitle: { fontSize: font.sizes.lg, fontWeight: '800', marginTop: spacing.sm },
  successText: { fontSize: font.sizes.sm, textAlign: 'center', lineHeight: 20 },

  retryBtn: { borderRadius: radii.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.xl, marginTop: spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  retryBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: '700' },
});
