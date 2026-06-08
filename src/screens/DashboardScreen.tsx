import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Badge } from '../components/Badge';
import { BarChart } from '../components/BarChart';
import { DoughnutChart } from '../components/DoughnutChart';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { extractErrorMessage, http } from '../lib/http';
import { fetchAnalytics } from '../services/dashboard';
import { ApiResponse } from '../types';
import { font, radii, spacing } from '../theme';
import { Calendar, CheckSquare, DollarSign, Users } from 'lucide-react-native';

const statusColorMap: Record<string, string> = {
  completed: '#38C793',
  in_progress: '#375DFB',
  active: '#375DFB',
  open: '#375DFB',
  late_completed: '#F17B2C',
  cancelled: '#DF1C41',
  overdue: '#DF1C41',
  on_hold: '#6B7280',
  pending: '#FACC15',
};

const extraColors = ['#8B5CF6', '#EC4899', '#06B6D4', '#10B981', '#F59E0B'];

function getProjectStatusVariant(s?: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (!s) return 'default';
  const l = s.toLowerCase();
  if (l === 'completed' || l === 'completed_before_due_date') return 'success';
  if (l === 'in_progress' || l === 'active') return 'info';
  if (l === 'on_hold') return 'warning';
  if (l === 'cancelled' || l === 'overdue') return 'danger';
  return 'default';
}

function getProjectStatusLabel(s?: string): string {
  if (!s) return 'Pending';
  const map: Record<string, string> = {
    active: 'Active', open: 'Active', in_progress: 'Active',
    completed: 'Completed', completed_before_due_date: 'Completed',
    late_completed: 'Late Completed', cancelled: 'Cancelled',
    overdue: 'Overdue', on_hold: 'On Hold', pending: 'Pending',
  };
  return map[s.toLowerCase()] || s;
}

function formatDate(d?: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('ar');
}

type AnalyticsData = {
  overview?: { totalProjects?: number; totalTasks?: number; totalDepartments?: number; totalEmployees?: number };
  tasksSummary?: { name: string; value: number }[];
  departmentsRanking?: { rank: number; name: string; rating: number; performance: number }[];
  recentProjects?: any[];
  [key: string]: any;
};

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const userType = user?.type;
  const isSubscriber = userType === 'Subscriber';

  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const [projects, setProjects] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);

  const loadAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const rawAnalytics = await fetchAnalytics(user);
      setAnalytics(rawAnalytics as AnalyticsData);

      if (isSubscriber) {
        const [projRes, logRes] = await Promise.all([
          http.get<ApiResponse<any[]>>('/api/subscriber/organization/projects').catch(() => null),
          http.get<ApiResponse<any[]>>('/api/activity-logs/my-organization', { params: { limit: 10 } }).catch(() => null),
        ]);
        if (projRes?.data?.data) setProjects(projRes.data.data);
        if (logRes?.data?.data) setLogs(logRes.data.data);
      }
    } catch (e) {
      setError(extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, [user, isSubscriber]);

  useEffect(() => { loadAll(); }, [loadAll]);

  const overview = analytics?.overview;
  const tasksSummary = analytics?.tasksSummary || [];
  const departmentsRanking = analytics?.departmentsRanking || [];

  const chartData = tasksSummary.length > 0
    ? {
        total: tasksSummary.reduce((s, t) => s + t.value, 0),
        records: tasksSummary.map((t, i) => ({
          title: t.name.charAt(0).toUpperCase() + t.name.slice(1).replace(/_/g, ' '),
          value: t.value,
          color: statusColorMap[t.name.toLowerCase()] || extraColors[i % extraColors.length],
        })),
      }
    : null;

  const statCardsData = [
    { key: 'tasks', label: 'المهام', icon: CheckSquare, value: overview?.totalTasks ?? 0 },
    { key: 'projects', label: 'المشاريع', icon: Users, value: overview?.totalProjects ?? 0 },
    { key: 'departments', label: 'الأقسام', icon: Calendar, value: overview?.totalDepartments ?? 0 },
    { key: 'employees', label: 'الموظفين', icon: DollarSign, value: overview?.totalEmployees ?? 0 },
  ];

  if (loading && !analytics) {
    return (
      <View style={[styles.centerLoading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (error && !analytics) {
    return (
      <View style={[styles.centerLoading, { backgroundColor: colors.background }]}>
        <EmptyState title="تعذر التحميل" message={error} icon="⚠️" />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={styles.scrollContent}
      data={['stats', 'charts', 'projects', 'logs']}
      keyExtractor={(item) => item}
      onRefresh={loadAll}
      refreshing={loading}
      showsVerticalScrollIndicator={false}
      renderItem={({ item: section }) => {
        switch (section) {
          case 'stats':
            return (
              <View>
                <View style={styles.greetingSection}>
                  <Text style={[styles.eyebrow, { color: colors.primary }]}>لوحة التحكم</Text>
                  <Text style={[styles.greeting, { color: colors.ink }]}>أهلاً {user?.name || user?.email}</Text>
                </View>
                <View style={styles.statsGrid}>
                  {statCardsData.map((card) => (
                    <View key={card.key} style={styles.statCardWrap}>
                      <View style={[styles.statCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                        <Text style={[styles.statLabel, { color: colors.textMuted }]}>{card.label}</Text>
                        <Text style={[styles.statValue, { color: colors.primary }]}>{card.value}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );

          case 'charts':
            if (!isSubscriber || (!chartData && departmentsRanking.length === 0)) return null;
            return (
              <View style={styles.chartsRow}>
                {chartData && (
                  <View style={styles.chartCol}>
                    <DoughnutChart data={chartData.records} total={chartData.total} centerTitle="TASKS" />
                  </View>
                )}
                {departmentsRanking.length > 0 && (
                  <View style={styles.chartCol}>
                    <BarChart
                      data={departmentsRanking.map((d) => ({ name: d.name, rate: d.rating || d.performance }))}
                      title="Departments"
                    />
                  </View>
                )}
              </View>
            );

          case 'projects':
            if (!isSubscriber) return null;
            return (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.tableTitle }]}>Projects Overview</Text>
                  <TouchableOpacity>
                    <Text style={[styles.seeAll, { color: colors.primary }]}>See All</Text>
                  </TouchableOpacity>
                </View>
                {projects.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No projects yet</Text>
                  </View>
                ) : (
                  <View style={[styles.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <View style={[styles.tableHeader, { backgroundColor: colors.background, borderBottomColor: colors.border }]}>
                      <Text style={[styles.th, { color: colors.textMuted }]}>Project</Text>
                      <Text style={[styles.th, { color: colors.textMuted }]}>Dept</Text>
                      <Text style={[styles.th, { color: colors.textMuted }]}>Status</Text>
                      <Text style={[styles.th, { color: colors.textMuted }]}>Progress</Text>
                      <Text style={[styles.th, { color: colors.textMuted }]}>Due</Text>
                    </View>
                    {projects.slice(0, 5).map((proj, i) => (
                      <View key={proj._id || i} style={[styles.tableRow, { borderBottomColor: colors.border }]}>
                        <Text style={[styles.td, styles.tdName, { color: colors.textCell }]} numberOfLines={1}>
                          {proj.name || proj.title || 'Untitled'}
                        </Text>
                        <Text style={[styles.td, { color: colors.textMuted }]} numberOfLines={1}>
                          {proj.department_id?.name || '-'}
                        </Text>
                        <View style={styles.td}>
                          <Badge label={getProjectStatusLabel(proj.status)} variant={getProjectStatusVariant(proj.status)} size="sm" />
                        </View>
                        <View style={styles.td}>
                          <View style={styles.progressWrap}>
                            <View style={[styles.progressTrack, { backgroundColor: colors.background }]}>
                              <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${proj.progress || 0}%` }]} />
                            </View>
                            <Text style={[styles.progressText, { color: colors.textMuted }]}>{proj.progress || 0}%</Text>
                          </View>
                        </View>
                        <Text style={[styles.td, { color: colors.textMuted }]}>{formatDate(proj.due_date)}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );

          case 'logs':
            if (!isSubscriber) return null;
            return (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.tableTitle }]}>Activity Logs</Text>
                {logs.length === 0 ? (
                  <View style={[styles.emptyCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.emptyText, { color: colors.textMuted }]}>No recent activity</Text>
                  </View>
                ) : (
                  <View style={[styles.logsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    {logs.slice(0, 5).map((log, i) => (
                      <View key={log._id || i} style={[styles.logItem, i < 4 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
                        <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
                        <View style={styles.logContent}>
                          <Text style={[styles.logAction, { color: colors.ink }]} numberOfLines={1}>
                            {log.action || log.description || 'Activity'}
                          </Text>
                          {log.createdAt && (
                            <Text style={[styles.logTime, { color: colors.textMuted }]}>
                              {formatDate(log.createdAt)}
                            </Text>
                          )}
                        </View>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );

          default:
            return null;
        }
      }}
    />
  );
}

const styles = StyleSheet.create({
  centerLoading: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  chartCol: { flex: 1, minWidth: 200 },
  chartsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, paddingBottom: spacing.md },
  emptyCard: { alignItems: 'center', borderWidth: 1, borderRadius: radii.xxl, padding: spacing.xl },
  emptyText: { fontSize: font.sizes.sm },
  greeting: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold, textAlign: 'right' },
  greetingSection: { gap: spacing.xs, marginBottom: spacing.md },
  eyebrow: { fontSize: font.sizes.sm, fontWeight: font.weights.extrabold, textAlign: 'right' },
  logAction: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  logContent: { flex: 1, gap: 2 },
  logDot: { borderRadius: 4, height: 8, marginTop: 4, width: 8 },
  logItem: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, paddingVertical: spacing.sm },
  logTime: { fontSize: font.sizes.xs },
  logsCard: { borderRadius: radii.xxl, borderWidth: 1, padding: spacing.md },
  progressFill: { borderRadius: radii.full, height: '100%' },
  progressText: { fontSize: font.sizes.xs, minWidth: 30, textAlign: 'right' },
  progressTrack: { borderRadius: radii.full, flex: 1, height: 6, overflow: 'hidden' },
  progressWrap: { alignItems: 'center', flex: 1, flexDirection: 'row', gap: spacing.xs },
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xxl },
  section: { gap: spacing.sm },
  sectionHeader: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold },
  seeAll: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  statCard: { borderWidth: 1, borderRadius: radii.xxl, gap: spacing.sm, minHeight: 90, padding: spacing.md },
  statCardWrap: { width: '48%' },
  statLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  statValue: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', paddingBottom: spacing.sm },
  td: { flex: 1, fontSize: font.sizes.xs },
  tdName: { fontWeight: font.weights.medium },
  th: { flex: 1, fontSize: font.sizes.xs, fontWeight: font.weights.semibold, textAlign: 'left' },
  tableCard: { borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden' },
  tableHeader: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  tableRow: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
});
