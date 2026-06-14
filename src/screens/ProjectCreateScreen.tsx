import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { FormScreen } from '../generators/FormScreen';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createProject, updateProject, fetchDepartments, Project } from '../services/projects';
import { fetchEmployees } from '../services/employees';
import { font, spacing } from '../theme';

const statusOptions = [
  { label: 'Open', value: 'open' },
  { label: 'In Progress', value: 'in-progress' },
  { label: 'On Hold', value: 'on_hold' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
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

  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([]);
  const [employeeOptions, setEmployeeOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [depts, emps] = await Promise.all([fetchDepartments(), fetchEmployees({ limit: 200 })]);
        setDepartmentOptions(depts.map(d => ({ label: d.name, value: d._id })));
        setEmployeeOptions(emps.map(e => ({ label: e.user?.name || '--', value: e._id })));
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
    } else {
      await createProject(payload);
    }
    navigation.goBack();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.surface, borderBottomColor: colors.border, borderBottomWidth: 1, paddingHorizontal: spacing.md, paddingVertical: spacing.md }}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={{ fontSize: font.sizes.lg, fontWeight: font.weights.semibold, color: colors.ink, marginLeft: spacing.md, textAlign: isRTL ? 'right' : 'left' }}>
          {isEdit ? t('Edit Project') : t('New Project')}
        </Text>
      </View>
      <FormScreen
        sections={sections}
        onSubmit={handleSubmit}
        initialValues={initialValues}
        submitLabelKey={isEdit ? 'Update' : 'Create'}
        successMessageKey={isEdit ? 'Project updated' : 'Project created'}
        errorMessageKey="Failed to save project"
      />
    </View>
  );
}
