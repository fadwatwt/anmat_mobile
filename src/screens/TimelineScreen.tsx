import React, { useCallback, useEffect, useState } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Circle, CheckCircle2, Clock, AlertCircle } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchTasks } from '../services/tasks';
import { TaskItem } from '../types';
import { EmptyState } from '../components/EmptyState';
import { useNavigation } from '@react-navigation/native';
import { font, spacing, radii } from '../theme';

const statusIcons: Record<string, typeof Circle> = {
  completed: CheckCircle2,
  in_progress: Clock,
  pending: Circle,
  cancelled: AlertCircle,
  overdue: AlertCircle,
};

const statusColors: Record<string, string> = {
  completed: '#1F7A3F',
  in_progress: '#1E40AF',
  pending: '#6B7280',
  cancelled: '#C9372C',
  overdue: '#C9372C',
};

export default function TimelineScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const result = await fetchTasks();
      const items = Array.isArray(result) ? result : [];
      items.sort((a, b) => {
        const dateA = a.due_date || a.createdAt || '';
        const dateB = b.due_date || b.createdAt || '';
        return dateA.localeCompare(dateB);
      });
      setTasks(items);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const renderItem = ({ item }: { item: TaskItem }) => {
    const Icon = statusIcons[item.status || 'pending'] || Circle;
    const color = statusColors[item.status || 'pending'] || '#6B7280';
    const title = item.title || item.name || '—';

    return (
      <TouchableOpacity
        style={[s.itemRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        onPress={() => navigation.navigate('TaskDetail', { id: item._id })}
        activeOpacity={0.7}
      >
        <View style={s.timelineLeft}>
          <Icon size={18} color={color} />
          <View style={[s.line, { backgroundColor: colors.border }]} />
        </View>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
          {item.description && (
            <Text style={[s.description, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
              {item.description}
            </Text>
          )}
          <View style={[s.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {item.due_date && (
              <Text style={[s.meta, { color: colors.textMuted }]}>
                {t('Due')}: {new Date(item.due_date).toLocaleDateString('en-GB')}
              </Text>
            )}
            {item.project?.name && (
              <Text style={[s.meta, { color: colors.primary }]}>{item.project.name}</Text>
            )}
          </View>
          {item.assignee?.name && (
            <Text style={[s.assignee, { color: colors.textMuted }]}>
              {t('Assignee')}: {item.assignee.name}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (tasks.length === 0) {
    return (
      <EmptyState title={t('No timeline items')} message={t('No tasks or items to display on the timeline')} />
    );
  }

  return (
    <FlatList
      data={tasks}
      keyExtractor={(item) => item._id}
      renderItem={renderItem}
      contentContainerStyle={s.list}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadData(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    />
  );
}

const s = StyleSheet.create({
  assignee: {
    fontSize: font.sizes.xs,
    marginTop: spacing.xs,
  },
  card: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    flex: 1,
    padding: spacing.md,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  description: {
    fontSize: font.sizes.sm,
    marginTop: spacing.xs,
  },
  itemRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.md,
  },
  line: {
    flex: 1,
    width: 2,
    marginVertical: spacing.xs,
  },
  list: {
    gap: spacing.sm,
    paddingBottom: spacing.xxl,
  },
  meta: {
    fontSize: font.sizes.xs,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xs,
    flexWrap: 'wrap',
  },
  title: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.semibold,
  },
  timelineLeft: {
    alignItems: 'center',
    width: 24,
  },
});
