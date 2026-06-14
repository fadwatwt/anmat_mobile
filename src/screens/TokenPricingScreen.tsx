import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Zap, Crown, Rocket, Sparkles, Check, ArrowRight } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { EmptyState } from '../components/EmptyState';
import { http } from '../lib/http';
import { ApiResponse } from '../types';
import { fetchTokenPackages, TokenPackage } from '../services/ai';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type PackStyle = 'Starter' | 'Growth' | 'Scale' | 'Enterprise';

function getPackStyle(tokens?: number): PackStyle {
  if (!tokens || tokens <= 10000) return 'Starter';
  if (tokens <= 50000) return 'Growth';
  if (tokens <= 100000) return 'Scale';
  return 'Enterprise';
}

const PACK_COLORS: Record<PackStyle, { from: string; to: string; icon: string }> = {
  Starter:    { from: '#3B82F6', to: '#6366F1', icon: '⚡' },
  Growth:     { from: '#F59E0B', to: '#EA580C', icon: '👑' },
  Scale:      { from: '#8B5CF6', to: '#7C3AED', icon: '🚀' },
  Enterprise: { from: '#A855F7', to: '#EC4899', icon: '✨' },
};

function PackIcon({ style, size = 22 }: { style: PackStyle; size?: number }) {
  const color = PACK_COLORS[style].from;
  switch (style) {
    case 'Growth':     return <Crown size={size} color={color} />;
    case 'Scale':      return <Rocket size={size} color={color} />;
    case 'Enterprise': return <Sparkles size={size} color={color} />;
    default:           return <Zap size={size} color={color} />;
  }
}

async function createTokenCheckout(packageId: string): Promise<string | null> {
  const res = await http.post('/api/ai/tokens/checkout', { package_id: packageId });
  // Normalize: API may return { data: { checkout_url } } or { checkout_url } directly
  const body = res.data?.data ?? res.data;
  if (body?.paid_with_default_card) return 'paid_with_default_card';
  const url = body?.checkout_url || body?.url || body?.session_url || null;
  return url;
}

export default function TokenPricingScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [packages, setPackages] = useState<TokenPackage[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [purchasingId, setPurchasingId] = useState<string | null>(null);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const pkgs = await fetchTokenPackages();
      setPackages(pkgs.filter(p => p.is_active !== false));
    } catch {
      setPackages([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handlePurchase = async (pkg: TokenPackage) => {
    setPurchasingId(pkg._id);
    try {
      const result = await createTokenCheckout(pkg._id);
      if (result === 'paid_with_default_card') {
        Alert.alert(t('Purchase Successful'), t('Tokens purchased successfully using your default card.'));
      } else if (result) {
        await Linking.openURL(result);
      } else {
        Alert.alert(t('Error'), t('No checkout URL returned from server.'));
      }
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setPurchasingId(null);
    }
  };

  if (loading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primary + '20' }]}>
          <Sparkles size={28} color={colors.primary} />
        </View>
        <Text style={[styles.headerTitle, { color: colors.ink, textAlign: 'center' }]}>
          {t('Power Up Your AI')}
        </Text>
        <Text style={[styles.headerSub, { color: colors.textMuted, textAlign: 'center' }]}>
          {t('Choose a token pack to continue using the AI assistant')}
        </Text>
      </View>

      {/* Packages */}
      {packages.length === 0 ? (
        <EmptyState title={t('No packages available')} message={t('No token packages found')} />
      ) : (
        packages.map((pkg) => {
          const style = getPackStyle(pkg.tokens);
          const palette = PACK_COLORS[style];
          const isPro = style === 'Growth';
          const isPurchasing = purchasingId === pkg._id;

          return (
            <View
              key={pkg._id}
              style={[
                styles.card,
                {
                  backgroundColor: colors.surface,
                  borderColor: isPro ? palette.from : colors.border,
                  borderWidth: isPro ? 2 : 1,
                },
              ]}
            >
              {isPro && (
                <View style={[styles.popularBadge, { backgroundColor: palette.from }]}>
                  <Text style={styles.popularText}>{t('Most Popular')}</Text>
                </View>
              )}

              {/* Card header */}
              <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.iconBg, { backgroundColor: palette.from + '18' }]}>
                  <PackIcon style={style} size={24} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.packName, { color: colors.ink, textAlign: align }]}>{pkg.name}</Text>
                  {!!pkg.description && (
                    <Text style={[styles.packDesc, { color: colors.textMuted, textAlign: align }]} numberOfLines={2}>
                      {pkg.description}
                    </Text>
                  )}
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={[styles.tokenCount, { color: palette.from }]}>
                    {(pkg.tokens ?? 0).toLocaleString()}
                  </Text>
                  <Text style={[styles.tokenLabel, { color: colors.textMuted }]}>{t('tokens')}</Text>
                </View>
              </View>

              {/* Price */}
              <View style={[styles.priceRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.price, { color: colors.ink }]}>{pkg.price_label || '--'}</Text>
                <Text style={[styles.priceOnce, { color: colors.textMuted }]}>{t('/ one-time')}</Text>
              </View>

              {/* Features */}
              {!!pkg.features?.length && (
                <View style={styles.features}>
                  {pkg.features.map((f, i) => (
                    <View key={i} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                      <Check size={14} color="#10B981" />
                      <Text style={[styles.featureText, { color: colors.textMuted, textAlign: align }]}>{f}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Buy button */}
              <TouchableOpacity
                style={[
                  styles.buyBtn,
                  { backgroundColor: palette.from },
                  isPurchasing && { opacity: 0.7 },
                ]}
                onPress={() => handlePurchase(pkg)}
                disabled={!!purchasingId}
                activeOpacity={0.85}
              >
                {isPurchasing ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.buyBtnText}>{t('Get')} {pkg.name}</Text>
                    <ArrowRight size={16} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  buyBtn: {
    alignItems: 'center',
    borderRadius: radii.xl,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.md,
  },
  buyBtnText: {
    color: '#FFF',
    fontSize: font.sizes.sm,
    fontWeight: font.weights.bold,
  },
  card: {
    borderRadius: radii.xl,
    gap: spacing.sm,
    overflow: 'hidden',
    padding: spacing.md,
    position: 'relative',
  },
  cardHead: { alignItems: 'flex-start', gap: spacing.sm },
  center: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  featureRow: { alignItems: 'center', gap: spacing.xs },
  featureText: { flex: 1, fontSize: font.sizes.sm },
  features: { gap: spacing.xs, paddingTop: spacing.xs },
  header: { alignItems: 'center', gap: spacing.sm, paddingBottom: spacing.lg },
  headerIcon: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 64,
    justifyContent: 'center',
    width: 64,
  },
  headerSub: { fontSize: font.sizes.sm, maxWidth: 280 },
  headerTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  iconBg: {
    alignItems: 'center',
    borderRadius: radii.lg,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  packDesc: { fontSize: font.sizes.xs, marginTop: 2 },
  packName: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  popularBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    position: 'absolute',
    right: spacing.md,
    top: -10,
    zIndex: 1,
  },
  popularText: { color: '#FFF', fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  price: { fontSize: font.sizes.xxl, fontWeight: font.weights.extrabold },
  priceOnce: { alignSelf: 'flex-end', fontSize: font.sizes.xs, marginBottom: 4 },
  priceRow: { alignItems: 'baseline', gap: spacing.xs },
  scrollContent: { gap: spacing.md, padding: spacing.md, paddingBottom: 80 },
  tokenCount: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  tokenLabel: { fontSize: font.sizes.xs },
});
