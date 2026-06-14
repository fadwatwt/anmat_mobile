import React, { useCallback, useState } from 'react';
import { Alert, Text } from 'react-native';
import { Edit3, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchIndustriesOrganizationsCount } from '../services/dashboard';
import { deleteIndustry, Industry } from '../services/industries';
import { CreateIndustryModal } from '../modals/CreateIndustryModal';
import { extractErrorMessage } from '../lib/http';
import { IndustryCount } from '../types';
import { font } from '../theme';

export default function IndustriesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Industry | null>(null);

  const fetchData = useCallback(async () => {
    const data = await fetchIndustriesOrganizationsCount();
    return { data, total: data.length };
  }, [reloadKey]);

  const reload = () => setReloadKey((k) => k + 1);

  const handleCreate = () => { setEditing(null); setModalOpen(true); };
  const handleEdit = (item: IndustryCount) => {
    setEditing({ _id: item._id, name: item.name || '', is_allowed: true });
    setModalOpen(true);
  };
  const handleDelete = (item: IndustryCount) => {
    Alert.alert(t('Delete'), t('Are you sure? This action cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try { await deleteIndustry(item._id); reload(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const columns = [
    {
      key: 'name',
      titleKey: 'Industry',
      width: 200,
      render: (item: IndustryCount) => (
        <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
          {item.name || '--'}
        </Text>
      ),
    },
    {
      key: 'organizations_count',
      titleKey: 'Organizations',
      width: 120,
      render: (item: IndustryCount) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: 'center' }}>
          {item.organizations_count ?? 0}
        </Text>
      ),
    },
  ];

  return (
    <>
      <ListScreen
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: IndustryCount) => item._id}
        searchable
        searchPlaceholderKey="Search industries..."
        onCreate={handleCreate}

        rowActions={(item: IndustryCount) => [
          { label: t('Edit'), icon: <Edit3 size={16} color="#375DFB" />, onPress: () => handleEdit(item) },
          { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true },
        ]}
        emptyTitleKey="No industries found"
        emptyMessageKey="No industries to display"
      />
      <CreateIndustryModal visible={modalOpen} onClose={() => setModalOpen(false)} onSaved={reload} industry={editing} />
    </>
  );
}
