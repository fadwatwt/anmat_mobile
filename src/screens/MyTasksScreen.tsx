import React, { useCallback, useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { RefreshCw, Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchMyTasks, updateMyTaskStatus } from '../services/tasks';
import { TaskItem } from '../types';
import { extractErrorMessage } from '../lib/http';
import { font } from '../theme';

const priorityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  urgent: 'danger', high: 'danger', medium: 'info', low: 'default',
};
const priorityLabels: Record<string, string> = {
  urgent: 'Urgent', high: 'High', medium: 'Medium', low: 'Low',
};
const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  open: 'default', pending: 'warning', 'in-progress': 'info', completed: 'success',
  done: 'success', rejected: 'danger', cancelled: 'danger', delayed: 'warning',
};
const statusLabels: Record<string, string> = {
  open: 'Open', pending: 'Pending', 'in-progress': 'In Progress', completed: 'Completed',
  done: 'Done', rejected: 'Rejected', cancelled: 'Cancelled', delayed: 'Delayed',
};

// Statuses the employee can move a task to (matches web allowedStatuses, minus 'done'
// which on web opens an evaluation modal — kept out of the mobile quick-change flow).
const CHANGEABLE_STATUSES = ['open', 'pending', 'in-progress', 'completed', 'rejected', 'cancelled'];

export function MyTasksScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();
  const [reloadKey, setReloadKey] = useState(0);

  const fetchData = useCallback(async () => {
    const data = await fetchMyTasks();
    return { data, total: data.length };
  }, [reloadKey]);

  const handleChangeStatus = (task: TaskItem) => {
    const buttons = CHANGEABLE_STATUSES.map((s) => ({
      text: t(statusLabels[s] || s),
      onPress: async () => {
        try {
          await updateMyTaskStatus(task._id, s);
          setReloadKey((k) => k + 1);
        } catch (e) {
          Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update status'));
        }
      },
    }));
    Alert.alert(t('Update Task Status'), task.title || task.name || '', [
      ...buttons,
      { text: t('Cancel'), style: 'cancel' as const },
    ]);
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const columns = [
    {
      key: 'title',
      titleKey: 'Task',
      width: 200,
      render: (item: TaskItem) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
            {item.title || item.name || '--'}
          </Text>
          {!!item.description && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'priority',
      titleKey: 'Priority',
      width: 90,
      render: (item: TaskItem) => {
        const p = (item.priority || '').toLowerCase();
        return <Badge label={t(priorityLabels[p] || item.priority || '--')} variant={priorityVariant[p] || 'default'} />;
      },
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 110,
      render: (item: TaskItem) => {
        const s = (item.status || '').toLowerCase();
        return <Badge label={t(statusLabels[s] || item.status || '--')} variant={statusVariant[s] || 'default'} />;
      },
    },
    {
      key: 'progress',
      titleKey: 'Progress',
      width: 90,
      render: (item: TaskItem) => (
        <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: 'center' }}>
          {item.progress ?? 0}%
        </Text>
      ),
    },
    {
      key: 'due_date',
      titleKey: 'Due Date',
      width: 100,
      render: (item: TaskItem) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
          {item.due_date || '--'}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      key={reloadKey}
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: TaskItem) => item._id}
      searchable
      searchPlaceholderKey="Search tasks..."
      onRowPress={(item: TaskItem) => navigation.navigate('TaskDetail', { task: item })}
      rowActions={(item: TaskItem) => [
        { label: t('View'), icon: <Eye size={16} color="#375DFB" />, onPress: () => navigation.navigate('TaskDetail', { task: item }) },
        { label: t('Change Status'), icon: <RefreshCw size={16} color={colors.primary} />, onPress: () => handleChangeStatus(item) },
      ]}
      emptyTitleKey="No tasks found"
      emptyMessageKey="No tasks to display"
    />
  );
}
