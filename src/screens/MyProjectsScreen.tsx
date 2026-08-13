import React, { useCallback } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Eye } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchMyProjects, Project } from '../services/projects';
import { font, radii, spacing } from '../theme';

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
      key: 'manager',
      titleKey: 'Manager',
      width: 150,
      render: (item: Project) => {
        const m = item.manager;
        if (!m?.name) return <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs }}>--</Text>;
        return (
          <View style={[styles.userCell, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <View style={[styles.avatar, { backgroundColor: colors.primaryLight || '#EEF2FF' }]}>
              <Text style={[styles.avatarText, { color: colors.primary || '#375DFB' }]}>
                {m.name.slice(0, 1).toUpperCase()}
              </Text>
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={{ color: colors.ink, fontSize: font.sizes.xs, fontWeight: font.weights.semibold, textAlign: align }} numberOfLines={1}>
                {m.name}
              </Text>
              {!!m.email && (
                <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: align }} numberOfLines={1}>
                  {m.email}
                </Text>
              )}
            </View>
          </View>
        );
      },
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
          {item.due_date || item.endDate || '--'}
        </Text>
      ),
    },
    {
      key: 'assignees',
      titleKey: 'Assignees',
      width: 120,
      render: (item: Project) => {
        const members = Array.isArray(item.assignees) ? item.assignees.slice(0, 3) : [];
        const extra = Array.isArray(item.assignees) ? item.assignees.length - 3 : 0;
        if (members.length === 0) {
          return <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs }}>--</Text>;
        }
        return (
          <View style={[styles.avatarStack, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {members.map((mem, i) => (
              <View key={mem._id || i} style={[styles.avatarSm, { backgroundColor: colors.primaryLight || '#EEF2FF' }]}>
                <Text style={[styles.avatarTextSm, { color: colors.primary || '#375DFB' }]}>
                  {(mem.name || '?').slice(0, 1).toUpperCase()}
                </Text>
              </View>
            ))}
            {extra > 0 && (
              <View style={[styles.avatarSm, { backgroundColor: colors.statusBg || '#F3F4F6' }]}>
                <Text style={[styles.avatarTextSm, { color: colors.textMuted }]}>+{extra}</Text>
              </View>
            )}
          </View>
        );
      },
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

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 28,
    justifyContent: 'center',
    width: 28,
  },
  avatarSm: {
    alignItems: 'center',
    borderColor: '#FFF',
    borderRadius: radii.full,
    borderWidth: 2,
    height: 24,
    justifyContent: 'center',
    width: 24,
  },
  avatarStack: { alignItems: 'center' },
  avatarText: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  avatarTextSm: { fontSize: 9, fontWeight: font.weights.bold },
  userCell: { alignItems: 'center', gap: spacing.sm },
});
