import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Badge } from '../components/Badge';
import { fetchProjectTemplateById, deleteProjectTemplate, ProjectTemplate } from '../services/projects';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

export default function TemplateDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const passed = route.params?.template as ProjectTemplate | undefined;
  const templateId = passed?._id;

  const [template, setTemplate] = useState<ProjectTemplate | undefined>(passed);

  useEffect(() => {
    if (templateId) {
      fetchProjectTemplateById(templateId).then(setTemplate).catch(() => {});
    }
  }, [templateId]);

  if (!template) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const sections = [
    { labelKey: 'Name', value: template.name || template.title || '--' },
    { labelKey: 'Description', value: template.description || '--' },
    { labelKey: 'Status', value: template.status || '--' },
    { labelKey: 'Tasks', value: template.tasks ? `${template.tasks.length}` : '0' },
  ];

  return (
    <ScrollView style={[s.container, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
      <View style={s.content}>
        <View style={[s.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[s.name, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{template.name || template.title || '--'}</Text>
          {sections.map((sec, i) => (
            <View key={i} style={[s.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[s.label, { color: colors.textMuted }]}>{t(sec.labelKey)}</Text>
              <Text style={[s.value, { color: colors.ink }]}>{sec.value}</Text>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radii.xxl, padding: spacing.lg, gap: spacing.sm },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
  label: { fontSize: font.sizes.sm },
  name: { fontSize: font.sizes.xl, fontWeight: font.weights.bold, marginBottom: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: spacing.xs },
  value: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
