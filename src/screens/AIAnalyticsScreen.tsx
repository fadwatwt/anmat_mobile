import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchTokenBalance, TokenBalance } from '../services/ai';
import { font, radii, spacing } from '../theme';

export default function AIAnalyticsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const b = await fetchTokenBalance();
        setBalance(b);
      } catch {}
      setLoading(false);
    })();
  }, []);

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

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={s.content}>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.cardTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Token Balance')}</Text>
          <Text style={[s.balanceAmount, { color: colors.primary, textAlign: 'center' }]}>
            {isUnlimited ? '∞' : paidTokens.toLocaleString()}
          </Text>
          <Text style={[s.balanceLabel, { color: colors.textMuted, textAlign: 'center' }]}>{t('Paid Tokens')}</Text>
        </View>

        {!isUnlimited ? (
          <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.cardTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Free Usage')}</Text>
            <View style={s.statRow}>
              <Text style={[s.statLabel, { color: colors.textMuted }]}>{t('Limit')}</Text>
              <Text style={[s.statValue, { color: colors.ink }]}>{freeLimit.toLocaleString()}</Text>
            </View>
            <View style={s.statRow}>
              <Text style={[s.statLabel, { color: colors.textMuted }]}>{t('Consumed')}</Text>
              <Text style={[s.statValue, { color: colors.ink }]}>{freeConsumed.toLocaleString()}</Text>
            </View>
            <View style={s.statRow}>
              <Text style={[s.statLabel, { color: colors.textMuted }]}>{t('Remaining')}</Text>
              <Text style={[s.statValue, { color: freeRemaining > 0 ? colors.primary : colors.danger }]}>{freeRemaining.toLocaleString()}</Text>
            </View>
          </View>
        ) : null}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  balanceAmount: { fontSize: 48, fontWeight: font.weights.bold, marginVertical: spacing.sm },
  balanceLabel: { fontSize: font.sizes.sm },
  card: { borderWidth: 1, borderRadius: radii.xxl, padding: spacing.lg, gap: spacing.sm },
  cardTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  statLabel: { fontSize: font.sizes.sm },
  statRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
