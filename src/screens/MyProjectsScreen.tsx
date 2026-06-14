import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchMyProjects, Project } from '../services/projects';
import { font } from '../theme';

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  completed: 'success', 'in-progress': 'info', pending: 'warning',
  'on-hold': 'default', cancelled: 'danger', rejected: 'danger',
};
const statusLabels: Record<string, string> = {
  completed: 'Completed', 'in-progress': 'In Progress', pending: 'Pending',
  'on-hold': 'On Hold', cancelled: 'Cancelled', rejected: 'Rejected',
};

export function MyProjectsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();

  const fetchData = useCallback(async () => {
    const data = await fetchMyProjects();
    return { data, total: data.length };
  }, []);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const columns = [
    {
      key: 'name',
      titleKey: 'Project',
      width: 200,
      render: (item: Project) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: align }} numberOfLines={1}>
            {item.name || item.title || '--'}
          </Text>
          {!!item.description && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 120,
      render: (item: Project) => {
        const s = (item.status || '').toLowerCase();
        return <Badge label={t(statusLabels[s] || item.status || '--')} variant={statusVariant[s] || 'default'} />;
      },
    },
    {
      key: 'progress',
      titleKey: 'Progress',
      width: 90,
      render: (item: Project) => (
        <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: 'center' }}>
          {item.progress ?? 0}%
        </Text>
      ),
    },
    {
      key: 'due_date',
      titleKey: 'Due Date',
      width: 110,
      render: (item: Project) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }}>
          {item.due_date || item.endDate || '--'}
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
      onRowPress={(item: Project) => navigation.navigate('ProjectDetail', { project: item })}
      rowActions={(item: Project) => [
        { label: t('View'), icon: <Eye size={16} color="#375DFB" />, onPress: () => navigation.navigate('ProjectDetail', { project: item }) },
      ]}
      emptyTitleKey="No projects found"
      emptyMessageKey="No projects to display"
    />
  );
}
