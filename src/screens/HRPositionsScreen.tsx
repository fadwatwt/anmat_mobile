import React, { useCallback, useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchPositions } from '../services/hr';
import { CreatePositionModal } from '../modals/CreatePositionModal';

export default function HRPositionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const columns = [
    {
      key: 'title',
      titleKey: 'Position Name',
      width: 180,
      render: (item: any) => (
        <Text style={{ color: colors.ink, textAlign: isRTL ? 'right' : 'left' }}>
          {item.title || item.name}
        </Text>
      ),
      sortable: true,
    },
    {
      key: 'description',
      titleKey: 'Description',
      width: 220,
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

  const fetchData = useCallback(async (_params: any) => {
    void refreshKey;
    const data = await fetchPositions();
    return { data, total: data.length };
  }, [refreshKey]);

  return (
    <>
      <ListScreen
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: any) => item._id}
        onCreate={() => { setEditing(null); setModalVisible(true); }}
        onRowPress={(item: any) => { setEditing(item); setModalVisible(true); }}
        emptyTitleKey="No Positions"
        emptyMessageKey="No positions found"
      />
      <CreatePositionModal
        visible={modalVisible}
        position={editing}
        onClose={() => setModalVisible(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    </>
  );
}
