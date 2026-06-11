import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/Badge';
import { ListScreen } from '../generators/ListScreen';
import { fetchSalaryTransactions } from '../services/hr';
import type { SalaryTransaction } from '../types';

export default function HRSalaryScreen() {
  const { t } = useTranslation();

  const columns = [
    {
      key: 'Employee',
      titleKey: 'Employee',
      render: (item: SalaryTransaction) => item.employee?.name || 'N/A',
    },
    {
      key: 'Type',
      titleKey: 'Type',
      render: (item: SalaryTransaction) => item.type,
    },
    {
      key: 'Amount',
      titleKey: 'Amount',
      render: (item: SalaryTransaction) => `${item.amount?.toLocaleString()}`,
    },
    {
      key: 'Month',
      titleKey: 'Month',
      render: (item: SalaryTransaction) => item.month,
    },
    {
      key: 'Year',
      titleKey: 'Year',
      render: (item: SalaryTransaction) => item.year?.toString(),
    },
    {
      key: 'Status',
      titleKey: 'Status',
      render: (item: SalaryTransaction) => {
        const variant = item.status === 'paid' ? 'success' : item.status === 'pending' ? 'warning' : 'danger';
        return <Badge label={item.status} variant={variant} />;
      },
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={({ page, limit, search }) => fetchSalaryTransactions({ page, limit, search })}
      keyExtractor={(item: SalaryTransaction) => item._id}
      onCreate={() => Alert.alert(t('Coming soon'), t('This feature is under development'))}
      createLabelKey="Create"
    />
  );
}
