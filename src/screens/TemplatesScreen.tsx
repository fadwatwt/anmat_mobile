import { Alert, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { Badge } from '../components/Badge';
import { fetchProjectTemplates, deleteProjectTemplate, ProjectTemplate } from '../services/projects';
import { extractErrorMessage } from '../lib/http';
import { font } from '../theme';

export default function TemplatesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();

  const fetchData = async ({ page, limit, search }: { page?: number; limit?: number; search?: string }) => {
    const data = await fetchProjectTemplates();
    return { data, total: data.length };
  };

  const columns = [
    {
      key: 'name',
      titleKey: 'Template',
      width: 200,
      render: (item: ProjectTemplate) => (
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
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 100,
      render: (item: ProjectTemplate) => (
        <Badge label={item.status || '--'} variant={item.status === 'active' ? 'success' : 'default'} />
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: ProjectTemplate) => item._id}
      searchable
      searchPlaceholderKey="Search templates..."
      onRowPress={(item: ProjectTemplate) => navigation.navigate('TemplateDetail', { template: item })}
      emptyTitleKey="No templates found"
      emptyMessageKey="No project templates to display"
    />
  );
}
