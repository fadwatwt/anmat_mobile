import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnalyticsCard } from '../../components/AnalyticsCard';
import { DonutChart } from '../../charts/DonutChart';
import { BarChart } from '../../charts/BarChart';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, spacing } from '../../theme';
import { fetchAdminAnalyticsFull, AdminAnalyticsData, NamedValue } from '../../services/analytics';

const COLORS = ['#375DFB', '#38C793', '#F17B2C', '#DF1C41', '#7E3AF2', '#FBBC05', '#0F9D58'];

const decorate = (arr: NamedValue[] | undefined) =>
  (arr || []).map((item, i) => ({
    key: `${item.name}-${i}`,
    value: item.value,
    label: item.name,
    color: item.color || COLORS[i % COLORS.length],
  }));

const toBars = (arr: any[] | undefined, color: string) =>
  (arr || []).map((m, i) => ({
    key: String(m.name ?? i), label: String(m.name ?? ''), value: Number(m.total ?? m.value ?? m.completed ?? 0), color,
  }));

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return <Text style={[styles.sectionTitle, { color: colors.cellPrimary, textAlign: isRTL ? 'right' : 'left' }]}>{children}</Text>;
}

export function AdminAnalytics() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [data, setData] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setData(await fetchAdminAnalyticsFull());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;
  if (error || !data) return <Text style={[styles.errorText, { color: colors.danger }]}>{t('Error loading admin analytics.')}</Text>;

  const industries = decorate(data.industriesChart);
  const subsMonthly = toBars(data.companiesSubscriptionsMonthly, '#38C793');
  const projectsPerf = toBars(data.projectsPerformanceMonthly, '#375DFB');
  const revenues = toBars(data.revenuesMonthly, '#7E3AF2');
  const topCompanies = data.topCompanies || [];
  const lastProjects = data.lastProjects || [];

  return (
    <View style={styles.container}>
      <Text style={[styles.pageTitle, { color: colors.tableTitle, textAlign: isRTL ? 'right' : 'left' }]}>{t('All Analytics Overview')}</Text>

      <SectionTitle>{t('Companies Analytics')}</SectionTitle>
      {industries.length > 0 && (
        <AnalyticsCard title="Industries">
          <DonutChart data={industries} subtitle={t('ORGANIZATIONS')} />
        </AnalyticsCard>
      )}
      <AnalyticsCard title="Subscriptions">
        <View style={styles.statRow}>
          <Stat label={t('Total Companies')} value={data.totalCompanies ?? 0} color="#375DFB" />
          <Stat label={t('System Users')} value={data.totalUsers ?? 0} color="#38C793" />
        </View>
      </AnalyticsCard>
      {subsMonthly.length > 0 && (
        <AnalyticsCard title="Companies Subscriptions">
          <BarChart data={subsMonthly} color="#38C793" />
        </AnalyticsCard>
      )}
      {topCompanies.length > 0 && (
        <AnalyticsCard title="Top Companies">
          <View style={styles.list}>
            {topCompanies.map((c, i) => (
              <View key={c._id || `${c.name}-${i}`} style={[styles.rankRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rankIndex, { color: colors.textMuted }]}>{i + 1}</Text>
                <Text style={[styles.rankName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{c.name}</Text>
                <Text style={[styles.rankValue, { color: colors.primary }]}>{c.value ?? 0}</Text>
              </View>
            ))}
          </View>
        </AnalyticsCard>
      )}

      <SectionTitle>{t('Projects Analytics')}</SectionTitle>
      {projectsPerf.length > 0 && (
        <AnalyticsCard title="Projects Performance">
          <BarChart data={projectsPerf} />
        </AnalyticsCard>
      )}
      {lastProjects.length > 0 && (
        <AnalyticsCard title="Last Projects">
          <View style={styles.list}>
            {lastProjects.map((p, i) => (
              <View key={p._id || `${p.name}-${i}`} style={[styles.rankRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rankName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{p.name || p.title || '--'}</Text>
                <Text style={[styles.rankValue, { color: colors.textMuted }]}>{p.progress ?? 0}%</Text>
              </View>
            ))}
          </View>
        </AnalyticsCard>
      )}

      <SectionTitle>{t('Revenues & Engagement')}</SectionTitle>
      {revenues.length > 0 && (
        <AnalyticsCard title="Revenues">
          <BarChart data={revenues} color="#7E3AF2" />
        </AnalyticsCard>
      )}
    </View>
  );
}

function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={[styles.statCard, { backgroundColor: color + '14' }]}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  errorText: { fontSize: font.sizes.base, padding: spacing.xl, textAlign: 'center' },
  list: { gap: spacing.sm },
  loading: { padding: spacing.xxl },
  pageTitle: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold, marginBottom: spacing.xs },
  rankIndex: { fontSize: font.sizes.sm, fontWeight: font.weights.bold, width: 20 },
  rankName: { flex: 1, fontSize: font.sizes.sm },
  rankRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  rankValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginTop: spacing.md },
  statCard: { alignItems: 'center', borderRadius: 16, flex: 1, gap: spacing.xs, padding: spacing.lg },
  statLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  statRow: { flexDirection: 'row', gap: spacing.md },
  statValue: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold },
});
