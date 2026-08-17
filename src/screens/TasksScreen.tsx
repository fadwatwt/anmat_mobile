import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Edit3, Trash2, Eye, CheckCircle2, CalendarPlus } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { EvaluationModal } from '../components/EvaluationModal';
import { CreateAppointmentFromTaskModal } from '../components/agenda/CreateAppointmentFromTaskModal';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchTasks, deleteTask, updateTask, evaluateSubscriberTask } from '../services/tasks';
import { TaskItem } from '../types';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

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

// Mirrors the web TasksList status options (evaluation handles "done").
const ALLOWED_STATUSES = ['open', 'pending', 'in-progress', 'completed', 'rejected', 'cancelled'];

const statusFilterOptionsBuilder = (t: (key: string) => string) => [
  { label: t('All'), value: 'all' },
  { label: t('Open'), value: 'open' },
  { label: t('Pending'), value: 'pending' },
  { label: t('In Progress'), value: 'in-progress' },
  { label: t('Completed'), value: 'completed' },
  { label: t('Done'), value: 'done' },
  { label: t('Rejected'), value: 'rejected' },
  { label: t('Cancelled'), value: 'cancelled' },
];

export default function TasksScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions, user } = useAuth();
  const navigation = useNavigation<any>();
  const [statusFilter, setStatusFilter] = useState('all');
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [appointmentTask, setAppointmentTask] = useState<TaskItem | null>(null);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );

  const canCreate = has('tasks.create');
  const canUpdate = has('tasks.update');
  const canDelete = has('tasks.delete');
  const canEvaluate = has('tasks.evaluate');

  const reload = () => setReloadKey((k) => k + 1);

  const fetchData = useCallback(async (params: any) => {
    const data = await fetchTasks();
    const status = params?.filters?.status;
    const filtered = status && status !== 'all'
      ? data.filter((task: TaskItem) => (task.status || '').toLowerCase() === status)
      : data;
    return { data: filtered, total: filtered.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

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

  const openStatusModal = (item: TaskItem) => {
    setSelectedTask(item);
    setStatusModalOpen(true);
  };

  const openEvaluation = (item: TaskItem) => {
    setSelectedTask(item);
    setEvalModalOpen(true);
  };

  const changeStatus = async (status: string) => {
    if (!selectedTask) return;
    if (status === 'done') {
      setStatusModalOpen(false);
      setEvalModalOpen(true);
      return;
    }
    setStatusModalOpen(false);
    try {
      await updateTask(selectedTask._id, { status });
      reload();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update status'));
    }
  };

  const handleEvaluate = async (data: any) => {
    if (!selectedTask) return;
    setEvalSubmitting(true);
    try {
      await evaluateSubscriberTask(selectedTask._id, data);
      setEvalModalOpen(false);
      Alert.alert(t('Success'), t('Task evaluated successfully'));
      reload();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to submit evaluation'));
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleDelete = (item: TaskItem) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(item._id);
            reload();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to delete task'));
          }
        },
      },
    ]);
  };

  const rowActions = (item: TaskItem) => {
    const actions: { label: string; icon: React.ReactNode; onPress: () => void; destructive?: boolean }[] = [
      {
        label: t('View'),
        icon: <Eye size={16} color="#375DFB" />,
        onPress: () => navigation.navigate('TaskDetail', { task: item }),
      },
    ];
    if (canUpdate) {
      actions.push({
        label: t('Edit'),
        icon: <Edit3 size={16} color="#375DFB" />,
        onPress: () => navigation.navigate('TaskCreate', { task: item }),
      });
      actions.push({
        label: t('Change Status'),
        icon: <CheckCircle2 size={16} color="#375DFB" />,
        onPress: () => openStatusModal(item),
      });
    }
    if (canEvaluate) {
      actions.push({
        label: t('Evaluate & Done'),
        icon: <CheckCircle2 size={16} color="#16A34A" />,
        onPress: () => openEvaluation(item),
      });
    }
    if (canDelete) {
      actions.push({
        label: t('Delete'),
        icon: <Trash2 size={16} color="#DF1C41" />,
        destructive: true,
        onPress: () => handleDelete(item),
      });
    }
    actions.push({
      label: t('Create Appointment'),
      icon: <CalendarPlus size={16} color="#8B5CF6" />,
      onPress: () => setAppointmentTask(item),
    });
    return actions;
  };

  return (
    <>
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
            options: statusFilterOptionsBuilder(t),
            value: statusFilter,
            onChange: setStatusFilter,
          },
        ]}
        onCreate={canCreate ? () => navigation.navigate('TaskCreate') : undefined}
        onRowPress={(item: TaskItem) => navigation.navigate('TaskDetail', { task: item })}
        rowActions={rowActions}
        emptyTitleKey="No tasks found"
        emptyMessageKey="No tasks to display"
      />

      {/* Status change modal */}
      <Modal visible={statusModalOpen} onClose={() => setStatusModalOpen(false)} title={t('Change Status')} size="sm" noScroll>
        <View style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
          {ALLOWED_STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[styles.statusOption, { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => changeStatus(s)}
            >
              <Text style={{ color: colors.ink, fontSize: font.sizes.sm, fontWeight: '600', textAlign: isRTL ? 'right' : 'left' }}>
                {t(statusLabels[s] || s)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </Modal>

      {/* Evaluate & Done modal */}
      <EvaluationModal
        visible={evalModalOpen}
        onClose={() => setEvalModalOpen(false)}
        onSubmit={handleEvaluate}
        type="task"
        isSubmitting={evalSubmitting}
        hasStages={!!selectedTask && Array.isArray(selectedTask.stages) && selectedTask.stages.length > 0}
      />

      {/* Create appointment from task modal */}
      <CreateAppointmentFromTaskModal
        visible={!!appointmentTask}
        onClose={() => setAppointmentTask(null)}
        task={appointmentTask}
        onCreated={reload}
        role={user?.type}
      />
    </>
  );
}

const styles = StyleSheet.create({
  statusOption: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
