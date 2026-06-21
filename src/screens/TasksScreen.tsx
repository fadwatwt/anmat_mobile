import { useState } from 'react';
import { Alert, Text, View } from 'react-native';
import { Edit3, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchTasks, deleteTask } from '../services/tasks';
import { TaskItem } from '../types';
import { font } from '../theme';

const priorityVariant: Record<string, 'danger' | 'warning' | 'info' | 'default'> = {
  urgent: 'danger',
  high: 'danger',
  medium: 'info',
  low: 'default',
};

const priorityLabels: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
};

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  open: 'default',
  pending: 'warning',
  'in-progress': 'info',
  completed: 'success',
  done: 'success',
  rejected: 'danger',
  cancelled: 'danger',
  delayed: 'warning',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  done: 'Done',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
  delayed: 'Delayed',
};

const fetchData = async (params: any) => {
  const data = await fetchTasks();
  const status = params?.filters?.status;
  const filtered = status && status !== 'all'
    ? data.filter((task: TaskItem) => (task.status || '').toLowerCase() === status)
    : data;
  return { data: filtered, total: filtered.length };
};

const statusFilterOptions = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Done', value: 'done' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function TasksScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();
  const [statusFilter, setStatusFilter] = useState('all');

  const handleDelete = (item: TaskItem) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Delete'), style: 'destructive', onPress: async () => { try { await deleteTask(item._id); } catch {} } },
    ]);
  };

  const columns = [
    {
      key: 'title',
      titleKey: 'Task',
      width: 200,
      render: (item: TaskItem) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
            {item.title || item.name || '--'}
          </Text>
          {item.description && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      ),
      sortable: true,
    },
    {
      key: 'project',
      titleKey: 'Project',
      width: 110,
      render: (item: TaskItem) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.project?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'department',
      titleKey: 'Department',
      width: 130,
      render: (item: TaskItem) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.department?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'assignee',
      titleKey: 'Assignee',
      width: 130,
      render: (item: TaskItem) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.assignee?.name || '--'}
        </Text>
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
      width: 100,
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
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {item.due_date || '--'}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: TaskItem) => item._id}
      searchable
      searchPlaceholderKey="Search tasks..."
      filters={[
        {
          key: 'status',
          labelKey: 'Status',
          options: statusFilterOptions,
          value: statusFilter,
          onChange: setStatusFilter,
        },
      ]}
      onCreate={() => navigation.navigate('TaskCreate')}
      onRowPress={(item: TaskItem) => navigation.navigate('TaskDetail', { task: item })}
      rowActions={(item: TaskItem) => [
        { label: t('Edit'), icon: <Edit3 size={16} color="#375DFB" />, onPress: () => navigation.navigate('TaskCreate', { task: item }) },
        { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true },
      ]}
      emptyTitleKey="No tasks found"
      emptyMessageKey="No tasks to display"
    />
  );
}
