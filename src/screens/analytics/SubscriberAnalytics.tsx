import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AnalyticsCard } from '../../components/AnalyticsCard';
import { DonutChart } from '../../charts/DonutChart';
import { BarChart } from '../../charts/BarChart';
import { GaugeChart } from '../../charts/GaugeChart';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchSubscriberAnalyticsFull,
  SubscriberAnalyticsData,
  NamedValue,
} from '../../services/analytics';

const SUMMARY_COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#0EA5E9', '#EC4899'];
const RATING_COLORS: Record<string, string> = { 'High Rating': '#10B981', 'Medium Rating': '#FBBF24', 'Low Rating': '#EF4444', 'No Ratings': '#9CA3AF' };
const ATTENDANCE_COLORS: Record<string, string> = { Attended: '#4F46E5', Absent: '#FBBF24', 'On Time': '#10B981', Late: '#F59E0B' };
const DEPARTMENT_COLORS: Record<string, string> = { 'On Time': '#4F46E5', Late: '#FBBF24', 'Completed on time': '#10B981', Overdue: '#EF4444' };

const decorate = (arr: NamedValue[] | undefined, palette?: Record<string, string>) =>
  (arr || []).map((item, i) => ({
    key: `${item.name}-${i}`,
    value: item.value,
    label: item.name,
    color: (palette && palette[item.name]) || SUMMARY_COLORS[i % SUMMARY_COLORS.length],
  }));

const sumValues = (arr: { value: number }[]) => arr.reduce((acc, x) => acc + (x.value || 0), 0);

function formatBytes(bytes: number | string | undefined, t: (k: string) => string) {
  if (bytes === 'Unlimited') return t('Unlimited');
  if (!bytes || bytes === 0) return '0 MB';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(Number(bytes)) / Math.log(k));
  return parseFloat((Number(bytes) / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <Text style={[styles.sectionTitle, { color: colors.cellSecondary, textAlign: isRTL ? 'right' : 'left' }]}>
      {children}
    </Text>
  );
}

export function SubscriberAnalytics() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [data, setData] = useState<SubscriberAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setData(await fetchSubscriberAnalyticsFull());
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;
  if (error || !data) return <Text style={[styles.errorText, { color: colors.danger }]}>{t('Error loading analytics data.')}</Text>;

  const tasksSummary = decorate(data.tasksSummary, undefined);
  const tasksRating = decorate(data.tasksRatingData, RATING_COLORS);
  const employeeAttendance = decorate(data.employeeAttendance, ATTENDANCE_COLORS);
  const employeeAdherence = decorate(data.employeeAdherence, ATTENDANCE_COLORS);
  const departmentAdherence = decorate(data.departmentAdherence, DEPARTMENT_COLORS);
  const departmentPerformance = decorate(data.departmentPerformance, DEPARTMENT_COLORS);

  const tasksDelay = data.tasksDelay || { percentage: 0, expectedHours: 0, actualHours: 0 };
  const subUsage = data.subscriptionUsage || {
    employees: { current: 0, max: 'Unlimited', percentage: 0 },
    storage: { currentBytes: 0, maxBytes: 'Unlimited', percentage: 0 },
  };

  const tasksPerf = (data.tasksPerformanceMonthly || []).map((m, i) => ({
    key: String(m.name ?? i), label: String(m.name ?? ''), value: Number((m as any).completed ?? (m as any).value ?? 0), color: '#4F46E5',
  }));
  const deptRanking = data.departmentsRanking || [];

  return (
    <View style={styles.container}>
      <Text style={[styles.pageTitle, { color: colors.tableTitle, textAlign: isRTL ? 'right' : 'left' }]}>
        {t('All Analytics Overview')}
      </Text>

      {/* Subscription Usage */}
      <SectionTitle>{t('Subscription Usage')}</SectionTitle>
      <AnalyticsCard title="Employees Quota">
        <GaugeChart
          percentage={subUsage.employees.percentage}
          label={t('EMPLOYEES')}
          primaryColor="#10B981"
          footerData={[
            { text: t('Current Employees: {{count}}', { count: subUsage.employees.current }), color: '#10B981' },
            { text: t('Allowed in Plan: {{max}}', { max: subUsage.employees.max }), color: colors.borderLight },
          ]}
        />
      </AnalyticsCard>
      <AnalyticsCard title="Storage Quota">
        <GaugeChart
          percentage={subUsage.storage.percentage}
          label={t('STORAGE')}
          primaryColor="#4F46E5"
          footerData={[
            { text: t('Used Storage: {{storage}}', { storage: formatBytes(subUsage.storage.currentBytes, t) }), color: '#4F46E5' },
            { text: t('Plan Limit: {{limit}}', { limit: formatBytes(subUsage.storage.maxBytes, t) }), color: colors.borderLight },
          ]}
        />
      </AnalyticsCard>

      {/* Tasks Analytics */}
      <SectionTitle>{t('Tasks Analytics')}</SectionTitle>
      {tasksSummary.length > 0 && (
        <AnalyticsCard title="Tasks Summary">
          <DonutChart data={tasksSummary} total={data.overview?.totalTasks ?? sumValues(tasksSummary)} subtitle={t('TASKS')} />
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

      {/* Projects Analytics */}
      <SectionTitle>{t('Projects Analytics')}</SectionTitle>
      <ProjectsProgressCard projects={data.projectsProgress || []} title="Projects Performance" />
      <ProjectsProgressCard projects={data.recentProjects || []} title="Last 4 Projects" />

      {/* Employees Analytics */}
      <SectionTitle>{t('Employees Analytics')}</SectionTitle>
      {employeeAttendance.length > 0 && (
        <AnalyticsCard title="Employee Attendance">
          <DonutChart data={employeeAttendance} total={sumValues(employeeAttendance)} subtitle={t('DAYS')} />
        </AnalyticsCard>
      )}
      {employeeAdherence.length > 0 && (
        <AnalyticsCard title="Employee Adherence">
          <DonutChart data={employeeAdherence} total={sumValues(employeeAdherence)} subtitle={t('RECORDS')} />
        </AnalyticsCard>
      )}
      <AnalyticsCard title="Tasks Delay">
        <GaugeChart
          percentage={tasksDelay.percentage}
          label={t('DELAY')}
          footerData={[
            { text: t('Employee completed task in {{hours}} hours', { hours: tasksDelay.actualHours }), color: '#F59E0B' },
            { text: t('Expected Time was {{hours}} Hours', { hours: tasksDelay.expectedHours }), color: colors.borderLight },
          ]}
        />
      </AnalyticsCard>
      <TopEmployeesCard employees={(data.topEmployees || []).slice(0, 3)} />

      {/* Department Analytics */}
      <SectionTitle>{t('Department Analytics')}</SectionTitle>
      {departmentAdherence.length > 0 && (
        <AnalyticsCard title="Department Adherence">
          <DonutChart data={departmentAdherence} total={sumValues(departmentAdherence)} subtitle={t('Tasks')} />
        </AnalyticsCard>
      )}
      {departmentPerformance.length > 0 && (
        <AnalyticsCard title="Department Performance">
          <DonutChart data={departmentPerformance} total={sumValues(departmentPerformance)} subtitle={t('TASKS')} />
        </AnalyticsCard>
      )}
      {deptRanking.length > 0 && (
        <AnalyticsCard title="Departments Ranking">
          <View style={styles.rankList}>
            {deptRanking.map((row, i) => (
              <View key={row._id || `${row.name}-${i}`} style={[styles.rankRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.rankIndex, { color: colors.textMuted }]}>{i + 1}</Text>
                <Text style={[styles.rankName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{row.name}</Text>
                <Text style={[styles.rankValue, { color: colors.primary }]}>{row.rate ?? row.performance ?? row.tasks ?? 0}</Text>
              </View>
            ))}
          </View>
        </AnalyticsCard>
      )}
    </View>
  );
}

function ProjectsProgressCard({ projects, title }: { projects: SubscriberAnalyticsData['projectsProgress']; title: string }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  if (!projects || projects.length === 0) return null;
  return (
    <AnalyticsCard title={title}>
      <View style={styles.rankList}>
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

function TopEmployeesCard({ employees }: { employees: SubscriberAnalyticsData['topEmployees'] }) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  if (!employees || employees.length === 0) return null;
  return (
    <AnalyticsCard title="Top 3 Employees">
      <View style={styles.rankList}>
        {employees.map((e, i) => (
          <View key={e._id || `${e.name}-${i}`} style={[styles.rankRow, { borderBottomColor: colors.border }]}>
            <Text style={[styles.rankIndex, { color: colors.textMuted }]}>{i + 1}</Text>
            <Text style={[styles.rankName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{e.name}</Text>
            <Text style={[styles.rankValue, { color: colors.primary }]}>{e.rate ?? e.performance ?? e.tasks ?? 0}</Text>
          </View>
        ))}
      </View>
    </AnalyticsCard>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  errorText: { fontSize: font.sizes.base, padding: spacing.xl, textAlign: 'center' },
  loading: { padding: spacing.xxl },
  pageTitle: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold, marginBottom: spacing.xs },
  progressFill: { borderRadius: radii.full, height: '100%' },
  progressTrack: { borderRadius: radii.full, height: 6, overflow: 'hidden' },
  projectHead: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  projectName: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  projectPct: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  projectRow: { gap: spacing.xs },
  rankIndex: { fontSize: font.sizes.sm, fontWeight: font.weights.bold, width: 20 },
  rankList: { gap: spacing.sm },
  rankName: { flex: 1, fontSize: font.sizes.sm },
  rankRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  rankValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  sectionTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.bold, letterSpacing: 1.5, marginTop: spacing.md, textTransform: 'uppercase' },
});
