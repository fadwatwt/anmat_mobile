import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '../components/Badge';
import { EmptyState } from '../components/EmptyState';
import { useTheme } from '../context/ThemeContext';
import { extractErrorMessage } from '../lib/http';
import { completeTask, fetchTasks } from '../services/tasks';
import { font, radii, spacing } from '../theme';
import { TaskItem } from '../types';

const priorityMap: Record<string, { label: string; variant: 'danger' | 'warning' | 'info' | 'default' }> = {
  urgent: { label: 'عاجل', variant: 'danger' },
  high: { label: 'مرتفع', variant: 'danger' },
  medium: { label: 'متوسط', variant: 'info' },
  low: { label: 'منخفض', variant: 'default' },
};

function getPriority(key?: string) {
  if (!key) return { label: 'عادي', variant: 'default' as const };
  return priorityMap[key.toLowerCase()] || { label: key, variant: 'default' as const };
}

export default function TasksScreen() {
  const { colors } = useTheme();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try { setTasks(await fetchTasks()); } catch (e) { setError(extractErrorMessage(e)); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleComplete(id: string) {
    setActiveId(id);
    try { await completeTask(id); await load(); } catch (e) { setError(extractErrorMessage(e)); } finally { setActiveId(null); }
  }

  return (
    <View style={styles.container}>
      {loading && !tasks.length ? <ActivityIndicator color={colors.primary} /> : null}
      {error ? <EmptyState title="خطأ" message={error} icon="⚠️" /> : null}
      <FlatList
        contentContainerStyle={styles.list}
        data={tasks}
        keyExtractor={(item) => item._id}
        ListEmptyComponent={!loading && !error ? <EmptyState title="لا توجد مهام" message="ستظهر المهام هنا" icon="📋" /> : null}
        onRefresh={load}
        refreshing={loading}
        renderItem={({ item }) => {
          const title = item.title || item.name || 'مهمة بدون عنوان';
          const isDone = item.status?.toLowerCase() === 'completed';
          const priority = getPriority(item.priority);
          return (
            <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={styles.cardTop}>
                <Text style={[styles.taskTitle, { color: colors.ink }]} numberOfLines={2}>{title}</Text>
                <Badge label={isDone ? 'مكتملة' : item.status || 'جديدة'} variant={isDone ? 'success' : 'info'} />
              </View>
              {item.description ? <Text style={[styles.desc, { color: colors.textMuted }]} numberOfLines={2}>{item.description}</Text> : null}
              <View style={styles.cardBottom}>
                <Badge label={priority.label} variant={priority.variant} />
                {!isDone ? (
                  <Pressable disabled={activeId === item._id} onPress={() => handleComplete(item._id)} style={({ pressed }) => [styles.completeBtn, { backgroundColor: colors.primary }, pressed && { opacity: 0.85 }]}>
                    <Text style={styles.completeText}>{activeId === item._id ? '...' : 'إنهاء'}</Text>
                  </Pressable>
                ) : <Text style={[styles.doneText, { color: colors.successText }]}>✓ تم</Text>}
              </View>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.xxl, gap: spacing.md, padding: spacing.md },
  cardBottom: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  cardTop: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  completeBtn: { borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  completeText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  container: { flex: 1 },
  desc: { fontSize: font.sizes.sm, textAlign: 'right' },
  doneText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  list: { gap: spacing.md, padding: spacing.md },
  taskTitle: { flex: 1, fontSize: font.sizes.base, fontWeight: font.weights.bold, textAlign: 'right' },
});
