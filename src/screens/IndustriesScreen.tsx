import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchIndustriesOrganizationsCount } from '../services/dashboard';
import { IndustryCount } from '../types';
import { font } from '../theme';

const fetchData = async (_params: any) => {
  const data = await fetchIndustriesOrganizationsCount();
  return { data, total: data.length };
};

export default function IndustriesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const columns = [
    {
      key: 'name',
      titleKey: 'Industry',
      width: 200,
      render: (item: IndustryCount) => (
        <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.name || '--'}
        </Text>
      ),
    },
    {
      key: 'organizations_count',
      titleKey: 'Organizations',
      width: 120,
      render: (item: IndustryCount) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: 'center' }}>
          {item.organizations_count ?? 0}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: IndustryCount) => item._id}
      searchable
      searchPlaceholderKey="Search industries..."
      emptyTitleKey="No industries found"
      emptyMessageKey="No industries to display"
    />
  );
}
