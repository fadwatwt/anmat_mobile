import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import {
  Building2, FolderKanban, CheckSquare, Users, TrendingUp, TrendingDown,
  Clock, XCircle, HelpCircle, AlertTriangle, Info, CheckCircle,
  ChevronDown, MoreHorizontal, Edit, Lock, Calendar, DollarSign,
  Briefcase, ListChecks,
} from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { DonutChart } from '../charts/DonutChart';
import { BarChart } from '../charts/BarChart';
import { GroupedBarChart } from '../charts/GroupedBarChart';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';
import {
  fetchAdminAnalytics,
  fetchAdminSubscriptions,
  fetchIndustriesOrganizationsCount,
  fetchAdminOrganizations,
  fetchSubscriberAnalyticsOverview,
  fetchSubscriberTaskStats,
  fetchSubscriberDepartments,
  fetchSubscriberProjects,
  fetchOrganizationLogs,
  fetchEmployeeAnalyticsOverview,
  fetchEmployeeTaskStats,
  fetchEmployeeTasks,
  fetchEmployeeLogs,
} from '../services/dashboard';
import type {
  AdminAnalytics, AnalyticsOverview, TaskStatistics, DepartmentRating,
  DashboardProject, ActivityLogItem, SubscriptionBasic, IndustryCount,
  EmployeeDashboardTask,
} from '../types';

// ===== Color Maps (web-matching) =====

const statusColorMap: Record<string, string> = {
  open: '#375DFB', in_progress: '#F17B2C', completed: '#38C793',
  completed_before_due_date: '#38C793', late_completed: '#F17B2C',
  cancelled: '#DF1C41', overdue: '#9E1C1C', on_hold: '#6B7280',
  pending: '#FACC15', active: '#375DFB',
};

const statusLabelMap: Record<string, string> = {
  active: 'Active', open: 'Active', in_progress: 'In Progress',
  completed: 'Completed', completed_before_due_date: 'Completed',
  late_completed: 'Late Completed', cancelled: 'Cancelled',
  overdue: 'Overdue', on_hold: 'On Hold', pending: 'Pending',
};

const donutColors = ['#375DFB', '#38C793', '#F17B2C', '#DF1C41', '#7E3AF2', '#FBBC05', '#0F9D58', '#4285F4', '#DB4437', '#673AB7'];

function statusVariant(s?: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  const l = (s || '').toLowerCase();
  if (['completed', 'completed_before_due_date', 'paid', 'approved', 'active'].includes(l)) return 'success';
  if (['in_progress', 'open'].includes(l)) return 'info';
  if (['on_hold', 'pending', 'scheduled'].includes(l)) return 'warning';
  if (['cancelled', 'overdue', 'rejected', 'terminated', 'expired', 'inactive'].includes(l)) return 'danger';
  return 'default';
}

function statusLabel(s?: string): string {
  return statusLabelMap[(s || '').toLowerCase()] || s || 'Pending';
}

function fmtDate(d?: string) {
  if (!d) return '--';
  return new Date(d).toLocaleDateString('ar-SA');
}

// ===== Summary Card =====

function SummaryCard({ title, value, icon: Icon, color, trend }: {
  title: string; value: number | string; icon: any; color: string; trend?: { value: number; up: boolean };
}) {
  const { colors } = useTheme();
  return (
    <View style={[s.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[s.summaryIconWrap, { backgroundColor: color + '18' }]}>
        <Icon size={22} color={color} strokeWidth={1.5} />
      </View>
      <View style={s.summaryInfo}>
        <Text style={[s.summaryTitle, { color: colors.textMuted }]}>{title}</Text>
        <View style={s.summaryValueRow}>
          <Text style={[s.summaryValue, { color: colors.ink }]}>{value}</Text>
          {trend && (
            <View style={[s.trendBadge, { backgroundColor: trend.up ? '#E7F8ED' : '#FEE2E5' }]}>
              {trend.up ? <TrendingUp size={12} color="#1F7A3F" /> : <TrendingDown size={12} color="#C9372C" />}
              <Text style={[s.trendText, { color: trend.up ? '#1F7A3F' : '#C9372C' }]}>{Math.abs(trend.value)}%</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

// ===== Admin Dashboard =====

function AdminDashboardContent() {
  const { colors } = useTheme();
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [subscriptions, setSubscriptions] = useState<SubscriptionBasic[]>([]);
  const [industries, setIndustries] = useState<IndustryCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [a, subs, inds] = await Promise.all([
          fetchAdminAnalytics(),
          fetchAdminSubscriptions(1, 5),
          fetchIndustriesOrganizationsCount(),
        ]);
        setAnalytics(a);
        setSubscriptions(subs.data || []);
        setIndustries(inds || []);
      } catch (e) {
        console.error('Admin dashboard error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={s.loadingState} color={colors.primary} />;

  const summaryCards = [
    { title: 'Total Companies', value: analytics?.totalCompanies ?? 0, icon: Building2, color: '#375DFB', trend: { value: 12, up: true } },
    { title: 'Active Projects', value: analytics?.totalProjects ?? 0, icon: FolderKanban, color: '#7E3AF2', trend: { value: 8, up: true } },
    { title: 'Total Tasks', value: analytics?.totalTasks ?? 0, icon: CheckSquare, color: '#F17B2C', trend: { value: 3, up: false } },
    { title: 'System Users', value: analytics?.totalUsers ?? 0, icon: Users, color: '#38C793', trend: { value: 5, up: true } },
  ];

  const industryData = (industries || []).map((ind, i) => ({
    key: ind._id, value: ind.organizations_count, color: donutColors[i % donutColors.length], label: ind.name,
  }));

  const subscriptionData = (analytics?.companiesSubscriptionsMonthly || []).map(m => ({
    key: m.name, value: m.total, label: m.name,
  }));

  return (
    <View style={s.section}>
      <View style={s.summaryGrid}>
        {summaryCards.map(c => <SummaryCard key={c.title} {...c} />)}
      </View>

      <View style={s.chartsRow}>
        {industryData.length > 0 && (
          <View style={[s.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.chartCardTitle, { color: colors.ink }]}>Industries</Text>
            <DonutChart data={industryData} subtitle="ORGANIZATIONS" size={140} strokeWidth={24} />
          </View>
        )}
        {subscriptionData.length > 0 && (
          <View style={[s.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.chartCardTitle, { color: colors.ink }]}>Subscriptions</Text>
            <BarChart data={subscriptionData} color="#38C793" height={180} barSize={20} />
          </View>
        )}
      </View>

      <View style={[s.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.sectionTitle, { color: colors.ink }]}>Recent Subscriptions</Text>
        {subscriptions.length === 0 ? (
          <Text style={[s.emptyText, { color: colors.textMuted }]}>No subscriptions</Text>
        ) : (
          <View>
            <View style={[s.tableHead, { backgroundColor: colors.background }]}>
              {['Subscriber', 'Company', 'Status', 'Start', 'Expiration'].map(h => (
                <Text key={h} style={[s.th, { color: colors.textMuted }]}>{h}</Text>
              ))}
            </View>
            {subscriptions.map(sub => (
              <View key={sub._id} style={[s.tableRow2, { borderBottomColor: colors.border }]}>
                <Text style={[s.td2, { color: colors.ink }]} numberOfLines={1}>{sub.subscriber?.name}</Text>
                <Text style={[s.td2, { color: colors.ink }]} numberOfLines={1}>{sub.organization?.name}</Text>
                <View><Badge label={statusLabel(sub.status)} variant={statusVariant(sub.status)} size="sm" /></View>
                <Text style={[s.td2, { color: colors.textMuted }]}>{fmtDate(sub.starts_at)}</Text>
                <Text style={[s.td2, { color: colors.textMuted }]}>{fmtDate(sub.expires_at)}</Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </View>
  );
}

// ===== Subscriber Dashboard =====

function SubscriberDashboardContent() {
  const { colors } = useTheme();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null);
  const [departments, setDepartments] = useState<DepartmentRating[]>([]);
  const [projects, setProjects] = useState<DashboardProject[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, ts, deps, projs, lgs] = await Promise.all([
          fetchSubscriberAnalyticsOverview(),
          fetchSubscriberTaskStats().catch(() => null),
          fetchSubscriberDepartments().catch(() => []),
          fetchSubscriberProjects(1, 5).catch(() => ({ data: [] })),
          fetchOrganizationLogs(5).catch(() => []),
        ]);
        setOverview(ov);
        setTaskStats(ts);
        setDepartments(deps);
        setProjects(projs.data || []);
        setLogs(lgs || []);
      } catch (e) {
        console.error('Subscriber dashboard error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={s.loadingState} color={colors.primary} />;

  const statCards = [
    { title: 'المهام', value: overview?.total_tasks ?? 0, icon: CheckSquare, color: '#375DFB' },
    { title: 'المشاريع', value: overview?.total_projects ?? 0, icon: FolderKanban, color: '#7E3AF2' },
    { title: 'الأقسام', value: overview?.total_departments ?? 0, icon: Building2, color: '#F17B2C' },
    { title: 'الموظفين', value: overview?.total_employees ?? 0, icon: Users, color: '#38C793' },
  ];

  const statusLabels: Record<string, string> = {
    open: 'Open', in_progress: 'In Progress', completed: 'Completed',
    late_completed: 'Late Completed', cancelled: 'Cancelled',
    on_hold: 'On Hold', pending: 'Pending', overdue: 'Overdue',
  };
  const taskDonutData = taskStats ? Object.entries(taskStats.status_counts || {}).map(([key, value], i) => ({
    key, value, color: statusColorMap[key] || donutColors[i % donutColors.length], label: statusLabels[key] || key,
  })) : [];

  const deptBarData = departments.map(d => ({
    key: d._id, value: Math.round((d.rate || 0) * 5), label: d.name.length > 6 ? d.name.slice(0, 6) + '..' : d.name,
    color: '#375DFB',
  }));

  return (
    <View style={s.section}>
      <View style={s.summaryGrid}>
        {statCards.map(c => <SummaryCard key={c.title} {...c} />)}
      </View>

      <View style={s.chartsRow}>
        {taskDonutData.length > 0 && (
          <View style={[s.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.chartCardTitle, { color: colors.ink }]}>Tasks Summary</Text>
            <DonutChart data={taskDonutData} total={taskStats?.total} subtitle="TASKS" size={140} strokeWidth={24} />
          </View>
        )}
        {deptBarData.length > 0 && (
          <View style={[s.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.chartCardTitle, { color: colors.ink }]}>Departments</Text>
            <BarChart data={deptBarData} yDomain={[0, 5]} height={180} barSize={20} />
          </View>
        )}
      </View>

      {projects.length > 0 && (
        <View style={[s.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.ink }]}>Projects Overview</Text>
            <TouchableOpacity><Text style={[s.seeAll, { color: colors.primary }]}>See All</Text></TouchableOpacity>
          </View>
          <View style={[s.tableHead, { backgroundColor: colors.background }]}>
            {['Project', 'Department', 'Status', 'Progress', 'Delivery'].map(h => (
              <Text key={h} style={[s.th, { color: colors.textMuted }]}>{h}</Text>
            ))}
          </View>
          {projects.map(p => (
            <View key={p._id} style={[s.tableRow2, { borderBottomColor: colors.border }]}>
              <Text style={[s.td2, s.tdName, { color: colors.ink }]} numberOfLines={1}>{p.name || p.title}</Text>
              <Text style={[s.td2, { color: colors.textMuted }]} numberOfLines={1}>{p.department?.name || '-'}</Text>
              <View><Badge label={statusLabel(p.status)} variant={statusVariant(p.status)} size="sm" /></View>
              <View style={s.progressWrap}>
                <View style={[s.progressTrack, { backgroundColor: colors.background }]}>
                  <View style={[s.progressFill, { backgroundColor: statusColorMap[p.status || ''] || colors.primary, width: `${p.progress || 0}%` as any }]} />
                </View>
                <Text style={[s.progressText, { color: colors.textMuted }]}>{p.progress || 0}%</Text>
              </View>
              <Text style={[s.td2, { color: colors.textMuted }]}>{fmtDate(p.due_date)}</Text>
            </View>
          ))}
        </View>
      )}

      {logs.length > 0 && (
        <View style={[s.logsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.ink }]}>Activity Logs</Text>
          {logs.map((log, i) => (
            <View key={log._id || i} style={[s.logItem, i < logs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[s.logDot, { backgroundColor: colors.primary }]} />
              <View style={s.logContent}>
                <Text style={[s.logAction, { color: colors.ink }]} numberOfLines={1}>{log.action || log.description || 'Activity'}</Text>
                <Text style={[s.logTime, { color: colors.textMuted }]}>{fmtDate(log.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ===== Employee Dashboard =====

function EmployeeDashboardContent() {
  const { colors } = useTheme();
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [taskStats, setTaskStats] = useState<TaskStatistics | null>(null);
  const [tasks, setTasks] = useState<EmployeeDashboardTask[]>([]);
  const [logs, setLogs] = useState<ActivityLogItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [ov, ts, tks, lgs] = await Promise.all([
          fetchEmployeeAnalyticsOverview(),
          fetchEmployeeTaskStats().catch(() => null),
          fetchEmployeeTasks(1, 5).catch(() => ({ data: [] })),
          fetchEmployeeLogs(5).catch(() => []),
        ]);
        setOverview(ov);
        setTaskStats(ts);
        setTasks(tks.data || []);
        setLogs(lgs || []);
      } catch (e) {
        console.error('Employee dashboard error:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={s.loadingState} color={colors.primary} />;

  const statCards = [
    { title: 'مهامي', value: overview?.total_tasks ?? 0, icon: CheckSquare, color: '#375DFB' },
    { title: 'المشاريع', value: overview?.total_projects ?? 0, icon: FolderKanban, color: '#7E3AF2' },
    { title: 'الحضور', value: overview?.total_departments ?? 0, icon: Clock, color: '#F17B2C' },
    { title: 'الطلبات', value: overview?.total_employees ?? 0, icon: ListChecks, color: '#38C793' },
  ];

  const statusLabels: Record<string, string> = {
    open: 'Open', in_progress: 'In Progress', completed: 'Completed',
    late_completed: 'Late Completed', cancelled: 'Cancelled',
    on_hold: 'On Hold', pending: 'Pending', overdue: 'Overdue',
  };
  const taskDonutData = taskStats ? Object.entries(taskStats.status_counts || {}).map(([key, value], i) => ({
    key, value, color: statusColorMap[key] || donutColors[i % donutColors.length], label: statusLabels[key] || key,
  })) : [];

  const green = '#38C793', orange = '#F17B2C';
  const performanceGroups = [
    { key: 'on_time', label: 'On Time', bars: [{ key: 'on_time', value: tasks.filter(t => t.status === 'completed' || t.status === 'completed_before_due_date').length, color: green, label: 'On-Time' }] },
    { key: 'late', label: 'Late', bars: [{ key: 'late', value: tasks.filter(t => t.status === 'late_completed').length, color: orange, label: 'Late' }] },
  ];

  return (
    <View style={s.section}>
      <View style={s.summaryGrid}>
        {statCards.map(c => <SummaryCard key={c.title} {...c} />)}
      </View>

      <View style={s.chartsRow}>
        {taskDonutData.length > 0 && (
          <View style={[s.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.chartCardTitle, { color: colors.ink }]}>Tasks Summary</Text>
            <DonutChart data={taskDonutData} total={taskStats?.total} subtitle="TASKS" size={140} strokeWidth={24} />
          </View>
        )}
        {tasks.length > 0 && (
          <View style={[s.chartCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[s.chartCardTitle, { color: colors.ink }]}>Performance</Text>
            <GroupedBarChart groups={performanceGroups} height={160} />
            <View style={s.legendRow}>
              <View style={s.legendItem}><View style={[s.legendDot2, { backgroundColor: green }]} /><Text style={[s.legendLabel2, { color: colors.textMuted }]}>On-Time</Text></View>
              <View style={s.legendItem}><View style={[s.legendDot2, { backgroundColor: orange }]} /><Text style={[s.legendLabel2, { color: colors.textMuted }]}>Late</Text></View>
            </View>
          </View>
        )}
      </View>

      {tasks.length > 0 && (
        <View style={[s.tableCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={s.sectionHeader}>
            <Text style={[s.sectionTitle, { color: colors.ink }]}>My Tasks</Text>
            <TouchableOpacity><Text style={[s.seeAll, { color: colors.primary }]}>See All</Text></TouchableOpacity>
          </View>
          <View style={[s.tableHead, { backgroundColor: colors.background }]}>
            {['Task', 'Department', 'Status', 'Due Date'].map(h => (
              <Text key={h} style={[s.th, { color: colors.textMuted }]}>{h}</Text>
            ))}
          </View>
          {tasks.map(t => (
            <View key={t._id} style={[s.tableRow2, { borderBottomColor: colors.border }]}>
              <Text style={[s.td2, s.tdName, { color: colors.ink }]} numberOfLines={1}>{t.title || t.name}</Text>
              <Text style={[s.td2, { color: colors.textMuted }]} numberOfLines={1}>{t.department?.name || '-'}</Text>
              <View><Badge label={statusLabel(t.status)} variant={statusVariant(t.status)} size="sm" /></View>
              <Text style={[s.td2, { color: colors.textMuted }]}>{fmtDate(t.due_date)}</Text>
            </View>
          ))}
        </View>
      )}

      {logs.length > 0 && (
        <View style={[s.logsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.sectionTitle, { color: colors.ink }]}>Recent Activity</Text>
          {logs.map((log, i) => (
            <View key={log._id || i} style={[s.logItem, i < logs.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}>
              <View style={[s.logDot, { backgroundColor: colors.primary }]} />
              <View style={s.logContent}>
                <Text style={[s.logAction, { color: colors.ink }]} numberOfLines={1}>{log.action || log.description || 'Activity'}</Text>
                <Text style={[s.logTime, { color: colors.textMuted }]}>{fmtDate(log.createdAt)}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ===== Main Dashboard Screen =====

export default function DashboardScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const userType = user?.type;

  const content = () => {
    switch (userType) {
      case 'Admin': return <AdminDashboardContent />;
      case 'Subscriber': return <SubscriberDashboardContent />;
      case 'Employee': return <EmployeeDashboardContent />;
      default: return <EmptyState title="Dashboard" message="Unknown user type" icon="❓" />;
    }
  };

  return (
    <FlatList
      contentContainerStyle={s.scrollContent}
      data={['main']}
      keyExtractor={() => 'main'}
      showsVerticalScrollIndicator={false}
      ListHeaderComponent={
        <View style={s.greetingSection}>
          <Text style={[s.eyebrow, { color: colors.primary }]}>Dashboard Overview</Text>
          <Text style={[s.greeting, { color: colors.ink }]}>
            Welcome back, {user?.name || user?.email || 'User'}
          </Text>
        </View>
      }
      renderItem={() => content()}
    />
  );
}

// ===== Styles =====

const s = StyleSheet.create({
  scrollContent: { gap: spacing.md, paddingBottom: spacing.xxl, paddingTop: spacing.sm },
  greetingSection: { gap: spacing.xs, marginBottom: spacing.sm },
  eyebrow: { fontSize: font.sizes.sm, fontWeight: font.weights.extrabold },
  greeting: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold },
  loadingState: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  section: { gap: spacing.md },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold },
  seeAll: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },

  // Summary cards
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  summaryCard: {
    width: '48%', borderRadius: radii.xxl, borderWidth: 1, padding: spacing.md,
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  summaryIconWrap: { width: 44, height: 44, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  summaryInfo: { flex: 1, gap: 2 },
  summaryTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  summaryValueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  summaryValue: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  trendBadge: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  trendText: { fontSize: 10, fontWeight: font.weights.semibold },

  // Charts
  chartsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chartCard: {
    flex: 1, minWidth: '46%', borderRadius: radii.xxl, borderWidth: 1, padding: spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  chartCardTitle: { fontSize: font.sizes.base, fontWeight: font.weights.semibold, marginBottom: spacing.sm },

  // Tables
  tableCard: { borderRadius: radii.xl, borderWidth: 1, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  tableHead: { flexDirection: 'row', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: radii.lg, marginTop: spacing.sm },
  th: { flex: 1, fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  tableRow2: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  td2: { flex: 1, fontSize: font.sizes.xs },
  tdName: { fontWeight: font.weights.medium },

  // Progress bar
  progressWrap: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: spacing.xs },
  progressTrack: { flex: 1, height: 6, borderRadius: radii.full, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: radii.full },
  progressText: { fontSize: font.sizes.xs, minWidth: 28 },

  // Logs
  logsCard: { borderRadius: radii.xxl, borderWidth: 1, padding: spacing.md, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2 },
  logItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  logDot: { width: 8, height: 8, borderRadius: 4 },
  logContent: { flex: 1, gap: 2 },
  logAction: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  logTime: { fontSize: font.sizes.xs },

  // Legend
  legendRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot2: { width: 8, height: 8, borderRadius: 4 },
  legendLabel2: { fontSize: font.sizes.xs },

  // Empty
  emptyText: { fontSize: font.sizes.sm, textAlign: 'center', padding: spacing.md },
});
