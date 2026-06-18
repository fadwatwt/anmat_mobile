import React, { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchHolidays, deleteHoliday, Holiday } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { CreateHolidayModal } from '../modals/CreateHolidayModal';

const formatDate = (value?: string) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : d.toLocaleDateString();
};

export default function HRHolidaysScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Holiday | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const columns = [
    {
      key: 'name',
      titleKey: 'Holiday Name',
      width: 160,
      render: (item: Holiday) => (
        <Text style={{ color: colors.ink, textAlign: align }} numberOfLines={1}>{item.name}</Text>
      ),
    },
    {
      key: 'date',
      titleKey: 'Date',
      width: 120,
      render: (item: Holiday) => (
        <Text style={{ color: colors.textMuted, textAlign: align }}>{formatDate(item.date)}</Text>
      ),
    },
    {
      key: 'description',
      titleKey: 'Description',
      width: 200,
      render: (item: Holiday) => (
        <Text style={{ color: colors.textMuted, textAlign: align }} numberOfLines={2}>{item.description || '-'}</Text>
      ),
    },
  ];

  const fetchData = useCallback(async () => {
    void refreshKey;
    const data = await fetchHolidays();
    return { data, total: data.length };
  }, [refreshKey]);

  const handleDelete = (item: Holiday) => {
    Alert.alert(t('Delete Holiday'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try {
            await deleteHoliday(item._id);
            setRefreshKey(k => k + 1);
          } catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  return (
    <>
      <ListScreen
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: Holiday) => item._id}
        onCreate={() => { setEditing(null); setModalVisible(true); }}
        emptyTitleKey="No Holidays"
        emptyMessageKey="No holidays found"
        rowActions={(item: Holiday) => [
          { label: t('Edit'), icon: <Edit3 size={16} color={colors.primary} />, onPress: () => { setEditing(item); setModalVisible(true); } },
          { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true },
        ]}
      />
      <CreateHolidayModal
        visible={modalVisible}
        holiday={editing}
        onClose={() => setModalVisible(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    </>
  );
}
