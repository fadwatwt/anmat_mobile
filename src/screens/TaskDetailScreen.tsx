import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { DetailScreen } from '../generators/DetailScreen';
import { fetchTaskById } from '../services/tasks';
import { TaskItem } from '../types';

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
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  pending: 'Pending',
  'in-progress': 'In Progress',
  completed: 'Completed',
  done: 'Done',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

export default function TaskDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const passedTask = route.params?.task as TaskItem | undefined;
  const taskId = passedTask?._id || route.params?.id;

  // Start with the passed-in task for instant render, then refresh from the backend.
  const [task, setTask] = useState<TaskItem | undefined>(passedTask);

  useEffect(() => {
    if (!taskId) return;
    fetchTaskById(taskId).then(setTask).catch(() => {});
  }, [taskId]);

  const s = (task?.status || '').toLowerCase();
  const p = (task?.priority || '').toLowerCase();

  const sections = [
    {
      titleKey: 'Task Info',
      rows: [
        { labelKey: 'Title', value: task?.title || task?.name || '--' },
        { labelKey: 'Description', value: task?.description || '--' },
        {
          labelKey: 'Status',
          render: <Badge label={t(statusLabels[s] || task?.status || '--')} variant={statusVariant[s] || 'default'} />,
        },
        {
          labelKey: 'Priority',
          render: <Badge label={t(priorityLabels[p] || task?.priority || '--')} variant={priorityVariant[p] || 'default'} />,
        },
        { labelKey: 'Progress', value: task?.progress != null ? `${task.progress}%` : '--' },
      ],
    },
    {
      titleKey: 'Assignment',
      rows: [
        { labelKey: 'Project', value: task?.project?.name || (task as any)?.project_id?.name || '--' },
        { labelKey: 'Department', value: task?.department?.name || (task as any)?.department_id?.name || '--' },
        { labelKey: 'Assignee', value: task?.assignee?.name || (task as any)?.assignee_id?.name || '--' },
      ],
    },
    {
      titleKey: 'Dates',
      rows: [
        { labelKey: 'Start Date', value: task?.start_date || '--' },
        { labelKey: 'Due Date', value: task?.due_date || '--' },
        { labelKey: 'End Date', value: task?.end_date || '--' },
      ],
    },
  ];

  return (
    <DetailScreen
      sections={sections}
      actions={[
        {
          labelKey: 'Edit',
          onPress: () => navigation.navigate('TaskCreate', { task }),
          variant: 'primary',
        },
      ]}
      header={{
        title: task?.title || task?.name || '--',
        status: { label: t(statusLabels[s] || task?.status || '--'), variant: statusVariant[s] || 'default' },
      }}
    />
  );
}
