import React, { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Eye, MessageSquarePlus, Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchDepartments, deleteDepartment } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { CreateDepartmentModal } from '../modals/CreateDepartmentModal';
import { CreateChatGroupModal } from '../modals/CreateChatGroupModal';
import type { RootStackParamList } from '../navigation/types';

export default function HRDepartmentsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions } = useAuth();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<any | null>(null);
  const [chatEntity, setChatEntity] = useState<any | null>(null);
  const [chatVisible, setChatVisible] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );

  const canCreate = has('departments.create');
  const canUpdate = has('departments.update');
  const canDelete = has('departments.delete');

  const handleDelete = (item: any) => {
    Alert.alert(t('Delete Department'), t('Are you sure you want to delete this department?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteDepartment(item._id);
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
      key: 'name',
      titleKey: 'Department Name',
      width: 150,
      render: (item: any) => (
        <Text style={{ color: colors.ink, textAlign: isRTL ? 'right' : 'left' }}>
          {item.name}
        </Text>
      ),
      sortable: true,
    },
    {
      key: 'description',
      titleKey: 'Description',
      width: 200,
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
      key: 'employees_count',
      titleKey: 'Employees Count',
      width: 120,
      render: (item: any) => (
        <Text style={{ color: colors.ink, textAlign: 'center' }}>
          {item.employees_count ?? 0}
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

  // refreshKey is referenced so fetchData identity changes after a save → ListScreen reloads
  const fetchData = useCallback(async (_params: any) => {
    void refreshKey;
    const data = await fetchDepartments();
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
        emptyTitleKey="No Departments"
        emptyMessageKey="No departments found"
        rowActions={(item: any) => [
          { label: t('Profile'), icon: <Eye size={16} color={colors.primary} />, onPress: () => navigation.navigate('DepartmentProfile', { department_id: item._id }) },
          { label: t('Create Chat Group'), icon: <MessageSquarePlus size={16} color="#10B981" />, onPress: () => { setChatEntity(item); setChatVisible(true); } },
          ...(canUpdate ? [{ label: t('Edit'), icon: <Edit3 size={16} color={colors.primary} />, onPress: () => { setEditing(item); setModalVisible(true); } }] : []),
          ...(canDelete ? [{ label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true }] : []),
        ]}
      />
      <CreateDepartmentModal
        visible={modalVisible}
        department={editing}
        onClose={() => setModalVisible(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
      <CreateChatGroupModal
        visible={chatVisible}
        entity={chatEntity}
        onClose={() => setChatVisible(false)}
      />
    </>
  );
}
