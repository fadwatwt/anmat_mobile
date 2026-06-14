import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Edit3, Trash2 } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchProjects, Project } from '../services/projects';
import { font } from '../theme';

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

const fetchData = async (_params: any) => {
  const data = await fetchProjects();
  return { data, total: data.length };
};

export default function ProjectsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();

  const columns = [
    {
      key: 'name',
      titleKey: 'Project Name',
      width: 200,
      render: (item: Project) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
            {item.name || item.title || '--'}
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
      key: 'manager',
      titleKey: 'Manager',
      width: 140,
      render: (item: Project) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.manager?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'department',
      titleKey: 'Department',
      width: 140,
      render: (item: Project) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {(item.department || item.department_id)?.name || '--'}
        </Text>
      ),
    },
    {
      key: 'assignees',
      titleKey: 'Assignees',
      width: 120,
      render: (item: Project) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.assignees?.map(a => a.name).join(', ') || '--'}
        </Text>
      ),
    },
    {
      key: 'start_date',
      titleKey: 'Start Date',
      width: 110,
      render: (item: Project) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {item.start_date || item.startDate || '--'}
        </Text>
      ),
    },
    {
      key: 'due_date',
      titleKey: 'Due Date',
      width: 110,
      render: (item: Project) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
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
        return (
          <Badge
            label={t(statusLabels[s] || item.status || '--')}
            variant={statusVariant[s] || 'default'}
          />
        );
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

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: Project) => item._id}
      searchable
      searchPlaceholderKey="Search projects..."

      onCreate={() => navigation.navigate('ProjectCreate')}
      onRowPress={(item: Project) => navigation.navigate('ProjectDetail', { project: item })}
      rowActions={(item: Project) => [
        { label: t('Edit'), icon: <Edit3 size={16} color="#375DFB" />, onPress: () => navigation.navigate('ProjectCreate', { project: item }) },
        { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => Alert.alert(t('Delete'), t('Are you sure?')), destructive: true },
      ]}
      emptyTitleKey="No projects found"
      emptyMessageKey="No projects to display"
    />
  );
}
