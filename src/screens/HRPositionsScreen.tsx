import React, { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchPositions, deletePosition } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { CreatePositionModal } from '../modals/CreatePositionModal';

export default function HRPositionsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );

  const canCreate = has('positions.create');
  const canUpdate = has('positions.update');
  const canDelete = has('positions.delete');

  const handleDelete = (item: any) => {
    Alert.alert(t('Delete Position'), t('Are you sure you want to delete this position?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deletePosition(item._id);
            setRefreshKey(k => k + 1);
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          }
        },
      },
    ]);
  };

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
        onCreate={canCreate ? () => { setEditing(null); setModalVisible(true); } : undefined}
        onRowPress={canUpdate ? (item: any) => { setEditing(item); setModalVisible(true); } : undefined}
        emptyTitleKey="No Positions"
        emptyMessageKey="No positions found"
        rowActions={(item: any) => [
          ...(canUpdate ? [{ label: t('Edit'), icon: <Edit3 size={16} color={colors.primary} />, onPress: () => { setEditing(item); setModalVisible(true); } }] : []),
          ...(canDelete ? [{ label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true }] : []),
        ]}
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
