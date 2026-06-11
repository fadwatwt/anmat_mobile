import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchMoneyMethods, MoneyMethod } from '../services/moneyMethods';
import { font } from '../theme';

const fetchData = async (_params: any) => {
  const data = await fetchMoneyMethods();
  return { data, total: data.length };
};

export default function MoneyMethodsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const columns = [
    {
      key: 'name',
      titleKey: 'Method',
      width: 180,
      render: (item: MoneyMethod) => (
        <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.name || '--'}
        </Text>
      ),
    },
    {
      key: 'type',
      titleKey: 'Type',
      width: 120,
      render: (item: MoneyMethod) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }}>
          {item.type || '--'}
        </Text>
      ),
    },
    {
      key: 'is_active',
      titleKey: 'Status',
      width: 100,
      render: (item: MoneyMethod) => (
        <Badge label={item.is_active ? t('Active') : t('Inactive')} variant={item.is_active ? 'success' : 'default'} />
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: MoneyMethod) => item._id}
      searchable
      searchPlaceholderKey="Search methods..."
      emptyTitleKey="No methods found"
      emptyMessageKey="No payment methods to display"
    />
  );
}
