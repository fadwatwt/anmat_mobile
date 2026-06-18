import React, { useCallback, useState } from 'react';
import { Alert, Image, Text, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Edit3, Trash2, Star } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchTeams, deleteTeam, Team } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { CreateTeamModal } from '../modals/CreateTeamModal';
import { RateTeamModal } from '../modals/RateTeamModal';
import { font, spacing } from '../theme';

const avatarUrl = (name?: string, image?: string) =>
  image || `https://ui-avatars.com/api/?background=375DFB&color=fff&name=${encodeURIComponent(name || '?')}`;

export default function HRTeamsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [modalVisible, setModalVisible] = useState(false);
  const [rateVisible, setRateVisible] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [rating, setRating] = useState<Team | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const columns = [
    {
      key: 'name',
      titleKey: 'Teams',
      width: 170,
      render: (item: Team) => (
        <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Image source={{ uri: avatarUrl(item.name, item.icon) }} style={styles.avatar} />
          <Text style={{ color: colors.ink, textAlign: align, flex: 1 }} numberOfLines={1}>{item.name}</Text>
        </View>
      ),
    },
    {
      key: 'related',
      titleKey: 'Related Model',
      width: 150,
      render: (item: Team) => (
        <Text style={{ color: colors.textMuted, textAlign: align }} numberOfLines={1}>
          {item.related_model?.name || item.related_model_type || '-'}
        </Text>
      ),
    },
    {
      key: 'leader',
      titleKey: 'Team Leader',
      width: 150,
      render: (item: Team) => (
        <Text style={{ color: colors.ink, textAlign: align }} numberOfLines={1}>
          {item.leader_id?.name || t('No Leader')}
        </Text>
      ),
    },
    {
      key: 'employees',
      titleKey: 'No. of Employees',
      width: 110,
      render: (item: Team) => (
        <Text style={{ color: colors.ink, textAlign: 'center' }}>{item.employees_count ?? (item.members_ids?.length || 0)}</Text>
      ),
    },
    {
      key: 'tasks',
      titleKey: 'No. of Active Tasks / Projects',
      width: 130,
      render: (item: Team) => (
        <Text style={{ color: colors.ink, textAlign: 'center' }}>{item.active_tasks_count ?? 0}</Text>
      ),
    },
    {
      key: 'score',
      titleKey: 'Score',
      width: 90,
      render: (item: Team) => (
        <Text style={{ color: colors.ink, textAlign: 'center' }}>
          {item.score && item.score > 0 ? item.score : '-'}
        </Text>
      ),
    },
  ];

  const fetchData = useCallback(async () => {
    void refreshKey;
    const data = await fetchTeams();
    return { data, total: data.length };
  }, [refreshKey]);

  const handleDelete = (item: Team) => {
    Alert.alert(t('Delete Team'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try { await deleteTeam(item._id); setRefreshKey(k => k + 1); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const handleRate = (item: Team) => {
    setRating(item);
    setRateVisible(true);
  };

  return (
    <>
      <ListScreen
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: Team) => item._id}
        onCreate={() => { setEditing(null); setModalVisible(true); }}
        emptyTitleKey="No Teams"
        emptyMessageKey="No teams found"
        rowActions={(item: Team) => [
          { label: t('Edit'), icon: <Edit3 size={16} color={colors.primary} />, onPress: () => { setEditing(item); setModalVisible(true); } },
          { label: t('Rate'), icon: <Star size={16} color="#F59E0B" />, onPress: () => handleRate(item) },
          { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleDelete(item), destructive: true },
        ]}
      />
      <CreateTeamModal
        visible={modalVisible}
        team={editing}
        onClose={() => setModalVisible(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
      <RateTeamModal
        visible={rateVisible}
        team={rating}
        onClose={() => setRateVisible(false)}
        onSaved={() => setRefreshKey(k => k + 1)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  row: { alignItems: 'center', gap: spacing.xs },
  avatar: { width: 28, height: 28, borderRadius: 14 },
});
