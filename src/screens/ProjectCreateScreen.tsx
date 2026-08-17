import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, CheckCircle2 } from 'lucide-react-native';
import { FormScreen } from '../generators/FormScreen';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createProject, updateProject, fetchDepartments, fetchProjectTemplateById, createProjectFromTemplate, Project } from '../services/projects';
import { createTask } from '../services/tasks';
import { fetchEmployees } from '../services/employees';
import { font, radii, spacing } from '../theme';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

const taskStatusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'Pending', value: 'pending' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'Completed', value: 'completed' },
  { label: 'Done', value: 'done' },
  { label: 'Rejected', value: 'rejected' },
  { label: 'Cancelled', value: 'cancelled' },
];

const priorityOptions = [
  { label: 'Low', value: 'low' },
  { label: 'Medium', value: 'medium' },
  { label: 'High', value: 'high' },
  { label: 'Urgent', value: 'urgent' },
];

const toISO = (v?: string) => {
  if (!v) return undefined;
  const d = new Date(v);
  return isNaN(d.getTime()) ? undefined : d.toISOString();
};

export default function ProjectCreateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const existing = route.params?.project as Project | undefined;
  const isEdit = !!existing;
  const templateId = route.params?.templateId as string | undefined;
  const isFromTemplate = !!templateId && !isEdit;

  const [phase, setPhase] = useState<'form' | 'prompt' | 'task'>('form');
  const [createdProject, setCreatedProject] = useState<Project | null>(null);
  const [taskCount, setTaskCount] = useState(0);

  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string }[]>([]);
  const [taskAssigneeOptions, setTaskAssigneeOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [depts, emps] = await Promise.all([fetchDepartments(), fetchEmployees({ limit: 200 })]);
        setDepartmentOptions(depts.map(d => ({ label: d.name, value: d._id })));
        setEmployeeOptions(emps.map(e => ({ label: e.user?.name || '--', value: e._id })));
        setTaskAssigneeOptions(emps.map(e => ({ label: e.user?.name || '--', value: e.user_id })));
      } catch {}
    })();
  }, []);

  const sections = [
    {
      titleKey: 'Project Information',
      fields: [
        { name: 'name', labelKey: 'Project Name', type: 'text' as const, required: true, placeholder: 'Enter project name' },
        { name: 'description', labelKey: 'Description', type: 'multiline' as const, placeholder: 'Enter project description' },
        { name: 'status', labelKey: 'Status', type: 'select' as const, options: statusOptions },
        { name: 'progress', labelKey: 'Progress (%)', type: 'number' as const },
      ],
    },
    {
      titleKey: 'Team',
      fields: [
        { name: 'manager_id', labelKey: 'Manager', type: 'autocomplete' as const, options: employeeOptions },
        { name: 'department_id', labelKey: 'Department', type: 'autocomplete' as const, options: departmentOptions },
        { name: 'assignees_ids', labelKey: 'Assignees', type: 'chips' as const, options: employeeOptions },
      ],
    },
    {
      titleKey: 'Timeline',
      fields: [
        { name: 'start_date', labelKey: 'Start Date', type: 'date' as const },
        { name: 'due_date', labelKey: 'End Date', type: 'date' as const },
      ],
    },
  ];

  const initialValues = isEdit ? {
    name: existing!.name || existing!.title || '',
    description: existing!.description || '',
    status: existing!.status || 'open',
    progress: existing!.progress != null ? String(existing!.progress) : '0',
    manager_id: existing!.manager_id || existing!.manager?._id || '',
    department_id: existing!.department_id?._id || (existing!.department_id as any) || existing!.department?._id || '',
    assignees_ids: existing!.assignees_ids || existing!.assignees?.map(a => a._id) || [],
    start_date: existing!.start_date || existing!.startDate || '',
    due_date: existing!.due_date || existing!.endDate || '',
  } : {
    name: '',
    description: '',
    status: 'open',
    progress: '0',
    manager_id: '',
    department_id: '',
    assignees_ids: [],
    start_date: '',
    due_date: '',
  };

  const taskSections = [
    {
      titleKey: 'Main Info',
      fields: [
        { name: 'title', labelKey: 'Task Title', type: 'text' as const, required: true, placeholder: 'Enter task title' },
        { name: 'description', labelKey: 'Description', type: 'multiline' as const },
      ],
    },
    {
      titleKey: 'Assignment',
      fields: [
        { name: 'assignee_id', labelKey: 'Assignee', type: 'autocomplete' as const, options: taskAssigneeOptions },
        { name: 'priority', labelKey: 'Priority', type: 'select' as const, options: priorityOptions },
        { name: 'status', labelKey: 'Status', type: 'select' as const, options: taskStatusOptions },
      ],
    },
    {
      titleKey: 'Dates & Progress',
      fields: [
        { name: 'start_date', labelKey: 'Start Date', type: 'date' as const },
        { name: 'due_date', labelKey: 'Due Date', type: 'date' as const },
        { name: 'progress', labelKey: 'Progress (%)', type: 'number' as const },
      ],
    },
  ];

  const taskInitialValues = {
    title: '',
    description: '',
    assignee_id: '',
    priority: 'medium',
    status: 'open',
    start_date: '',
    due_date: '',
    progress: '0',
  };

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      name: values.name,
      description: values.description || undefined,
      manager_id: values.manager_id || undefined,
      department_id: values.department_id || undefined,
      assignees_ids: Array.isArray(values.assignees_ids) ? values.assignees_ids : [],
      start_date: toISO(values.start_date),
      due_date: toISO(values.due_date),
      progress: Number(values.progress) || 0,
      status: values.status || 'open',
    };
    if (isEdit) {
      await updateProject(existing!._id, payload);
      navigation.goBack();
      return;
    }
    const created = isFromTemplate
      ? await createProjectFromTemplate(templateId!, payload)
      : await createProject(payload);
    setCreatedProject(created);
    setPhase('prompt');
  };

  const handleCreateTask = async (values: Record<string, any>) => {
    const payload = {
      project_id: createdProject?._id,
      title: values.title,
      description: values.description || undefined,
      assignee_id: values.assignee_id || undefined,
      priority: values.priority || 'medium',
      status: values.status || 'open',
      start_date: toISO(values.start_date),
      due_date: toISO(values.due_date),
      progress: Number(values.progress) || 0,
    };
    await createTask(payload);
    setTaskCount(c => c + 1);
    setPhase('prompt');
  };

  const headerTitle = isEdit ? t('Edit Project') : isFromTemplate ? t('Publish Project') : t('New Project');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {headerTitle}
        </Text>
        <View style={styles.backBtn} />
      </View>

      {phase === 'form' && (
        <FormScreen
          sections={sections}
          onSubmit={handleSubmit}
          initialValues={initialValues}
          submitLabelKey={isEdit ? 'Update' : 'Create'}
          successMessageKey={isEdit ? 'Project updated' : 'Project created'}
          errorMessageKey="Failed to save project"
        />
      )}

      {phase === 'prompt' && (
        <View style={styles.phaseCenter}>
          <View style={[styles.iconCircle, { backgroundColor: colors.primary + '1A' }]}>
            <CheckCircle2 size={44} color={colors.primary} />
          </View>
          <Text style={[styles.phaseTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('Project created successfully')}
          </Text>
          <Text style={[styles.phaseSub, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {t(taskCount === 0 ? 'Would you like to add tasks to this project?' : 'Add another task?')}
          </Text>
          <Button label={t(taskCount === 0 ? 'Add Task' : 'Add another task?')} onPress={() => setPhase('task')} />
          <Button
            label={t(taskCount === 0 ? 'Skip & Finish' : 'Finish')}
            variant="secondary"
            onPress={() => navigation.goBack()}
          />
        </View>
      )}

      {phase === 'task' && (
        <FormScreen
          sections={taskSections}
          onSubmit={handleCreateTask}
          initialValues={taskInitialValues}
          submitLabelKey="Create"
          successMessageKey="Task created"
          errorMessageKey="Failed to save task"
        />
      )}
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
  phaseCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  iconCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  phaseTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  phaseSub: { fontSize: font.sizes.base, marginBottom: spacing.md },
});
