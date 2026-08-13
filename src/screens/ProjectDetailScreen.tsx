import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Paperclip, Send, Trash2 } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { DetailScreen } from '../generators/DetailScreen';
import { EvaluationModal } from '../components/EvaluationModal';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  fetchProjectDetails,
  evaluateProject,
  fetchProjectComments,
  addProjectComment,
  deleteProjectComment,
  deleteProjectAttachment,
  fetchProjectActivityLogs,
  uploadProjectAttachment,
  Project,
  ProjectComment,
  ProjectAttachment,
  ActivityLog,
} from '../services/projects';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const variantMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  active: 'success', completed: 'info', on_hold: 'warning', cancelled: 'danger', pending: 'default',
};
const getStatus = (s?: string, t?: (key: string) => string) => {
  if (!s) return { label: t ? t('Active') : 'Active', variant: 'success' as const };
  const normalized = s.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { label: t ? t(normalized) : normalized, variant: variantMap[s.toLowerCase()] || 'default' };
};

const taskVariantMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  completed: 'success', done: 'success', active: 'info', in_progress: 'info',
  pending: 'warning', on_hold: 'warning', cancelled: 'danger', overdue: 'danger',
};
const taskStatusLabel = (s?: string) => {
  const l = (s || '').toLowerCase();
  const map: Record<string, string> = {
    completed: 'Completed', done: 'Done', active: 'Active', in_progress: 'In Progress',
    pending: 'Pending', on_hold: 'On Hold', cancelled: 'Cancelled', overdue: 'Overdue',
  };
  return map[l] || s || 'Pending';
};

export default function ProjectDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const passedProject = route.params?.project as Project | undefined;
  const projectId = passedProject?._id || route.params?.id;

  const [project, setProject] = useState<Project | undefined>(passedProject);
  const [comments, setComments] = useState<ProjectComment[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [evalVisible, setEvalVisible] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);

  const refresh = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      fetchProjectDetails(projectId).then(setProject).catch(() => {}),
      fetchProjectComments(projectId).then(setComments).catch(() => {}),
      fetchProjectActivityLogs(projectId).then(setLogs).catch(() => {}),
    ]);
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canUpdate = Array.isArray(permissions) && (permissions.includes('*') || permissions.includes('projects.update'));
  const canEvaluate = Array.isArray(permissions) && (permissions.includes('*') || permissions.includes('projects.evaluate'));

  const handleEvaluate = async (data: any) => {
    if (!projectId) return;
    setEvaluating(true);
    try {
      const updated = await evaluateProject(projectId, { ...data, status: 'done' });
      if (updated) setProject(updated);
      setEvalVisible(false);
      Alert.alert(t('Success'), t('Project evaluated successfully'));
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to evaluate project'));
    } finally {
      setEvaluating(false);
    }
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!projectId || !text) return;
    setSendingComment(true);
    try {
      const created = await addProjectComment(projectId, text);
      setComments(prev => [...prev, created]);
      setCommentText('');
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSendingComment(false);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (!projectId) return;
    Alert.alert(t('Delete Comment'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProjectComment(projectId, commentId);
            setComments(prev => prev.filter(c => c._id !== commentId));
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleDeleteAttachment = (attachmentId: string) => {
    if (!projectId) return;
    Alert.alert(t('Delete Attachment'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProjectAttachment(projectId, attachmentId);
            setProject(prev => prev ? { ...prev, attachments: (prev.attachments || []).filter(a => a._id !== attachmentId) } : prev);
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleUploadAttachment = async () => {
    if (!projectId || uploadingAttachment) return;

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });
      if (result.canceled || !result.assets[0]) return;

      const asset = result.assets[0];
      setUploadingAttachment(true);
      await uploadProjectAttachment(projectId, {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
      });
      await refresh();
      Alert.alert(t('Success'), t('Attachment uploaded successfully'));
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to upload attachment'));
    } finally {
      setUploadingAttachment(false);
    }
  };

  const openAttachment = (att: ProjectAttachment) => {
    const url = att.url;
    if (url) Linking.openURL(url).catch(() => Alert.alert(t('Error'), t('Unable to open file')));
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const infoSections = useMemo(() => [
    {
      titleKey: 'Project Info',
      rows: [
        { labelKey: 'Description', value: project?.description },
        { labelKey: 'Status', value: project?.status },
        { labelKey: 'Progress', value: `${project?.progress || 0}%` },
      ],
    },
    {
      titleKey: 'Timeline',
      rows: [
        { labelKey: 'Start Date', value: project?.start_date || project?.startDate },
        { labelKey: 'End Date', value: project?.due_date || project?.endDate },
      ],
    },
    {
      titleKey: 'Team',
      rows: [
        { labelKey: 'Manager', value: (project?.manager as any)?.name },
        { labelKey: 'Assignees', value: project?.assignees?.map((a: any) => a.name || a).join(', ') },
      ],
    },
    {
      titleKey: 'Department',
      rows: [
        { labelKey: 'Department', value: project?.department_id?.name || project?.department?.name },
      ],
    },
    {
      titleKey: 'Evaluation',
      rows: [
        {
          labelKey: 'Rating',
          value: project?.overall_rating ? `${project.overall_rating} / 5` : t('No rating yet'),
        },
      ],
    },
  ], [project, t]);

  const attachments = project?.attachments || [];

  const customSections = useMemo(() => {
    const sections: any[] = [];
    const projectTasks = project?.tasks || [];

    sections.push({
      titleKey: 'Tasks',
      rows: projectTasks.length === 0
        ? [{ render: (
            <View>
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No tasks yet')}</Text>
            </View>
          ) }]
        : projectTasks.map(task => ({
            render: (
              <TouchableOpacity
                onPress={() => navigation.navigate('TaskDetail', { task })}
                style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={{ color: colors.ink, fontWeight: '600', fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
                    {task.title || task.name || '--'}
                  </Text>
                  {task.due_date ? (
                    <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
                      {t('Due')}: {task.due_date.slice(0, 10)}
                    </Text>
                  ) : null}
                </View>
                <Badge label={t(taskStatusLabel(task.status))} variant={taskVariantMap[(task.status || '').toLowerCase()] || 'default'} />
              </TouchableOpacity>
            ),
          })),
    });

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

    sections.push({
      titleKey: 'Attachments',
      rows: [
        ...(attachments.length === 0
          ? [{ render: (
            <View>
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No attachments')}</Text>
            </View>
          ) }]
          : attachments.map(a => ({
            render: (
              <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}>
                <TouchableOpacity onPress={() => openAttachment(a)} style={{ flex: 1, flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}>
                  <Paperclip size={14} color="#375DFB" />
                  <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align, flex: 1 }} numberOfLines={1}>
                    {a.original_name || a.file_name || t('Attachment')}
                  </Text>
                </TouchableOpacity>
                {canUpdate ? (
                  <TouchableOpacity onPress={() => handleDeleteAttachment(a._id)} hitSlop={8}>
                    <Trash2 size={14} color="#DF1C41" />
                  </TouchableOpacity>
                ) : null}
              </View>
            ),
          }))),
        canUpdate ? {
          render: (
            <TouchableOpacity
              onPress={handleUploadAttachment}
              disabled={uploadingAttachment}
              style={[styles.uploadButton, { borderColor: colors.primary, opacity: uploadingAttachment ? 0.55 : 1 }]}
            >
              <Paperclip size={16} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: font.sizes.sm, fontWeight: font.weights.semibold }}>
                {uploadingAttachment ? t('Uploading...') : t('Upload Attachment')}
              </Text>
            </TouchableOpacity>
          ),
        } : null,
      ].filter(Boolean),
    });

    sections.push({
      titleKey: 'Activity',
      rows: logs.length === 0
        ? [{ render: (
            <View>
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No activity yet')}</Text>
            </View>
          ) }]
        : logs.map((log, i) => ({
            render: (
              <View key={log._id || i} style={{ gap: spacing.xs, flex: 1 }}>
                <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Text style={{ color: colors.ink, fontWeight: '600', fontSize: font.sizes.sm, textAlign: align }}>
                    {log.action || t('Update')}
                  </Text>
                  {log.createdAt ? (
                    <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
                      {log.createdAt.slice(0, 10)}
                    </Text>
                  ) : null}
                </View>
                {log.description ? (
                  <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>
                    {log.description}
                  </Text>
                ) : null}
              </View>
            ),
          })),
    });

    return sections;
  }, [comments, attachments, logs, colors, isRTL, align, t, canUpdate, project, navigation, uploadingAttachment]);

  const status = getStatus(project?.status, t);

  const actions: any[] = [];
  if (projectId) {
    actions.push({
      labelKey: 'Edit',
      onPress: () => navigation.navigate('ProjectCreate', { project }),
      variant: 'primary' as const,
    });
  }
  if (canEvaluate && projectId) {
    actions.push({
      labelKey: 'Evaluate Project',
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
          {t('Project Details')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <DetailScreen
        sections={[...infoSections, ...customSections]}
        actions={actions}
        header={{
          title: project?.name || project?.title,
          subtitle: project?.description,
          status,
        }}
      />

      <EvaluationModal
        visible={evalVisible}
        onClose={() => setEvalVisible(false)}
        onSubmit={handleEvaluate}
        type="project"
        isSubmitting={evaluating}
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
  uploadButton: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
});
