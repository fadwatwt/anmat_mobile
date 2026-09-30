import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchMyOrganizationLogs, fetchMyLogs, fetchAllLogs, ActivityLog, activityActionTitle, activityLogDate } from '../services/activityLogs';
import { font, spacing, radii } from '../theme';

export default function ActivityLogsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const userType = user?.type;

  const fetchData = useCallback(async (params: any) => {
    void refreshKey;
    if (userType === 'Admin') {
      return await fetchAllLogs(params);
    }
    return await fetchMyOrganizationLogs(params);
  }, [refreshKey, userType]);

  const renderAction = (item: ActivityLog) => {
    const typeColors: Record<string, string> = {
      create: '#1F7A3F',
      update: '#1E40AF',
      delete: '#C9372C',
      login: '#6B7280',
    };
    const chipColor = typeColors[item.type?.toLowerCase() || ''] || typeColors.login;
    return (
      <View style={[s.chip, { backgroundColor: chipColor + '20' }]}>
        <Text style={[s.chipText, { color: chipColor }]}>{activityActionTitle(item, t)}</Text>
      </View>
    );
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const columns = [
    {
      key: 'action',
      titleKey: 'Action',
      width: 100,
      render: (item: ActivityLog) => renderAction(item),
    },
    {
      key: 'description',
      titleKey: 'Description',
      width: 180,
      render: (item: ActivityLog) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {item.description || '—'}
        </Text>
      ),
    },
    {
      key: 'employee',
      titleKey: 'Employee',
      width: 120,
      render: (item: ActivityLog) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {item.employee?.name || '—'}
        </Text>
      ),
    },
    {
      key: 'createdAt',
      titleKey: 'Date',
      width: 140,
      render: (item: ActivityLog) => (
        <Text style={[s.cellText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
          {formatDate(activityLogDate(item))}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: ActivityLog) => item._id}
      searchable
      searchPlaceholderKey="Search logs..."
      emptyTitleKey="No activity logs"
      emptyMessageKey="No activity has been recorded yet"
      pageSize={15}
      refreshInterval={30000}
    />
  );
}

const s = StyleSheet.create({
  cellText: {
    fontSize: font.sizes.sm,
  },
  chip: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  chipText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
});
