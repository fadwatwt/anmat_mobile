import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Users, Info } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';

type Props = {
  used?: number;
  limit?: number;
  unlimited?: boolean;
  loading?: boolean;
};

export function AccountQuotaCard({ used = 0, limit = 0, unlimited = false, loading }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const pct = unlimited || limit <= 0 ? 0 : Math.min(100, Math.round((used / limit) * 100));
  const isFull = !unlimited && limit > 0 && used >= limit;
  const barColor = unlimited ? colors.primary : isFull ? colors.danger : pct >= 80 ? colors.warning : colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <Users size={18} color={colors.primary} />
        <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Twitter Accounts Quota')}</Text>
        {loading && <ActivityIndicator size="small" color={colors.primary} />}
      </View>

      {!loading && (
        <>
          <View style={[styles.valueRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.value, { color: colors.ink }]}>
              {used}
              <Text style={[styles.valueSub, { color: colors.textMuted }]}> / {unlimited ? '∞' : limit}</Text>
            </Text>
            {isFull && <Text style={[styles.full, { color: colors.danger }]}>{t('Limit reached')}</Text>}
          </View>

          <View style={[styles.track, { backgroundColor: colors.statusBg }]}>
            <View style={[styles.fill, { backgroundColor: barColor, width: unlimited ? '100%' : (`${pct}%` as any) }]} />
          </View>

          {isFull && (
            <View style={[styles.notice, { backgroundColor: colors.statusBg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Info size={14} color={colors.warning} />
              <Text style={[styles.noticeText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {t('You have reached your account quota. Contact your administrator to increase it.')}
              </Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: radii.xxl, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  fill: { borderRadius: radii.full, height: '100%' },
  full: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  header: { alignItems: 'center', gap: spacing.sm },
  notice: { alignItems: 'flex-start', borderRadius: radii.lg, gap: spacing.xs, padding: spacing.sm },
  noticeText: { flex: 1, fontSize: font.sizes.xs },
  title: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  track: { borderRadius: radii.full, height: 8, overflow: 'hidden' },
  value: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold },
  valueRow: { alignItems: 'baseline', justifyContent: 'space-between' },
  valueSub: { fontSize: font.sizes.base, fontWeight: font.weights.regular },
});
