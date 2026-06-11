import React from 'react';
import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchDepartments } from '../services/hr';

export default function HRDepartmentsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const columns = [
    {
      key: 'name',
      titleKey: 'Department Name',
      width: 150,
      render: (item: any) => (
        <Text style={{ color: colors.ink, textAlign: isRTL ? 'right' : 'left' }}>
          {item.name}
        </Text>
      ),
      sortable: true,
    },
    {
      key: 'description',
      titleKey: 'Description',
      width: 200,
      render: (item: any) => (
        <Text
          style={{ color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }}
          numberOfLines={2}
        >
          {item.description || '-'}
        </Text>
      ),
    },
    {
      key: 'employees_count',
      titleKey: 'Employees Count',
      width: 120,
      render: (item: any) => (
        <Text style={{ color: colors.ink, textAlign: 'center' }}>
          {item.employees_count ?? 0}
        </Text>
      ),
    },
    {
      key: 'createdAt',
      titleKey: 'Created At',
      width: 130,
      render: (item: any) => (
        <Text style={{ color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }}>
          {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '-'}
        </Text>
      ),
    },
  ];

  const fetchData = async (_params: any) => {
    const data = await fetchDepartments();
    return { data, total: data.length };
  };

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: any) => item._id}
      onCreate={() => Alert.alert(t('Coming soon'))}
      createLabelKey="Add Department"
      emptyTitleKey="No Departments"
      emptyMessageKey="No departments found"
    />
  );
}
