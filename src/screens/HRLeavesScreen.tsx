import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../generators/ListScreen';
import { Badge } from '../components/Badge';
import { fetchLeaves } from '../services/hr';
import type { LeaveRecord } from '../types';

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  approved: 'success',
  rejected: 'danger',
  pending: 'warning',
  cancelled: 'default',
};

const statusLabels: Record<string, string> = {
  approved: 'Approved',
  rejected: 'Rejected',
  pending: 'Pending',
  cancelled: 'Cancelled',
};

const typeLabels: Record<string, string> = {
  annual: 'Annual',
  sick: 'Sick',
  emergency: 'Emergency',
  maternity: 'Maternity',
  paternity: 'Paternity',
  unpaid: 'Unpaid',
  other: 'Other',
};

export default function HRLeavesScreen() {
  const { t } = useTranslation();

  const columns = [
    {
      key: 'Employee',
      titleKey: 'Employee',
      render: (item: LeaveRecord) => item.employee?.name || 'N/A',
      width: 150,
    },
    {
      key: 'Type',
      titleKey: 'Type',
      render: (item: LeaveRecord) => t(typeLabels[item.type] || item.type),
      width: 100,
    },
    {
      key: 'Start Date',
      titleKey: 'Start Date',
      render: (item: LeaveRecord) => item.start_date,
      width: 120,
    },
    {
      key: 'End Date',
      titleKey: 'End Date',
      render: (item: LeaveRecord) => item.end_date,
      width: 120,
    },
    {
      key: 'Days',
      titleKey: 'Days',
      render: (item: LeaveRecord) => item.days_count?.toString() || '--',
      width: 70,
    },
    {
      key: 'Status',
      titleKey: 'Status',
      render: (item: LeaveRecord) => (
        <Badge
          label={t(statusLabels[item.status] || item.status)}
          variant={statusVariant[item.status] || 'default'}
        />
      ),
      width: 100,
    },
  ];

  return (
    <ListScreen<LeaveRecord>
      columns={columns}
      fetchData={({ page, limit, search }) =>
        fetchLeaves({ page, limit, search })
      }
      keyExtractor={(item) => item._id}
      onCreate={() => Alert.alert(t('Coming Soon'), t('Create leave feature coming soon'))}
      createLabelKey="Create Leave"
      searchPlaceholderKey="Search leaves..."
    />
  );
}
