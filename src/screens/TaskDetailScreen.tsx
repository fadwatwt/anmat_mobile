import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { ArrowLeft, Send, Trash2 } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { EvaluationModal } from '../components/EvaluationModal';
import { DetailScreen } from '../generators/DetailScreen';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  fetchTaskById,
  updateTask,
  updateMyTaskStatus,
  evaluateTask,
  evaluateSubscriberTask,
  addSubscriberTaskComment,
  deleteSubscriberTaskComment,
  addEmployeeTaskComment,
  deleteEmployeeTaskComment,
} from '../services/tasks';
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

// Mirrors the web TasksList status options (evaluation handles "done").
const ALLOWED_STATUSES = ['open', 'pending', 'in-progress', 'completed', 'rejected', 'cancelled'];

export default function TaskDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions, user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const passedTask = route.params?.task as TaskItem | undefined;
  const taskId = passedTask?._id || route.params?.id;

  const isEmployee = user?.type === 'Employee';

  // Start with the passed-in task for instant render, then refresh from the backend.
  const [task, setTask] = useState<TaskItem | undefined>(passedTask);
  const [comments, setComments] = useState<any[]>(Array.isArray(passedTask?.comments) ? passedTask.comments : []);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [evalVisible, setEvalVisible] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);

  const refresh = useCallback(() => {
    if (!taskId) return;
    fetchTaskById(taskId)
      .then((updated) => {
        setTask(updated);
        if (Array.isArray(updated.comments)) setComments(updated.comments);
      })
      .catch(() => {});
  }, [taskId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );

  const canUpdate = has('tasks.update');
  const canEvaluate = has('tasks.evaluate');

  const changeStatus = async (status: string) => {
    if (!taskId) return;
    try {
      if (isEmployee) {
        await updateMyTaskStatus(taskId, status);
      } else {
        await updateTask(taskId, { status });
      }
      refresh();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update status'));
    }
  };

  const handleChangeStatus = () => {
    if (!task) return;
    const buttons = ALLOWED_STATUSES.map((s) => ({
      text: t(statusLabels[s] || s),
      onPress: () => changeStatus(s),
    }));
    Alert.alert(t('Update Task Status'), task.title || task.name || '', [
      ...buttons,
      { text: t('Cancel'), style: 'cancel' as const },
    ]);
  };

  const handleEvaluate = async (data: any) => {
    if (!taskId) return;
    setEvalSubmitting(true);
    try {
      if (isEmployee) {
        await evaluateTask(taskId, data);
      } else {
        await evaluateSubscriberTask(taskId, data);
      }
      setEvalVisible(false);
      Alert.alert(t('Success'), t('Task evaluated successfully'));
      refresh();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to submit evaluation'));
    } finally {
      setEvalSubmitting(false);
    }
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!taskId || !text) return;
    setSendingComment(true);
    try {
      const created = isEmployee
        ? await addEmployeeTaskComment(taskId, text)
        : await addSubscriberTaskComment(taskId, text);
      setComments(prev => [...prev, created]);
      setCommentText('');
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!taskId) return;
    Alert.alert(t('Delete Comment'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            if (isEmployee) {
              await deleteEmployeeTaskComment(taskId, commentId);
            } else {
              await deleteSubscriberTaskComment(taskId, commentId);
            }
            setComments(prev => prev.filter(c => c._id !== commentId));
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const s = (task?.status || '').toLowerCase();
  const p = (task?.priority || '').toLowerCase();

  const sections: any[] = [
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

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  sections.push({
    titleKey: 'Comments',
    rows: [
      ...(comments.length === 0
        ? [{ render: (
            <View>
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No comments yet')}</Text>
            </View>
          ) }]
        : comments.map(c => ({
            render: (
              <View style={{ gap: spacing.xs, flex: 1 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.ink, fontWeight: '700', fontSize: font.sizes.sm, textAlign: align }}>
                    {c.user?.name || t('User')}
                  </Text>
                  <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}>
                    {c.created_at || c.createdAt ? (
                      <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
                        {(c.created_at || c.createdAt || '').slice(0, 10)}
                      </Text>
                    ) : null}
                    {canUpdate ? (
                      <TouchableOpacity onPress={() => handleDeleteComment(c._id)} hitSlop={8}>
                        <Trash2 size={14} color="#DF1C41" />
                      </TouchableOpacity>
                    ) : null}
                  </View>
                </View>
                <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }}>
                  {c.text || c.comment || '--'}
                </Text>
              </View>
            ),
          }))),
      canUpdate ? {
        render: (
          <View style={[styles.commentBox, { borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TextInput
              style={[styles.commentInput, { color: colors.ink, textAlign: align }]}
              value={commentText}
              onChangeText={setCommentText}
              placeholder={t('Add a comment...')}
              placeholderTextColor={colors.textMuted}
              multiline
              editable={!sendingComment}
            />
            <TouchableOpacity
              onPress={handleAddComment}
              disabled={sendingComment || !commentText.trim()}
              style={[styles.sendBtn, { backgroundColor: colors.primary }]}
            >
              <Send size={16} color="#FFF" />
            </TouchableOpacity>
          </View>
        ),
      } : null,
    ].filter(Boolean),
  });

  const actions: any[] = [];
  if (taskId) {
    actions.push({
      labelKey: 'Edit',
      onPress: () => navigation.navigate('TaskCreate', { task }),
      variant: 'primary' as const,
    });
  }
  if (taskId && canUpdate) {
    actions.push({
      labelKey: 'Change Status',
      onPress: () => handleChangeStatus(),
      variant: 'secondary' as const,
    });
  }
  if (taskId && canEvaluate) {
    actions.push({
      labelKey: 'Evaluate & Done',
      onPress: () => setEvalVisible(true),
      variant: 'secondary' as const,
    });
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('Task Details')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <DetailScreen
        sections={sections}
        actions={actions}
        header={{
          title: task?.title || task?.name || '--',
          status: { label: t(statusLabels[s] || task?.status || '--'), variant: statusVariant[s] || 'default' },
        }}
      />

      <EvaluationModal
        visible={evalVisible}
        onClose={() => setEvalVisible(false)}
        onSubmit={handleEvaluate}
        type="task"
        isSubmitting={evalSubmitting}
        hasStages={!!task && Array.isArray(task.stages) && task.stages.length > 0}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  backBtn: { width: 40, padding: spacing.xs },
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold, flex: 1 },
  commentBox: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderWidth: 1,
    borderRadius: radii.lg,
    padding: spacing.xs,
    gap: spacing.xs,
  },
  commentInput: {
    flex: 1,
    fontSize: font.sizes.sm,
    minHeight: 36,
    maxHeight: 90,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
