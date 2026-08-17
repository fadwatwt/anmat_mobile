import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, ChevronDown, ChevronUp, Paperclip, Plus, Send, Trash2, UserPlus, Users, X } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { DetailScreen } from '../generators/DetailScreen';
import { EvaluationModal } from '../components/EvaluationModal';
import { AddMemberModal } from '../components/projects/AddMemberModal';
import { CreateTeamModal } from '../modals/CreateTeamModal';
import { SelectDropdown } from '../components/SelectDropdown';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  fetchProjectDetails,
  evaluateProject,
  updateProject,
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
import { updateTask } from '../services/tasks';
import { fetchTeams, updateTeam, deleteTeam, Team } from '../services/hr';
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
const taskStatusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Done', value: 'done' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];
const priorityColor = (p?: string) => {
  const l = (p || '').toLowerCase();
  if (l === 'urgent' || l === 'high') return '#E11D48';
  if (l === 'medium') return '#D97706';
  if (l === 'low') return '#2563EB';
  return '#6B7280';
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [commentText, setCommentText] = useState('');
  const [sendingComment, setSendingComment] = useState(false);
  const [evalVisible, setEvalVisible] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [createTeamVisible, setCreateTeamVisible] = useState(false);
  const [addMemberTarget, setAddMemberTarget] = useState<null | { kind: 'project' } | { kind: 'team'; team: Team }>(null);
  const [savingMembers, setSavingMembers] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const refresh = useCallback(() => {
    if (!projectId) return;
    Promise.all([
      fetchProjectDetails(projectId).then(setProject).catch(() => {}),
      fetchProjectComments(projectId).then(setComments).catch(() => {}),
      fetchProjectActivityLogs(projectId).then(setLogs).catch(() => {}),
      fetchTeams()
        .then(all => setTeams(all.filter(t => t.related_model_type === 'Project' && t.related_model_id === projectId)))
        .catch(() => {}),
    ]);
  }, [projectId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const canUpdate = Array.isArray(permissions) && (permissions.includes('*') || permissions.includes('projects.update'));
  const canEvaluate = Array.isArray(permissions) && (permissions.includes('*') || permissions.includes('projects.evaluate'));
  const canManageTask = Array.isArray(permissions) && (permissions.includes('*') || permissions.includes('projects.update') || permissions.includes('tasks.update'));

  const projectMemberIds = useMemo(() => {
    if (Array.isArray(project?.assignees_ids) && project.assignees_ids.length) return project.assignees_ids;
    return (project?.assignees || []).map((a: any) => a._id);
  }, [project]);

  const currentAddMemberIds = useMemo(() => {
    if (!addMemberTarget) return [];
    if (addMemberTarget.kind === 'project') return projectMemberIds;
    return (addMemberTarget.team.members_ids || []).map(m => m._id).filter((id): id is string => !!id);
  }, [addMemberTarget, projectMemberIds]);

  const handleAddMembersSubmit = async (ids: string[]) => {
    if (!projectId) return;
    setSavingMembers(true);
    try {
      if (addMemberTarget?.kind === 'team') {
        await updateTeam(addMemberTarget.team._id, { members_ids: ids });
      } else {
        await updateProject(projectId, { assignees_ids: ids });
      }
      await refresh();
      setAddMemberTarget(null);
      Alert.alert(t('Success'), t('Members updated successfully'));
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSavingMembers(false);
    }
  };

  const handleRemoveAssignee = (member: any) => {
    if (!projectId) return;
    Alert.alert(t('Remove Member'), t('Are you sure you want to remove this member?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            const remaining = projectMemberIds.filter(id => id !== member._id);
            await updateProject(projectId, { assignees_ids: remaining });
            await refresh();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleRemoveTeamMember = (team: Team, memberId: string) => {
    Alert.alert(t('Remove Member'), t('Are you sure you want to remove this member?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Remove'),
        style: 'destructive',
        onPress: async () => {
          try {
            const remaining = (team.members_ids || []).map(m => m._id).filter((id): id is string => !!id && id !== memberId);
            await updateTeam(team._id, { members_ids: remaining });
            await refresh();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleDeleteTeam = (team: Team) => {
    Alert.alert(t('Delete Team'), t('Are you sure you want to delete this team?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteTeam(team._id);
            await refresh();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const handleTaskStatusChange = async (task: any, status: string) => {
    if (!task?._id || status === task.status) return;
    try {
      await updateTask(task._id, { status });
      await refresh();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    }
  };

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
    const manager = project?.manager as any;

    sections.push({
      titleKey: 'Project Members',
      rows: [
        ...(manager?.name
          ? [{
              render: (
                <View style={styles.memberRow}>
                  <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                    <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                      {(manager.name as string).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <Text style={[styles.memberName, { color: colors.ink, textAlign: align, flex: 1 }]} numberOfLines={1}>
                    {manager.name}
                  </Text>
                  <View style={[styles.roleBadge, { borderColor: colors.success }]}>
                    <Text style={[styles.roleBadgeText, { color: colors.success }]}>{t('Manager')}</Text>
                  </View>
                </View>
              ),
            }]
          : []),
        ...(project?.assignees?.map(a => ({
          render: (
            <View style={styles.memberRow}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                <Text style={[styles.avatarLetter, { color: colors.primary }]}>{(a.name || '?').charAt(0).toUpperCase()}</Text>
              </View>
              <Text style={[styles.memberName, { color: colors.ink, textAlign: align, flex: 1 }]} numberOfLines={1}>
                {a.name || '--'}
              </Text>
              {canUpdate ? (
                <TouchableOpacity onPress={() => handleRemoveAssignee(a)} hitSlop={8}>
                  <X size={16} color="#DF1C41" />
                </TouchableOpacity>
              ) : null}
            </View>
          ),
        })) || []),
        ...(canUpdate
          ? [{
              render: (
                <View style={styles.memberActions}>
                  <TouchableOpacity
                    style={[styles.memberActionBtn, { borderColor: colors.primary }]}
                    onPress={() => setAddMemberTarget({ kind: 'project' })}
                    activeOpacity={0.7}
                  >
                    <UserPlus size={16} color={colors.primary} />
                    <Text style={[styles.memberActionText, { color: colors.primary }]}>{t('Add Members')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.memberActionBtn, { borderColor: colors.primary }]}
                    onPress={() => setCreateTeamVisible(true)}
                    activeOpacity={0.7}
                  >
                    <Users size={16} color={colors.primary} />
                    <Text style={[styles.memberActionText, { color: colors.primary }]}>{t('Create a Team')}</Text>
                  </TouchableOpacity>
                </View>
              ),
            }]
          : []),
        ...(teams.length === 0
          ? [{
              render: (
                <View style={[styles.emptyWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>{t('No teams yet')}</Text>
                </View>
              ),
            }]
          : teams.map(team => ({
              render: (
                <View style={[styles.teamBlock, { borderColor: colors.border, backgroundColor: colors.background }]}>
                  <View style={styles.teamHeader}>
                    <Text style={[styles.teamName, { color: colors.ink, textAlign: align, flex: 1 }]} numberOfLines={1}>
                      {team.name}
                    </Text>
                    {canUpdate ? (
                      <TouchableOpacity onPress={() => handleDeleteTeam(team)} hitSlop={8}>
                        <Trash2 size={16} color="#DF1C41" />
                      </TouchableOpacity>
                    ) : null}
                  </View>

                  {team.leader_id?.name ? (
                    <View style={styles.memberRow}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[styles.avatarLetter, { color: colors.primary }]}>
                          {(team.leader_id.name as string).charAt(0).toUpperCase()}
                        </Text>
                      </View>
                      <Text style={[styles.memberName, { color: colors.ink, textAlign: align, flex: 1 }]} numberOfLines={1}>
                        {team.leader_id.name}
                      </Text>
                      <View style={[styles.roleBadge, { borderColor: colors.warning }]}>
                        <Text style={[styles.roleBadgeText, { color: colors.warning }]}>{t('Team Leader')}</Text>
                      </View>
                    </View>
                  ) : null}

                  {(team.members_ids || []).map(m => (
                    <View key={m._id} style={styles.memberRow}>
                      <View style={[styles.avatar, { backgroundColor: colors.primary + '22' }]}>
                        <Text style={[styles.avatarLetter, { color: colors.primary }]}>{(m.name || '?').charAt(0).toUpperCase()}</Text>
                      </View>
                      <Text style={[styles.memberName, { color: colors.ink, textAlign: align, flex: 1 }]} numberOfLines={1}>
                        {m.name || '--'}
                      </Text>
                      {canUpdate ? (
                        <TouchableOpacity onPress={() => handleRemoveTeamMember(team, m._id || '')} hitSlop={8}>
                          <X size={16} color="#DF1C41" />
                        </TouchableOpacity>
                      ) : null}
                    </View>
                  ))}

                  {canUpdate ? (
                    <TouchableOpacity
                      style={[styles.addMemberBtn, { borderColor: colors.primary }]}
                      onPress={() => setAddMemberTarget({ kind: 'team', team })}
                      activeOpacity={0.7}
                    >
                      <Plus size={14} color={colors.primary} />
                      <Text style={[styles.addMemberBtnText, { color: colors.primary }]}>{t('Add a member')}</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
              ),
            }))),
      ],
    });

    sections.push({
      titleKey: 'Tasks',
      rows: projectTasks.length === 0
        ? [{ render: (
            <View>
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No tasks yet')}</Text>
            </View>
          ) }]
        : projectTasks.map(task => {
            const priority = task.priority || task.priority_level || '';
            const stages = task.stages || [];
            const isExpanded = expandedTask === task._id;
            return {
              render: (
                <View style={{ flex: 1, gap: spacing.xs }}>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('TaskDetail', { task })}
                    style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
                  >
                    <View style={{ flex: 1, gap: 2 }}>
                      <Text style={{ color: colors.ink, fontWeight: '600', fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
                        {task.title || task.name || '--'}
                      </Text>
                      {task.start_date || task.due_date ? (
                        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
                          {task.start_date ? `${t('Start Date')}: ${task.start_date.slice(0, 10)}` : ''}
                          {task.start_date && task.due_date ? ' — ' : ''}
                          {task.due_date ? `${t('Due')}: ${task.due_date.slice(0, 10)}` : ''}
                        </Text>
                      ) : null}
                    </View>
                    <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.sm }}>
                      {priority ? (
                        <View style={[styles.priorityBadge, { borderColor: priorityColor(priority) }]}>
                          <Text style={[styles.priorityText, { color: priorityColor(priority) }]}>
                            {t(priority.charAt(0).toUpperCase() + priority.slice(1).toLowerCase())}
                          </Text>
                        </View>
                      ) : null}
                      <Badge label={t(taskStatusLabel(task.status))} variant={taskVariantMap[(task.status || '').toLowerCase()] || 'default'} />
                    </View>
                  </TouchableOpacity>

                  {canManageTask ? (
                    <SelectDropdown
                      options={taskStatusOptions}
                      value={task.status || 'open'}
                      onChange={(v) => handleTaskStatusChange(task, v)}
                      placeholder={t('Status')}
                      translateLabels
                    />
                  ) : null}

                  {stages.length > 0 ? (
                    <>
                      <TouchableOpacity
                        onPress={() => setExpandedTask(isExpanded ? null : task._id)}
                        style={[styles.stagesToggle, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.stagesToggleText, { color: colors.primary }]}>
                          {t('Stages')} ({stages.length})
                        </Text>
                        {isExpanded ? <ChevronUp size={16} color={colors.primary} /> : <ChevronDown size={16} color={colors.primary} />}
                      </TouchableOpacity>
                      {isExpanded && stages.map((stage: any, si: number) => (
                        <View key={stage._id || si} style={[styles.stageRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                          <View style={{ flex: 1, gap: 2 }}>
                            <Text style={{ color: colors.ink, fontSize: font.sizes.sm, fontWeight: '500', textAlign: align }} numberOfLines={1}>
                              {stage.name || '--'}
                            </Text>
                            {stage.start_date || stage.due_date ? (
                              <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
                                {stage.start_date ? stage.start_date.slice(0, 10) : ''}
                                {stage.start_date && stage.due_date ? ' — ' : ''}
                                {stage.due_date ? stage.due_date.slice(0, 10) : ''}
                              </Text>
                            ) : null}
                          </View>
                          <Badge
                            label={t(taskStatusLabel(stage.status))}
                            variant={taskVariantMap[(stage.status || '').toLowerCase()] || 'default'}
                            size="sm"
                          />
                        </View>
                      ))}
                    </>
                  ) : null}
                </View>
              ),
            };
          }),
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
  }, [comments, attachments, logs, teams, projectMemberIds, expandedTask, canManageTask, colors, isRTL, align, t, canUpdate, project, navigation, uploadingAttachment]);

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

      <AddMemberModal
        visible={!!addMemberTarget}
        title={addMemberTarget?.kind === 'team' ? t('Add Members') : t('Project Members')}
        existingIds={currentAddMemberIds}
        submitting={savingMembers}
        onClose={() => setAddMemberTarget(null)}
        onSubmit={handleAddMembersSubmit}
      />

      <CreateTeamModal
        visible={createTeamVisible}
        onClose={() => setCreateTeamVisible(false)}
        onSaved={refresh}
        projectId={projectId}
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
  memberRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  avatar: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  avatarLetter: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  memberName: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  roleBadge: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  roleBadgeText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  memberActions: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    gap: spacing.sm,
    paddingTop: spacing.xs,
  },
  memberActionBtn: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  memberActionText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  emptyWrap: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingVertical: spacing.md,
  },
  teamBlock: {
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    borderWidth: 1,
    gap: spacing.xs,
    marginTop: spacing.sm,
    padding: spacing.md,
  },
  teamHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  teamName: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  addMemberBtn: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addMemberBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  priorityBadge: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  priorityText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  stagesToggle: {
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  stagesToggleText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  stageRow: {
    alignItems: 'center',
    alignSelf: 'stretch',
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingLeft: spacing.md,
    paddingVertical: spacing.xs,
  },
});
