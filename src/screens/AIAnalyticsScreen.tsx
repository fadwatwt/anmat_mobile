import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchTokenBalance, fetchTokenHistory, TokenBalance, TokenHistory } from '../services/ai';
import { AnalyticsCard } from '../components/AnalyticsCard';
import { BarChart } from '../charts/BarChart';
import { font, radii, spacing } from '../theme';

const TX_LIMIT = 10;

function localeOf(locale: string): string {
  return locale === 'ar' ? 'ar-EG' : 'en-US';
}

function fmtDate(d?: string, locale = 'en', time = false): string {
  if (!d) return '-';
  const date = new Date(d);
  if (isNaN(date.getTime())) return '-';
  return (
    date.toLocaleDateString(localeOf(locale), { month: 'short', day: 'numeric', year: 'numeric' }) +
    (time ? ` ${date.toLocaleTimeString(localeOf(locale), { hour: '2-digit', minute: '2-digit' })}` : '')
  );
}

function nextRenewalDate(lastRenewal?: string, locale = 'en'): string {
  if (!lastRenewal) return '-';
  const date = new Date(lastRenewal);
  if (isNaN(date.getTime())) return '-';
  date.setDate(date.getDate() + 30);
  return date.toLocaleDateString(localeOf(locale), { month: 'short', day: 'numeric', year: 'numeric' });
}

export default function AIAnalyticsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale, isRTL } = useLocale();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [history, setHistory] = useState<TokenHistory | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);

  const loadHistory = useCallback(async (p: number) => {
    try {
      setHistory(await fetchTokenHistory(p, TX_LIMIT));
    } catch {}
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const b = await fetchTokenBalance();
        setBalance(b);
      } catch {}
      await loadHistory(1);
      setLoading(false);
    })();
  }, [loadHistory]);

  useEffect(() => {
    loadHistory(page);
  }, [page, loadHistory]);

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const paidTokens = balance?.balance ?? 0;
  const freeLimit = balance?.free_limit ?? 0;
  const freeConsumed = balance?.free_consumed ?? 0;
  const freeRemaining = Math.max(0, freeLimit - freeConsumed);
  const isUnlimited = balance?.is_unlimited ?? false;
  const dailyUsage = balance?.daily_usage ?? [];
  const totalThirtyDay = dailyUsage.reduce((acc, item) => acc + Number(item.total || 0), 0);

  const chartData = dailyUsage.slice(-10).map((item, i) => {
    const d = new Date(item._id);
    return {
      key: `${item._id}-${i}`,
      value: Number(item.total || 0),
      label: isNaN(d.getTime()) ? item._id.slice(5) : d.toLocaleDateString(localeOf(locale), { day: 'numeric' }),
    };
  });

  const transactions = history?.transactions ?? [];
  const totalPages = history ? Math.ceil(history.total / TX_LIMIT) : 0;

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={s.content}>
        <View style={s.statRow}>
          <View style={[s.statCard, { backgroundColor: colors.primaryLight, borderColor: colors.border }]}>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>{t('Tokens Balance')}</Text>
            <Text style={[s.statValue, { color: colors.primary, textAlign: 'center' }]}>
              {isUnlimited ? '∞' : paidTokens.toLocaleString()}
            </Text>
            <Text style={[s.statCaption, { color: colors.textMuted }]}>
              {t('Limit')}: {isUnlimited ? '∞' : freeLimit.toLocaleString()}
            </Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.dangerBg, borderColor: colors.border }]}>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>{t('30-Day Consumption')}</Text>
            <Text style={[s.statValue, { color: colors.danger, textAlign: 'center' }]}>
              {totalThirtyDay.toLocaleString()}
            </Text>
            <Text style={[s.statCaption, { color: colors.textMuted }]} numberOfLines={1}>
              {t('Cumulative tokens deducted in last 30 days')}
            </Text>
          </View>
          <View style={[s.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.statLabel, { color: colors.textMuted }]}>{t('Replenishment Cycle')}</Text>
            <Text style={[s.statValue, { color: colors.ink, fontSize: font.sizes.base, textAlign: 'center' }]}>
              {nextRenewalDate(balance?.last_renewal ?? undefined, locale)}
            </Text>
            <Text style={[s.statCaption, { color: colors.textMuted }]} numberOfLines={1}>
              {t('Date of next monthly free token replenishment')}
            </Text>
          </View>
        </View>

        {!isUnlimited ? (
          <AnalyticsCard title="Free Usage">
            <View style={s.freeRow}>
              <View style={s.freeCell}>
                <Text style={[s.freeLabel, { color: colors.textMuted }]}>{t('Consumed')}</Text>
                <Text style={[s.freeValue, { color: colors.ink }]}>{freeConsumed.toLocaleString()}</Text>
              </View>
              <View style={s.freeCell}>
                <Text style={[s.freeLabel, { color: colors.textMuted }]}>{t('Remaining')}</Text>
                <Text style={[s.freeValue, { color: freeRemaining > 0 ? colors.primary : colors.danger }]}>
                  {freeRemaining.toLocaleString()}
                </Text>
              </View>
            </View>
          </AnalyticsCard>
        ) : null}

        <AnalyticsCard title="Daily Token Consumption (Last 30 Days)">
          {chartData.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.textMuted }]}>{t('No recent consumption data to display')}</Text>
          ) : (
            <BarChart data={chartData} color="#375DFB" height={180} />
          )}
        </AnalyticsCard>

        <AnalyticsCard title="Transaction History Log">
          {transactions.length === 0 ? (
            <Text style={[s.emptyText, { color: colors.textMuted }]}>{t('No transaction ledger history found.')}</Text>
          ) : (
            <View style={s.ledger}>
              {transactions.map((tx) => (
                <View key={tx._id} style={[s.txRow, { borderBottomColor: colors.borderLight }]}>
                  <View style={s.txLeft}>
                    <TxBadge type={tx.type} />
                    <Text style={[s.txDesc, { color: colors.textMuted }]} numberOfLines={1}>
                      {tx.description || '—'}
                    </Text>
                  </View>
                  <View style={s.txRight}>
                    <Text style={[s.txAmount, { color: tx.type === 'consume' ? colors.danger : colors.success }]}>
                      {tx.type === 'consume' ? `-${Math.abs(tx.amount).toLocaleString()}` : `+${Math.abs(tx.amount).toLocaleString()}`}
                    </Text>
                    <Text style={[s.txDate, { color: colors.textMuted }]}>
                      {fmtDate(tx.created_at, locale, true)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {totalPages > 1 ? (
            <View style={[s.pagination, { borderTopColor: colors.borderLight }]}>
              <Text style={[s.pageText, { color: colors.textMuted }]}>
                {t('Page')} {page} {t('of')} {totalPages}
              </Text>
              <View style={s.pageBtns}>
                <Pressable
                  disabled={page === 1}
                  onPress={() => setPage((prev) => Math.max(1, prev - 1))}
                  style={({ pressed }) => [
                    s.pageBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && s.pressed,
                    page === 1 && s.disabled,
                  ]}
                >
                  <Text style={[s.pageBtnText, { color: page === 1 ? colors.textMuted : colors.ink }]}>‹</Text>
                </Pressable>
                <Pressable
                  disabled={page === totalPages}
                  onPress={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                  style={({ pressed }) => [
                    s.pageBtn,
                    { backgroundColor: colors.surface, borderColor: colors.border },
                    pressed && s.pressed,
                    page === totalPages && s.disabled,
                  ]}
                >
                  <Text style={[s.pageBtnText, { color: page === totalPages ? colors.textMuted : colors.ink }]}>›</Text>
                </Pressable>
              </View>
            </View>
          ) : null}
        </AnalyticsCard>
      </View>
    </ScrollView>
  );
}

function TxBadge({ type }: { type: string }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  let label = t('Consumption');
  let bg = colors.dangerBg;
  let fg = colors.dangerText;
  if (type === 'topup') {
    label = t('Top-up');
    bg = colors.successBg;
    fg = colors.successText;
  } else if (type === 'monthly_replenish') {
    label = t('Monthly Free');
    bg = colors.primaryLight;
    fg = colors.primary;
  }
  return (
    <View style={[s.badge, { backgroundColor: bg }]}>
      <Text style={[s.badgeText, { color: fg }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  badge: { alignSelf: 'flex-start', borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  badgeText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  disabled: { opacity: 0.5 },
  emptyText: { fontSize: font.sizes.sm, paddingVertical: spacing.lg, textAlign: 'center' },
  freeCell: { flex: 1, gap: spacing.xs },
  freeLabel: { fontSize: font.sizes.sm },
  freeRow: { flexDirection: 'row', gap: spacing.md },
  freeValue: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  ledger: { gap: spacing.sm },
  pageBtn: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, height: 32, justifyContent: 'center', width: 32 },
  pageBtnText: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  pageBtns: { flexDirection: 'row', gap: spacing.sm },
  pageText: { fontSize: font.sizes.xs },
  pagination: { alignItems: 'center', borderTopWidth: 1, flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm, paddingTop: spacing.md },
  pressed: { opacity: 0.7 },
  statCard: { borderRadius: radii.xl, borderWidth: 1, flex: 1, gap: spacing.xs, padding: spacing.md },
  statCaption: { fontSize: font.sizes.xs },
  statLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  statRow: { flexDirection: 'row', gap: spacing.sm },
  statValue: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  txAmount: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  txDate: { fontSize: font.sizes.xs, marginTop: spacing.xs },
  txDesc: { flex: 1, fontSize: font.sizes.sm, marginTop: spacing.xs },
  txLeft: { flex: 1, gap: spacing.xs },
  txRight: { alignItems: 'flex-end' },
  txRow: { borderBottomWidth: 1, flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm },
});
