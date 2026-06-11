import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ListScreen } from '../generators/ListScreen';
import { Badge } from '../components/Badge';
import { fetchAttendances } from '../services/hr';
import type { AttendanceRecord } from '../types';

const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'info' | 'default'> = {
  present: 'success',
  absent: 'danger',
  late: 'warning',
  early_leave: 'warning',
  on_leave: 'info',
};

const statusLabels: Record<string, string> = {
  present: 'Present',
  absent: 'Absent',
  late: 'Late',
  early_leave: 'Early Leave',
  on_leave: 'On Leave',
};

export default function HRAttendancesScreen() {
  const { t } = useTranslation();

  const columns = [
    {
      key: 'Employee',
      titleKey: 'Employee',
      render: (item: AttendanceRecord) => item.employee?.name || 'N/A',
      width: 150,
    },
    {
      key: 'Date',
      titleKey: 'Date',
      render: (item: AttendanceRecord) => item.date,
      width: 120,
    },
    {
      key: 'Check In',
      titleKey: 'Check In',
      render: (item: AttendanceRecord) => item.check_in || '--',
      width: 100,
    },
    {
      key: 'Check Out',
      titleKey: 'Check Out',
      render: (item: AttendanceRecord) => item.check_out || '--',
      width: 100,
    },
    {
      key: 'Status',
      titleKey: 'Status',
      render: (item: AttendanceRecord) => (
        <Badge
          label={t(statusLabels[item.status] || item.status)}
          variant={statusVariant[item.status] || 'default'}
        />
      ),
      width: 100,
    },
  ];

  return (
    <ListScreen<AttendanceRecord>
      columns={columns}
      fetchData={({ page, limit, search }) =>
        fetchAttendances({ page, limit, search })
      }
      keyExtractor={(item) => item._id}
      onCreate={() => Alert.alert(t('Coming Soon'), t('Create attendance feature coming soon'))}
      createLabelKey="Create Attendance"
      searchPlaceholderKey="Search attendances..."
    />
  );
}
