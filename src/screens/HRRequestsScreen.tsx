import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/Badge';
import { ListScreen } from '../generators/ListScreen';
import { fetchEmployeeRequests, updateRequestStatus } from '../services/employees';
import type { EmployeeRequest } from '../types';

export default function HRRequestsScreen() {
  const { t } = useTranslation();

  const columns = [
    {
      key: 'Employee',
      titleKey: 'Employee',
      render: (item: EmployeeRequest) => item.employee?.name || 'N/A',
    },
    {
      key: 'Type',
      titleKey: 'Type',
      render: (item: EmployeeRequest) => item.type,
    },
    {
      key: 'Status',
      titleKey: 'Status',
      render: (item: EmployeeRequest) => {
        const variant = item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : item.status === 'pending' ? 'warning' : 'default';
        return <Badge label={item.status} variant={variant} />;
      },
    },
    {
      key: 'Created At',
      titleKey: 'Created At',
      render: (item: EmployeeRequest) => item.createdAt,
    },
  ];

  const handleApprove = async (id: string) => {
    try {
      await updateRequestStatus(id, 'approved');
    } catch {
      Alert.alert(t('Error'), t('Failed to approve request'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateRequestStatus(id, 'rejected');
    } catch {
      Alert.alert(t('Error'), t('Failed to reject request'));
    }
  };

  return (
    <ListScreen
      columns={columns}
      fetchData={({ page, limit }) => fetchEmployeeRequests({ page, limit })}
      keyExtractor={(item: EmployeeRequest) => item._id}
      rowActions={(item: EmployeeRequest) => [
        { label: t('Approve'), onPress: () => handleApprove(item._id) },
        { label: t('Reject'), onPress: () => handleReject(item._id), destructive: true },
      ]}
    />
  );
}
