import { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { DetailScreen } from '../generators/DetailScreen';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

const variantMap: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  active: 'success', completed: 'info', on_hold: 'warning', cancelled: 'danger', pending: 'default',
};
const getStatus = (s?: string) => {
  if (!s) return { label: 'Active', variant: 'success' as const };
  return { label: s.charAt(0).toUpperCase() + s.slice(1), variant: variantMap[s.toLowerCase()] || 'default' };
};

export default function ProjectDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation();
  const route = useRoute<any>();
  const project = route.params?.project as any;

  const sections = useMemo(() => [
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
        { labelKey: 'Start Date', value: project?.startDate },
        { labelKey: 'End Date', value: project?.due_date || project?.endDate },
      ],
    },
    {
      titleKey: 'Team',
      rows: [
        { labelKey: 'Assignees', value: project?.assignees?.map((a: any) => a.name || a).join(', ') },
      ],
    },
    {
      titleKey: 'Department',
      rows: [
        { labelKey: 'Department', value: project?.department_id?.name },
      ],
    },
  ], [project]);

  const status = getStatus(project?.status);

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
        sections={sections}
        header={{
          title: project?.name || project?.title,
          subtitle: project?.description,
          status,
        }}
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
});
