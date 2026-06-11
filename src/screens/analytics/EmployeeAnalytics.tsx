import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnalyticsCard } from '../../components/AnalyticsCard';
import { DonutChart } from '../../charts/DonutChart';
import { BarChart } from '../../charts/BarChart';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { fetchEmployeeAnalyticsFull, EmployeeAnalyticsData, NamedValue } from '../../services/analytics';

const SUMMARY_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9', '#EC4899'];
const RATING_COLORS: Record<string, string> = { 'High Rating': '#375DFB', 'Medium Rating': '#FBBF24', 'Low Rating': '#EF4444', 'No Ratings': '#9CA3AF' };

const decorate = (arr: NamedValue[] | undefined, palette?: Record<string, string>) =>
  (arr || []).map((item, i) => ({
    key: `${item.name}-${i}`,
    value: item.value,
    label: item.name,
    color: (palette && palette[item.name]) || SUMMARY_COLORS[i % SUMMARY_COLORS.length],
  }));

const sumValues = (arr: { value: number }[]) => arr.reduce((acc, x) => acc + (x.value || 0), 0);

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <Text style={[styles.sectionTitle, { color: colors.cellSecondary, textAlign: isRTL ? 'right' : 'left' }]}>{children}</Text>
  );
}

export function EmployeeAnalytics() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [data, setData] = useState<EmployeeAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setData(await fetchEmployeeAnalyticsFull());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;
  if (error || !data) return <Text style={[styles.errorText, { color: colors.danger }]}>{t('Error loading employee analytics.')}</Text>;

  const tasksSummary = decorate(data.tasksSummary, undefined);
  const tasksRating = decorate(data.tasksRatingData, RATING_COLORS);
  const tasksPerf = (data.tasksPerformanceMonthly || []).map((m, i) => ({
    key: String(m.name ?? i), label: String(m.name ?? ''), value: Number((m as any).completed ?? (m as any).value ?? 0), color: '#4F46E5',
  }));
  const projectsPerf = (data.projectsPerformanceMonthly || []).map((m, i) => ({
    key: String(m.name ?? i), label: String(m.name ?? ''), value: Number((m as any).completed ?? (m as any).value ?? 0), color: '#10B981',
  }));

  return (
    <View style={styles.container}>
      <Text style={[styles.pageTitle, { color: colors.tableTitle, textAlign: isRTL ? 'right' : 'left' }]}>{t('All Analytics Overview')}</Text>

      <SectionTitle>{t('Tasks Analytics')}</SectionTitle>
      {tasksSummary.length > 0 && (
        <AnalyticsCard title="Tasks Summary">
          <DonutChart data={tasksSummary} total={sumValues(tasksSummary)} subtitle={t('TASKS')} />
        </AnalyticsCard>
      )}
      {tasksPerf.length > 0 && (
        <AnalyticsCard title="Tasks Performance">
          <BarChart data={tasksPerf} />
        </AnalyticsCard>
      )}
      {tasksRating.length > 0 && (
        <AnalyticsCard title="Tasks Rating">
          <DonutChart data={tasksRating} total={sumValues(tasksRating)} subtitle={t('TASKS')} />
        </AnalyticsCard>
      )}

      <SectionTitle>{t('Projects Analysis')}</SectionTitle>
      {projectsPerf.length > 0 && (
        <AnalyticsCard title="Projects Performance">
          <BarChart data={projectsPerf} color="#10B981" />
        </AnalyticsCard>
      )}
      <ProjectsList projects={data.projectsPerformance || []} title="Projects Performance" />
      <ProjectsList projects={data.recentProjects || []} title="Last Projects" />
    </View>
  );
}

function ProjectsList({ projects, title }: { projects: EmployeeAnalyticsData['projectsPerformance']; title: string }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  if (!projects || projects.length === 0) return null;
  return (
    <AnalyticsCard title={title}>
      <View style={styles.list}>
        {projects.map((p, i) => (
          <View key={p._id || `${p.name}-${i}`} style={styles.projectRow}>
            <View style={styles.projectHead}>
              <Text style={[styles.projectName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                {p.name || p.title || '--'}
              </Text>
              <Text style={[styles.projectPct, { color: colors.textMuted }]}>{p.progress ?? 0}%</Text>
            </View>
            <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.min(100, p.progress ?? 0)}%` as any }]} />
            </View>
          </View>
        ))}
      </View>
    </AnalyticsCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  errorText: { fontSize: font.sizes.base, padding: spacing.xl, textAlign: 'center' },
  list: { gap: spacing.sm },
  loading: { padding: spacing.xxl },
  pageTitle: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold, marginBottom: spacing.xs },
  progressFill: { borderRadius: radii.full, height: '100%' },
  progressTrack: { borderRadius: radii.full, height: 6, overflow: 'hidden' },
  projectHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  projectName: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  projectPct: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  projectRow: { gap: spacing.xs },
  sectionTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.bold, letterSpacing: 1.5, marginTop: spacing.md, textTransform: 'uppercase' },
});
