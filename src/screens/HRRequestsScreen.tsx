import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/Badge';
import { ListScreen } from '../generators/ListScreen';
import { useAuth } from '../context/AuthContext';
import { fetchEmployeeRequests, updateRequestStatus, deleteRequest } from '../services/employees';
import { extractErrorMessage } from '../lib/http';
import type { EmployeeRequest } from '../types';

export default function HRRequestsScreen() {
  const { t } = useTranslation();
  const { permissions } = useAuth();
  const [reloadKey, setReloadKey] = useState(0);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );

  const canUpdate = has('employee_requests.update');
  const canDelete = has('employee_requests.delete');

  const reload = () => setReloadKey(k => k + 1);

  const fetchData = useCallback(async (params: { page?: number; limit?: number }) => {
    const res = await fetchEmployeeRequests({ page: params?.page, limit: params?.limit });
    return { data: res?.data ?? [], total: res?.total ?? 0 };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

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
        const variant = item.status === 'accepted' ? 'success' : item.status === 'rejected' || item.status === 'cancelled' ? 'danger' : 'warning';
        const label = item.status ? t(item.status.charAt(0).toUpperCase() + item.status.slice(1)) : item.status;
        return <Badge label={label} variant={variant} />;
      },
    },
    {
      key: 'Created At',
      titleKey: 'Created At',
      render: (item: EmployeeRequest) => item.created_at,
    },
    {
      key: 'Reason',
      titleKey: 'Reason',
      render: (item: EmployeeRequest) => item.reason || '—',
    },
  ];

  const handleApprove = async (id: string) => {
    try {
      await updateRequestStatus(id, 'accepted');
      reload();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to approve request'));
    }
  };

  const handleReject = async (id: string) => {
    try {
      await updateRequestStatus(id, 'rejected');
      reload();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to reject request'));
    }
  };

  const handleDelete = (item: EmployeeRequest) => {
    Alert.alert(t('Delete Request'), t('Are you sure? This action cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try { await deleteRequest(item._id); reload(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to delete request')); }
        },
      },
    ]);
  };

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: EmployeeRequest) => item._id}
      emptyTitleKey="No requests"
      emptyMessageKey="No requests found"
      rowActions={(item: EmployeeRequest) => [
        ...(canUpdate
          ? [
              { label: t('Approve'), onPress: () => handleApprove(item._id) },
              { label: t('Reject'), onPress: () => handleReject(item._id), destructive: true },
            ]
          : []),
        ...(canDelete ? [{ label: t('Delete'), onPress: () => handleDelete(item), destructive: true }] : []),
      ]}
    />
  );
}
