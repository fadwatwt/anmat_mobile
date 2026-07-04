import React, { useCallback } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchAppointments, Appointment } from '../services/appointments';
import { font } from '../theme';

const statusColors: Record<string, string> = {
  upcoming: '#3B82F6',
  completed: '#10B981',
  cancelled: '#EF4444',
};

export default function AppointmentsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const navigation = useNavigation<any>();

  const fetchData = useCallback(async ({ page, limit, search }: { page?: number; limit?: number; search?: string }) => {
    const data = await fetchAppointments(user?.type);
    return { data, total: data.length };
  }, [user]);

  const columns = [
    {
      key: 'title',
      titleKey: 'Title',
      width: 180,
      render: (item: Appointment) => (
        <View style={{ gap: 2 }}>
          <Text
            style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }}
            numberOfLines={1}
          >
            {item.title || '--'}
          </Text>
          {item.description && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.description}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'date',
      titleKey: 'Date',
      width: 110,
      render: (item: Appointment) => (
        <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }}>
          {item.date ? item.date.slice(0, 10) : '--'}
        </Text>
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 100,
      render: (item: Appointment) => {
        const s = (item.status || 'upcoming').toLowerCase();
        const dotColor = statusColors[s] || '#6B7280';
        return (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: dotColor }} />
            <Text style={{ color: colors.ink, fontSize: font.sizes.xs }}>{t(s.charAt(0).toUpperCase() + s.slice(1))}</Text>
          </View>
        );
      },
    },
  ];

  return (
    <ListScreen
      columns={columns}
      fetchData={fetchData}
      keyExtractor={(item: Appointment) => item._id}
      searchable
      searchPlaceholderKey="Search appointments..."
      onCreate={() => navigation.navigate('Agenda')}
      emptyTitleKey="No appointments found"
      emptyMessageKey="No appointments to display"
    />
  );
}
