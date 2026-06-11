import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { FormScreen } from '../generators/FormScreen';
import { createTask, updateTask } from '../services/tasks';
import { fetchEmployees } from '../services/employees';
import { fetchProjects } from '../services/projects';
import { fetchDepartments as fetchOrgDepartments } from '../services/projects';
import { TaskItem } from '../types';

const statusOptions = [
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

export default function TaskCreateScreen() {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const existingTask = route.params?.task as TaskItem | undefined;
  const isEdit = !!existingTask;

  const [projectOptions, setProjectOptions] = useState<{ label: string; value: string }[]>([]);
  const [departmentOptions, setDepartmentOptions] = useState<{ label: string; value: string }[]>([]);
  const [assigneeOptions, setAssigneeOptions] = useState<{ label: string; value: string }[]>([]);

  useEffect(() => {
    (async () => {
      try {
        const [projects, depts] = await Promise.all([fetchProjects(), fetchOrgDepartments()]);
        setProjectOptions(projects.map(p => ({ label: p.name || p.title || '--', value: p._id })));
        setDepartmentOptions(depts.map(d => ({ label: d.name, value: d._id })));
      } catch {}
    })();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const emps = await fetchEmployees({ limit: 200 });
        setAssigneeOptions(emps.map(e => ({ label: e.user?.name || '--', value: e._id })));
      } catch {}
    })();
  }, []);

  const sections = [
    {
      titleKey: 'Main Info',
      fields: [
        { name: 'title', labelKey: 'Task Title', type: 'text' as const, required: true },
        { name: 'description', labelKey: 'Description', type: 'multiline' as const },
      ],
    },
    {
      titleKey: 'Assignment',
      fields: [
        { name: 'project_id', labelKey: 'Project', type: 'autocomplete' as const, options: projectOptions },
        { name: 'department_id', labelKey: 'Department', type: 'autocomplete' as const, options: departmentOptions },
        { name: 'assignee_id', labelKey: 'Assignee', type: 'autocomplete' as const, options: assigneeOptions },
        { name: 'priority', labelKey: 'Priority', type: 'select' as const, options: priorityOptions },
        { name: 'status', labelKey: 'Status', type: 'select' as const, options: statusOptions },
      ],
    },
    {
      titleKey: 'Dates & Progress',
      fields: [
        { name: 'start_date', labelKey: 'Start Date', type: 'date' as const },
        { name: 'due_date', labelKey: 'Due Date', type: 'date' as const },
        { name: 'end_date', labelKey: 'End Date', type: 'date' as const },
        { name: 'progress', labelKey: 'Progress (%)', type: 'number' as const },
      ],
    },
  ];

  const initialValues = existingTask ? {
    title: existingTask.title || '',
    description: existingTask.description || '',
    project_id: existingTask.project_id || existingTask.project?._id || '',
    department_id: existingTask.department_id || existingTask.department?._id || '',
    assignee_id: existingTask.assignee_id || existingTask.assignee?._id || '',
    priority: existingTask.priority || 'medium',
    status: existingTask.status || 'open',
    start_date: existingTask.start_date || '',
    due_date: existingTask.due_date || '',
    end_date: existingTask.end_date || '',
    progress: existingTask.progress?.toString() || '0',
  } : {
    title: '',
    description: '',
    project_id: '',
    department_id: '',
    assignee_id: '',
    priority: 'medium',
    status: 'open',
    start_date: '',
    due_date: '',
    end_date: '',
    progress: '0',
  };

  const handleSubmit = async (values: Record<string, any>) => {
    const payload = {
      ...values,
      progress: parseInt(values.progress, 10) || 0,
    };
    if (isEdit) {
      await updateTask(existingTask._id, payload);
    } else {
      await createTask(payload);
    }
    navigation.goBack();
  };

  return (
    <FormScreen
      sections={sections}
      onSubmit={handleSubmit}
      initialValues={initialValues}
      submitLabelKey={isEdit ? 'Update' : 'Create'}
      successMessageKey={isEdit ? 'Task updated' : 'Task created'}
      errorMessageKey="Failed to save task"
    />
  );
}
