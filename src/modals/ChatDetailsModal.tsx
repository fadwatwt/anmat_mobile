import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Archive, Download, Trash2, UserPlus } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { archiveChat, addChatParticipants, removeChatParticipant, ChatItem } from '../services/conversations';
import { fetchEmployees } from '../services/employees';
import { extractErrorMessage, getAuthToken } from '../lib/http';
import { API_URL } from '../config/api';
import { font, radii, spacing } from '../theme';

const avatarUrl = (name?: string, image?: string) =>
  image || `https://ui-avatars.com/api/?background=375DFB&color=fff&name=${encodeURIComponent(name || '?')}`;

type Props = {
  visible: boolean;
  onClose: () => void;
  chat: ChatItem | null;
  /** Fired after archive / participant changes so the parent can reload its lists. */
  onChanged?: () => void;
};

export function ChatDetailsModal({ visible, onClose, chat, onChanged }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { permissions, user } = useAuth();

  const [employees, setEmployees] = useState<{ label: string; value: string }[]>([]);
  const [selectedAdd, setSelectedAdd] = useState<string[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [busy, setBusy] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  const has = (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm));
  const canArchive = has('chats.initiate');
  const canExport = has('chats.export');
  const canManageParticipants = has('chats.manage_participants');
  const userId = user?._id?.toString();

  useEffect(() => {
    if (!visible || !chat) return;
    setShowAdd(false);
    setSelectedAdd([]);
    setEmployees([]);
  }, [visible, chat]);

  useEffect(() => {
    if (!visible || !showAdd || !chat) return;
    const existing = new Set((chat.participants || []).map((p) => p._id?.toString()).filter(Boolean));
    fetchEmployees({ limit: 200 })
      .then((emps) =>
        setEmployees(
          emps
            .map((e) => ({ label: e.user?.name || t('Unknown Employee'), value: e.user_id || e._id }))
            .filter((e) => e.value && !existing.has(e.value)),
        ),
      )
      .catch(() => setEmployees([]));
  }, [visible, showAdd, chat, t]);

  if (!chat) return null;

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const rowDir = (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse';
  const adminIds = (chat.group_details?.admins || []).map((a) =>
    typeof a === 'object' ? (a as any)?._id?.toString() : a.toString(),
  );
  const participants = chat.participants || [];
  const isGroup = chat.is_group;

  const handleArchive = async () => {
    setBusy(true);
    try {
      await archiveChat(chat._id, !chat.is_archived);
      onChanged?.();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to archive chat'));
    } finally {
      setBusy(false);
    }
  };

  const handleExport = () => {
    if (!canExport) {
      Alert.alert(t('Error'), t("You don't have permission to export chats."));
      return;
    }
    const token = getAuthToken();
    Linking.openURL(`${API_URL}/api/chats/${chat._id}/export?token=${encodeURIComponent(token || '')}`).catch(() =>
      Alert.alert(t('Error'), t('Failed to open export link')),
    );
  };

  const handleAdd = async () => {
    if (selectedAdd.length === 0 || !chat) return;
    setBusy(true);
    try {
      await addChatParticipants(chat._id, selectedAdd);
      setSelectedAdd([]);
      setShowAdd(false);
      Alert.alert(t('Success'), t('Members added successfully'));
      onChanged?.();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to add participants'));
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (pid: string) => {
    if (!chat) return;
    setRemovingId(pid);
    try {
      await removeChatParticipant(chat._id, pid);
      Alert.alert(t('Success'), t('Member removed successfully'));
      onChanged?.();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to remove participant'));
    } finally {
      setRemovingId(null);
    }
  };

  const actionBtn = (bg: string, border: string) => [styles.action, { backgroundColor: bg, borderColor: border }];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Chat Details')} size="md">
      <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
        <View style={[styles.header, { flexDirection: rowDir }]}>
          <Image source={{ uri: avatarUrl(chat.title, chat.image) }} style={styles.avatar} />
          <View style={styles.headerInfo}>
            <Text style={[styles.title, { color: colors.ink, textAlign: align }]}>
              {chat.title || participants.find((p) => p._id?.toString() !== userId)?.name || t('Direct Chat')}
            </Text>
            <View style={{ flexDirection: rowDir, gap: spacing.sm, marginTop: spacing.xs }}>
              <Badge label={isGroup ? t('Group Chat') : t('Direct Chat')} variant="info" />
              {chat.is_archived && <Badge label={t('In-active')} variant="danger" />}
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Actions')}</Text>
        {canArchive && (
          <TouchableOpacity style={actionBtn(colors.statusBg, colors.border)} onPress={handleArchive} disabled={busy}>
            <Archive size={16} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.ink, textAlign: align }]}>
              {chat.is_archived ? t('Unarchive Chat') : t('Archive Chat')}
            </Text>
          </TouchableOpacity>
        )}
        {canExport && (
          <TouchableOpacity style={actionBtn(colors.statusBg, colors.border)} onPress={handleExport}>
            <Download size={16} color={colors.textMuted} />
            <Text style={[styles.actionText, { color: colors.ink, textAlign: align }]}>{t('Export Chat History')}</Text>
          </TouchableOpacity>
        )}

        {isGroup && (
          <>
            <View style={[styles.sectionHead, { flexDirection: rowDir }]}>
              <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>
                {t('Members')} ({participants.length})
              </Text>
              {canManageParticipants && (
                <TouchableOpacity
                  onPress={() => {
                    setShowAdd((v) => !v);
                    setSelectedAdd([]);
                  }}
                  style={{ flexDirection: rowDir, alignItems: 'center', gap: spacing.xs }}
                >
                  <UserPlus size={14} color={colors.primary} />
                  <Text style={{ color: colors.primary, fontSize: font.sizes.xs, fontWeight: font.weights.semibold }}>{t('Add')}</Text>
                </TouchableOpacity>
              )}
            </View>

            {showAdd && canManageParticipants && (
              <View style={[styles.addPanel, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                <MultiSelectDropdown
                  label={t('Participants')}
                  options={employees}
                  value={selectedAdd}
                  onChange={setSelectedAdd}
                  placeholder={t('Select Participants')}
                />
                <Button label={t('Add Members')} onPress={handleAdd} loading={busy} />
              </View>
            )}

            {participants.length === 0 ? (
              <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No participants')}</Text>
            ) : (
              participants.map((p, i) => {
                const pid = p._id?.toString();
                const isAdmin = adminIds.includes(pid);
                const isMe = pid === userId;
                const isRemoving = removingId === pid;
                return (
                  <View
                    key={pid || i}
                    style={[
                      styles.participant,
                      { flexDirection: rowDir, borderBottomColor: colors.borderLight || colors.border },
                      i < participants.length - 1 && { borderBottomWidth: 1 },
                    ]}
                  >
                    <Image source={{ uri: avatarUrl(p.name, p.avatar) }} style={styles.pAvatar} />
                    <Text style={[styles.pName, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
                      {p.name || '—'}
                      {isMe ? ` (${t('You')})` : ''}
                    </Text>
                    {isAdmin && <Badge label={t('Admin')} variant="info" size="sm" />}
                    {canManageParticipants && !isMe && (
                      <TouchableOpacity onPress={() => handleRemove(pid || '')} disabled={isRemoving}>
                        {isRemoving ? (
                          <ActivityIndicator size="small" color={colors.danger} />
                        ) : (
                          <Trash2 size={16} color={colors.danger} />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </>
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  action: { alignItems: 'center', borderRadius: radii.xl, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  actionText: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  addPanel: { borderRadius: radii.xl, borderWidth: 1, gap: spacing.md, marginBottom: spacing.md, padding: spacing.md },
  avatar: { borderRadius: radii.full, height: 48, width: 48 },
  body: { maxHeight: 440 },
  header: { alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  headerInfo: { flex: 1 },
  pAvatar: { borderRadius: radii.full, height: 28, width: 28 },
  pName: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  participant: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
  sectionHead: { alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.md },
  sectionTitle: { fontSize: font.sizes.base, fontWeight: font.weights.bold, marginTop: spacing.md, marginBottom: spacing.xs },
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
});
