import { useCallback, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Edit3, Trash2, Eye, CheckCircle2, LayoutTemplate, Download } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EvaluationModal } from '../components/EvaluationModal';
import { SaveAsTemplateModal } from '../modals/SaveAsTemplateModal';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import {
  fetchProjects,
  fetchProjectTemplates,
  deleteProject,
  deleteProjectTemplate,
  updateProject,
  evaluateProject,
  Project,
  ProjectTemplate,
} from '../services/projects';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  active: 'success',
  completed: 'info',
  done: 'success',
  'in-progress': 'info',
  open: 'default',
  pending: 'warning',
  delayed: 'warning',
  cancelled: 'danger',
  rejected: 'danger',
  on_hold: 'warning',
  unverified: 'danger',
  scheduled: 'info',
  delivered: 'info',
  read: 'success',
  inactive: 'default',
};

const statusLabels: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  done: 'Done',
  'in-progress': 'In Progress',
  open: 'Open',
  pending: 'Pending',
  delayed: 'Delayed',
  cancelled: 'Cancelled',
  rejected: 'Rejected',
  on_hold: 'On Hold',
  unverified: 'Unverified',
  scheduled: 'Scheduled',
  delivered: 'Delivered',
  read: 'Read',
  inactive: 'Inactive',
};

const ALLOWED_STATUSES = ['active', 'pending', 'in-progress', 'delayed', 'on_hold', 'cancelled', 'done'];

type TabKey = 'projects' | 'templates';

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const navigation = useNavigation<any>();

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );

  const canCreate = has('projects.create');
  const canUpdate = has('projects.update');
  const canDelete = has('projects.delete');
  const canEvaluate = has('projects.evaluate');
  const canSaveTemplate = has('projects.create_template') || has('project_templates.create');
  const canViewTemplates = has('project_templates.view') || has('project_templates.list');
  const canDeleteTemplate = has('project_templates.delete');
  const canPublish = has('projects.create');

  const [activeTab, setActiveTab] = useState<TabKey>('projects');
  const [reloadKey, setReloadKey] = useState(0);

  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [evalModalOpen, setEvalModalOpen] = useState(false);
  const [evalSubmitting, setEvalSubmitting] = useState(false);
  const [templateModalOpen, setTemplateModalOpen] = useState(false);

  const reload = () => setReloadKey((k) => k + 1);

  const fetchData = useCallback(async (_params: any) => {
    const data = await fetchProjects();
    return { data, total: data.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const fetchTemplates = useCallback(async (_params: any) => {
    const data = await fetchProjectTemplates();
    return { data, total: data.length };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const columns = useMemo(() => {
    const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
    return [
      {
        key: 'name',
        titleKey: 'Project Name',
        width: 200,
        render: (item: Project) => (
          <View style={{ gap: 2 }}>
            <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
              {item.name || item.title || '--'}
            </Text>
            {item.description ? (
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>
        ),
      },
      {
        key: 'manager',
        titleKey: 'Manager',
        width: 140,
        render: (item: Project) => (
          <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
            {item.manager?.name || '--'}
          </Text>
        ),
      },
      {
        key: 'department',
        titleKey: 'Department',
        width: 140,
        render: (item: Project) => (
          <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
            {(item.department || item.department_id)?.name || '--'}
          </Text>
        ),
      },
      {
        key: 'assignees',
        titleKey: 'Assignees',
        width: 120,
        render: (item: Project) => (
          <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
            {item.assignees?.map((a) => a.name).join(', ') || '--'}
          </Text>
        ),
      },
      {
        key: 'start_date',
        titleKey: 'Start Date',
        width: 110,
        render: (item: Project) => (
          <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
            {item.start_date || item.startDate || '--'}
          </Text>
        ),
      },
      {
        key: 'due_date',
        titleKey: 'Due Date',
        width: 110,
        render: (item: Project) => (
          <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
            {item.due_date || '--'}
          </Text>
        ),
      },
      {
        key: 'status',
        titleKey: 'Status',
        width: 100,
        render: (item: Project) => {
          const s = (item.status || '').toLowerCase();
          return <Badge label={t(statusLabels[s] || item.status || '--')} variant={statusVariant[s] || 'default'} />;
        },
      },
      {
        key: 'progress',
        titleKey: 'Progress',
        width: 80,
        render: (item: Project) => (
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: 'center' }}>
            {item.progress ?? 0}%
          </Text>
        ),
      },
      {
        key: 'rating',
        titleKey: 'Evaluation',
        width: 110,
        render: (item: Project) => (
          <Text style={{ color: item.overall_rating ? colors.ink : colors.textMuted, fontSize: font.sizes.sm, textAlign: 'center' }}>
            {item.overall_rating ? `${item.overall_rating.toFixed(1)} / 5` : t('Not evaluated')}
          </Text>
        ),
      },
    ];
  }, [colors, isRTL, t]);

  const templateColumns = useMemo(() => {
    const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
    return [
      {
        key: 'name',
        titleKey: 'Template',
        width: 200,
        render: (item: ProjectTemplate) => (
          <View style={{ gap: 2 }}>
            <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
              {item.name || item.title || '--'}
            </Text>
            {item.description ? (
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
                {item.description}
              </Text>
            ) : null}
          </View>
        ),
      },
      {
        key: 'department',
        titleKey: 'Department',
        width: 140,
        render: (item: ProjectTemplate) => (
          <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
            {(item.department_id as any)?.name || '--'}
          </Text>
        ),
      },
      {
        key: 'updated_at',
        titleKey: 'Updated At',
        width: 130,
        render: (item: ProjectTemplate) => (
          <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
            {item.updated_at ? item.updated_at.slice(0, 10) : '--'}
          </Text>
        ),
      },
    ];
  }, [colors, isRTL, t]);

  const openStatusModal = (item: Project) => {
    setSelectedProject(item);
    setStatusModalOpen(true);
  };

  const openEvaluation = (item: Project) => {
    setSelectedProject(item);
    setEvalModalOpen(true);
  };

  const openSaveTemplate = (item: Project) => {
    setSelectedProject(item);
    setTemplateModalOpen(true);
  };

  const changeStatus = async (status: string) => {
    if (!selectedProject) return;
    if (status === 'done') {
      setStatusModalOpen(false);
      setEvalModalOpen(true);
      return;
    }
    setStatusModalOpen(false);
    try {
      await updateProject(selectedProject._id, { status });
      reload();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    }
  };

  const handleEvaluate = async (data: any) => {
    if (!selectedProject) return;
    setEvalSubmitting(true);
    try {
      await evaluateProject(selectedProject._id, { ...data, status: 'done' });
      setEvalModalOpen(false);
      Alert.alert(t('Success'), t('Project evaluated and completed'));
      reload();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to evaluate project'));
    } finally {
      setEvalSubmitting(false);
    }
  };

  const confirmDelete = (item: Project) => {
    Alert.alert(t('Delete Project'), t('Are you sure you want to delete this project?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProject(item._id);
            reload();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const confirmDeleteTemplate = (item: ProjectTemplate) => {
    Alert.alert(t('Delete Template'), t('This action cannot be undone'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteProjectTemplate(item._id);
            reload();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

  const projectRowActions = (item: Project) => {
    const actions: { label: string; icon: React.ReactNode; onPress: () => void; destructive?: boolean }[] = [
      {
        label: t('View'),
        icon: <Eye size={16} color="#375DFB" />,
        onPress: () => navigation.navigate('ProjectDetail', { project: item }),
      },
    ];
    if (canUpdate) {
      actions.push({
        label: t('Edit'),
        icon: <Edit3 size={16} color="#375DFB" />,
        onPress: () => navigation.navigate('ProjectCreate', { project: item }),
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
    if (canSaveTemplate) {
      actions.push({
        label: t('Save as Template'),
        icon: <LayoutTemplate size={16} color="#375DFB" />,
        onPress: () => openSaveTemplate(item),
      });
    }
    if (canDelete) {
      actions.push({
        label: t('Delete'),
        icon: <Trash2 size={16} color="#DF1C41" />,
        destructive: true,
        onPress: () => confirmDelete(item),
      });
    }
    return actions;
  };

  const templateRowActions = (item: ProjectTemplate) => {
    const actions: { label: string; icon: React.ReactNode; onPress: () => void; destructive?: boolean }[] = [];
    if (canPublish) {
      actions.push({
        label: t('Publish Project'),
        icon: <Download size={16} color="#375DFB" />,
        onPress: () => navigation.navigate('ProjectCreate', { templateId: item._id }),
      });
    }
    if (canDeleteTemplate) {
      actions.push({
        label: t('Delete'),
        icon: <Trash2 size={16} color="#DF1C41" />,
        destructive: true,
        onPress: () => confirmDeleteTemplate(item),
      });
    }
    return actions;
  };
  const rowDir = isRTL ? 'row-reverse' : 'row';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {canViewTemplates && (
        <View style={[styles.tabs, { backgroundColor: colors.surface, borderBottomColor: colors.border, flexDirection: rowDir }]}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'projects' && { backgroundColor: colors.primaryLight }]}
            onPress={() => setActiveTab('projects')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'projects' ? colors.primary : colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('Projects')}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'templates' && { backgroundColor: colors.primaryLight }]}
            onPress={() => setActiveTab('templates')}
          >
            <Text style={[styles.tabText, { color: activeTab === 'templates' ? colors.primary : colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {t('Templates')}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {activeTab === 'projects' ? (
        <ListScreen
          columns={columns}
          fetchData={fetchData}
          keyExtractor={(item: Project) => item._id}
          searchable
          searchPlaceholderKey="Search projects..."
          onCreate={canCreate ? () => navigation.navigate('ProjectCreate') : undefined}
          onRowPress={(item: Project) => navigation.navigate('ProjectDetail', { project: item })}
          rowActions={projectRowActions}
          emptyTitleKey="No projects found"
          emptyMessageKey="No projects to display"
        />
      ) : (
        <ListScreen
          columns={templateColumns}
          fetchData={fetchTemplates}
          keyExtractor={(item: ProjectTemplate) => item._id}
          searchable
          searchPlaceholderKey="Search templates..."
          rowActions={templateRowActions}
          emptyTitleKey="No templates found"
          emptyMessageKey="No templates to display"
        />
      )}

      {/* Status change modal */}
      <Modal visible={statusModalOpen} onClose={() => setStatusModalOpen(false)} title={t('Change Status')} size="sm" noScroll>
        <View style={{ gap: spacing.xs, paddingVertical: spacing.xs }}>
          {ALLOWED_STATUSES.map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.statusOption,
                { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: rowDir },
              ]}
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
        type="project"
        isSubmitting={evalSubmitting}
      />

      {/* Save as Template modal */}
      <SaveAsTemplateModal
        visible={templateModalOpen}
        project={selectedProject}
        onClose={() => setTemplateModalOpen(false)}
        onSaved={reload}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  tab: {
    flex: 1,
    borderRadius: radii.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  tabText: {
    fontSize: font.sizes.sm,
    fontWeight: '700',
  },
  statusOption: {
    borderRadius: radii.lg,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
});
