import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { EmptyState } from '../components/EmptyState';
import { InfoCard } from '../components/InfoCard';
import { Screen } from '../components/Screen';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { extractErrorMessage } from '../lib/http';
import { fetchAnalytics } from '../services/dashboard';
import { font, spacing } from '../theme';
import { Analytics } from '../types';

function countValue(data: Analytics | null, keys: string[]) {
  if (!data) return '0';
  for (const key of keys) {
    const value = data[key];
    if (typeof value === 'number' || typeof value === 'string') {
      return String(value);
    }
  }
  return '0';
}

export function HomeScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    setError('');
    try {
      setAnalytics(await fetchAnalytics(user));
    } catch (loadError) {
      setError(extractErrorMessage(loadError));
    } finally {
      setRefreshing(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const isEmployee = user?.type === 'Employee';

  return (
    <Screen scroll={false} padded={false}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={[styles.eyebrow, { color: colors.primary }]}>{isEmployee ? 'مساحة الموظف' : 'لوحة التحكم'}</Text>
          <Text style={[styles.greeting, { color: colors.ink }]}>أهلًا {user?.name || user?.email} 👋</Text>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statsRow}>
            <InfoCard title="المهام" value={countValue(analytics, ['tasks', 'totalTasks', 'tasksCount'])} tone="soft" />
            <InfoCard title="المشاريع" value={countValue(analytics, ['projects', 'totalProjects', 'projectsCount'])} />
          </View>
          <View style={styles.statsRow}>
            <InfoCard title="الحضور" value={countValue(analytics, ['attendances', 'attendance', 'attendanceCount'])} tone="info" />
            <InfoCard title="الطلبات" value={countValue(analytics, ['requests', 'employeeRequests', 'requestsCount'])} tone="warning" />
          </View>
        </View>

        {refreshing && (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}

        {error ? (
          <View style={styles.errorWrap}>
            <EmptyState title="تعذر تحميل الإحصائيات" message={error} icon="⚠️" />
          </View>
        ) : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, gap: spacing.lg, paddingTop: spacing.md },
  errorWrap: { paddingHorizontal: spacing.md },
  greeting: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold, textAlign: 'right' },
  header: { gap: spacing.xs, paddingHorizontal: spacing.md },
  loadingWrap: { paddingVertical: spacing.md },
  eyebrow: { fontSize: font.sizes.sm, fontWeight: font.weights.extrabold, textAlign: 'right' },
  statsContainer: { gap: spacing.md, paddingHorizontal: spacing.md },
  statsRow: { gap: spacing.md, flexDirection: 'row' },
});
