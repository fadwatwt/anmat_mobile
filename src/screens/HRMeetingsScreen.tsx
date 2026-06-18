import React, { useCallback, useState } from 'react';
import { Alert, Linking, Share, Text, TouchableOpacity, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import {
  Edit3, Trash2, Video, Share2, CalendarPlus, CalendarCheck, XCircle, Link as LinkIcon,
} from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { Badge } from '../components/Badge';
import {
  fetchMeetings, deleteMeeting, updateMeetingStatus,
  setMeetingReminder, removeMeetingReminder, Meeting, MeetingStatus,
} from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { CreateMeetingModal } from '../modals/CreateMeetingModal';
import { font, spacing } from '../theme';

const statusVariant = (s?: MeetingStatus): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'danger';
  if (s === 'in_progress') return 'warning';
  return 'info';
};

const formatDateTime = (value?: string | null) => {
  if (!value) return '-';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '-' : `${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

const normalizeUrl = (link: string) => (/^https?:\/\//i.test(link) ? link : `https://${link}`);

export default function HRMeetingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<Meeting | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const reload = () => setRefreshKey(k => k + 1);

  const openLink = (link?: string) => {
    if (!link) { Alert.alert(t('No meeting link')); return; }
    Linking.openURL(normalizeUrl(link)).catch(() => Alert.alert(t('Error'), t('Could not open the link')));
  };

  const shareLink = async (m: Meeting) => {
    if (!m.meeting_link) { Alert.alert(t('No meeting link')); return; }
    try { await Share.share({ message: `${m.title}\n${m.meeting_link}` }); } catch { /* cancelled */ }
  };

  const toggleReminder = async (m: Meeting) => {
    try {
      if (m.reminder_appointment_id) {
        await removeMeetingReminder(m._id);
        Alert.alert(t('Reminder Removed'), t('The reminder has been removed.'));
      } else {
        await setMeetingReminder(m._id);
        Alert.alert(t('Reminder Set'), t('A reminder has been added to your agenda.'));
      }
      reload();
    } catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
  };

  const cancelMeeting = (m: Meeting) => {
    Alert.alert(t('Cancel Meeting'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Yes, Cancel meeting'), style: 'destructive',
        onPress: async () => {
          try { await updateMeetingStatus(m._id, 'cancelled'); reload(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const removeMeeting = (m: Meeting) => {
    Alert.alert(t('Delete Meeting'), t('Are you sure you want to delete this meeting?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Yes, Delete'), style: 'destructive',
        onPress: async () => {
          try { await deleteMeeting(m._id); reload(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  const columns = [
    {
      key: 'title',
      titleKey: 'Meeting Title',
      width: 150,
      render: (item: Meeting) => (
        <Text style={{ color: colors.ink, textAlign: align, fontWeight: font.weights.medium }} numberOfLines={1}>{item.title}</Text>
      ),
    },
    {
      key: 'departments',
      titleKey: 'Departments',
      width: 130,
      render: (item: Meeting) => (
        <Text style={{ color: colors.textMuted, textAlign: align }} numberOfLines={1}>
          {(item.departments_ids || []).map(d => d?.name).filter(Boolean).join(', ') || '-'}
        </Text>
      ),
    },
    {
      key: 'scheduled_at',
      titleKey: 'Scheduled at',
      width: 150,
      render: (item: Meeting) => (
        <Text style={{ color: colors.textMuted, textAlign: align, fontSize: font.sizes.xs }}>{formatDateTime(item.scheduled_at)}</Text>
      ),
    },
    {
      key: 'link',
      titleKey: 'Meeting Link',
      width: 150,
      render: (item: Meeting) => (
        item.meeting_link ? (
          <View style={[styles.linkRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <TouchableOpacity onPress={() => openLink(item.meeting_link)} style={[styles.linkBtn, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <LinkIcon size={13} color={colors.primary} />
              <Text style={{ color: colors.primary, fontSize: font.sizes.xs, maxWidth: 90 }} numberOfLines={1}>{item.meeting_link}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => shareLink(item)} style={styles.iconBtn}>
              <Share2 size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={{ color: colors.textMuted, textAlign: align }}>-</Text>
        )
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 110,
      render: (item: Meeting) => (
        <Badge label={t(item.status || 'scheduled')} variant={statusVariant(item.status)} size="sm" />
      ),
    },
  ];

  const fetchData = useCallback(async () => {
    void refreshKey;
    const data = await fetchMeetings();
    return { data, total: data.length };
  }, [refreshKey]);

  return (
    <>
      <ListScreen
        columns={columns}
        fetchData={fetchData}
        keyExtractor={(item: Meeting) => item._id}
        onCreate={() => { setEditing(null); setModalVisible(true); }}
        emptyTitleKey="No Meetings"
        emptyMessageKey="No meetings found"
        rowActions={(item: Meeting) => [
          { label: t('Join Meeting'), icon: <Video size={16} color={colors.primary} />, onPress: () => openLink(item.meeting_link) },
          { label: t('Share'), icon: <Share2 size={16} color={colors.primary} />, onPress: () => shareLink(item) },
          item.reminder_appointment_id
            ? { label: t('Remove Reminder'), icon: <CalendarCheck size={16} color="#10B981" />, onPress: () => toggleReminder(item) }
            : { label: t('Set Reminder'), icon: <CalendarPlus size={16} color="#F59E0B" />, onPress: () => toggleReminder(item) },
          { label: t('Edit'), icon: <Edit3 size={16} color={colors.primary} />, onPress: () => { setEditing(item); setModalVisible(true); } },
          { label: t('Cancel'), icon: <XCircle size={16} color="#F59E0B" />, onPress: () => cancelMeeting(item) },
          { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => removeMeeting(item), destructive: true },
        ]}
      />
      <CreateMeetingModal
        visible={modalVisible}
        meeting={editing}
        onClose={() => setModalVisible(false)}
        onSaved={reload}
      />
    </>
  );
}

const styles = StyleSheet.create({
  linkRow: { alignItems: 'center', gap: spacing.xs },
  linkBtn: { alignItems: 'center', gap: 2 },
  iconBtn: { padding: 2 },
});
