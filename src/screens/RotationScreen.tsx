import React, { useCallback, useState } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchRotations, Rotation } from '../services/rotation';
import { font, spacing, radii } from '../theme';

export default function RotationScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [refreshKey, setRefreshKey] = useState(0);

  const fetchData = useCallback(async (params: any) => {
    void refreshKey;
    return await fetchRotations(params);
  }, [refreshKey]);

  const shiftColors: Record<string, string> = {
    MORNING: '#1F7A3F',
    AFTERNOON: '#B45309',
    NIGHT: '#1E40AF',
  };

  const renderShift = (shiftType?: string) => {
    const color = shiftColors[shiftType || ''] || '#6B7280';
    return (
      <View style={[s.shiftChip, { backgroundColor: color + '20' }]}>
        <Text style={[s.shiftText, { color }]}>{shiftType || '—'}</Text>
      </View>
    );
  };

  const columns = [
    {
      key: 'employee',
      titleKey: 'Employee',
      width: 160,
      render: (item: Rotation) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
          {item.employee?.name || '—'}
        </Text>
      ),
    },
    {
      key: 'date',
      titleKey: 'Date',
      width: 120,
      sortable: true,
      render: (item: Rotation) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.date ? new Date(item.date).toLocaleDateString('en-GB') : '—'}
        </Text>
      ),
    },
    {
      key: 'shift_type',
      titleKey: 'Shift',
      width: 110,
      render: (item: Rotation) => renderShift(item.shift_type),
    },
    {
      key: 'start_time',
      titleKey: 'Start Time',
      width: 100,
      render: (item: Rotation) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.start_time || '—'}
        </Text>
      ),
    },
    {
      key: 'end_time',
      titleKey: 'End Time',
      width: 100,
      render: (item: Rotation) => (
        <Text style={[s.cellText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {item.end_time || '—'}
        </Text>
      ),
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: Rotation) => item._id}
      searchable
      searchPlaceholderKey="Search rotations..."
      emptyTitleKey="No rotations"
      emptyMessageKey="No rotations found"
    />
  );
}

const s = StyleSheet.create({
  cellText: {
    fontSize: font.sizes.sm,
  },
  shiftChip: {
    alignSelf: 'flex-start',
    borderRadius: radii.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  shiftText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
});
