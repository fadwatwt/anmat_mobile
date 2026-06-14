import React, { useCallback, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/Badge';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchSystemAdmins, SystemAdmin } from '../services/systemAdmins';
import { CreateAdminModal } from '../modals/CreateAdminModal';
import { font } from '../theme';

export default function SystemAdminsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [reloadKey, setReloadKey] = useState(0);
  const [modalOpen, setModalOpen] = useState(false);

  const fetchData = useCallback(async () => {
    const data = await fetchSystemAdmins();
    return { data, total: data.length };
  }, [reloadKey]);

  const columns = [
    {
      key: 'name',
      titleKey: 'Admin',
      width: 150,
      render: (item: SystemAdmin) => (
        <View style={{ gap: 2 }}>
          <Text style={{ color: colors.ink, fontWeight: font.weights.semibold, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
            {item.name || '--'}
          </Text>
          {item.email && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: isRTL ? 'right' : 'left' }} numberOfLines={1}>
              {item.email}
            </Text>
          )}
        </View>
      ),
    },
    {
      key: 'role',
      titleKey: 'Role',
      width: 130,
      render: (item: SystemAdmin) => (
        <Text style={{ color: colors.ink, fontSize: font.sizes.sm, textAlign: isRTL ? 'right' : 'left' }}>
          {item.role || '--'}
        </Text>
      ),
    },
    {
      key: 'is_active',
      titleKey: 'Status',
      width: 100,
      render: (item: SystemAdmin) => (
        <Badge label={item.is_active ? t('Active') : t('Inactive')} variant={item.is_active ? 'success' : 'danger'} />
      ),
    },
  ];

  return (
    <>
      <ListScreen
        key={reloadKey}
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: SystemAdmin) => item._id}
        searchable
        searchPlaceholderKey="Search admins..."
        onCreate={() => setModalOpen(true)}

        emptyTitleKey="No admins found"
        emptyMessageKey="No system admins to display"
      />
      <CreateAdminModal visible={modalOpen} onClose={() => setModalOpen(false)} onSaved={() => setReloadKey((k) => k + 1)} />
    </>
  );
}
