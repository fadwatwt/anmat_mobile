import React, { useCallback, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Trash2, Users } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { ListScreen } from '../generators/ListScreen';
import { fetchChats, fetchChatPermissions, archiveChat, ChatItem, ChatPermission } from '../services/conversations';
import { extractErrorMessage } from '../lib/http';
import { CreateChatModal } from '../modals/CreateChatModal';
import { ChatDetailsModal } from '../modals/ChatDetailsModal';
import { AddChatParticipantsModal } from '../modals/AddChatParticipantsModal';
import { font, radii, spacing } from '../theme';

const avatarUrl = (name?: string, image?: string) =>
  image || `https://ui-avatars.com/api/?background=375DFB&color=fff&name=${encodeURIComponent(name || '?')}`;

export default function HRChatsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [tab, setTab] = useState<'chats' | 'permissions'>('chats');
  const [refreshKey, setRefreshKey] = useState(0);
  const [createVisible, setCreateVisible] = useState(false);
  const [detailsChat, setDetailsChat] = useState<ChatItem | null>(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [addChat, setAddChat] = useState<ChatItem | null>(null);
  const [addVisible, setAddVisible] = useState(false);
  const [permissions, setPermissions] = useState<ChatPermission[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(false);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const loadPermissions = useCallback(async () => {
    setPermissionsLoading(true);
    try {
      setPermissions(await fetchChatPermissions());
    } catch {
      setPermissions([]);
    } finally {
      setPermissionsLoading(false);
    }
  }, []);

  const fetchData = useCallback(async (_params: any) => {
    void refreshKey;
    const chats = await fetchChats();
    const groups = chats.filter((c) => c.is_group);
    return { data: groups, total: groups.length };
  }, [refreshKey]);

  const handleArchive = (item: ChatItem) => {
    Alert.alert(t('Delete Chat Group'), t('Are you sure you want to delete this chat group?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Yes, Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await archiveChat(item._id, true);
            setRefreshKey(k => k + 1);
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to archive chat group'));
          }
        },
      },
    ]);
  };

  const columns = [
    {
      key: 'title',
      titleKey: 'Chat Group Title',
      width: 180,
      render: (item: ChatItem) => (
        <View style={[styles.titleCell, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Image source={{ uri: avatarUrl(item.title, item.image) }} style={styles.avatar} />
          <Text style={{ color: colors.ink, textAlign: align, flex: 1 }} numberOfLines={1}>{item.title || t('Untitled Group')}</Text>
        </View>
      ),
    },
    {
      key: 'admins',
      titleKey: 'Admins',
      width: 130,
      render: (item: ChatItem) => {
        const adminIds = (item.group_details?.admins || []).map((a) =>
          typeof a === 'object' ? (a as any)?._id?.toString() : a.toString(),
        );
        const adminUsers = (item.participants || []).filter((p) => adminIds.includes(p._id?.toString()));
        if (adminUsers.length === 0) {
          return <Text style={{ color: colors.textMuted, textAlign: align }}>—</Text>;
        }
        const visible = adminUsers.slice(0, 3);
        return (
          <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center' }}>
            {visible.map((a, i) => (
              <Image key={a._id || i} source={{ uri: avatarUrl(a.name, a.avatar) }} style={[styles.miniAvatar, { marginLeft: i > 0 ? -8 : 0 }]} />
            ))}
            {adminUsers.length > 3 && (
              <View style={[styles.miniAvatar, styles.miniMore]}>
                <Text style={styles.miniMoreText}>+{adminUsers.length - 3}</Text>
              </View>
            )}
          </View>
        );
      },
    },
    {
      key: 'participants',
      titleKey: 'No. of Participants',
      width: 110,
      render: (item: ChatItem) => (
        <View style={{ flexDirection: isRTL ? 'row-reverse' : 'row', alignItems: 'center', gap: spacing.xs, justifyContent: 'center' }}>
          <Users size={14} color={colors.textMuted} />
          <Text style={{ color: colors.ink, textAlign: 'center' }}>{(item.participants || []).length}</Text>
        </View>
      ),
    },
    {
      key: 'status',
      titleKey: 'Status',
      width: 100,
      render: (item: ChatItem) => (
        <Text
          style={{
            color: item.is_archived ? '#B45309' : '#16A34A',
            backgroundColor: item.is_archived ? '#FEF3C7' : '#E7F8ED',
            textAlign: 'center',
            borderRadius: radii.full,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.xs,
            overflow: 'hidden',
            fontWeight: font.weights.semibold,
            fontSize: font.sizes.xs,
          }}
        >
          {item.is_archived ? t('In-active') : t('Active')}
        </Text>
      ),
    },
  ];

  return (
    <>
      {/* Segmented tab control */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={[styles.tabsContent, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
        style={[styles.tabs, { backgroundColor: colors.surface, borderColor: colors.border }]}
      >
        {([
          { key: 'chats', label: t('Chats') },
          { key: 'permissions', label: t('Chat Permissions') },
        ] as const).map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tabBtn, tab === item.key && { backgroundColor: colors.primary }]}
            onPress={() => {
              setTab(item.key);
              if (item.key === 'permissions' && permissions.length === 0) loadPermissions();
            }}
          >
            <Text numberOfLines={1} style={[styles.tabText, { color: tab === item.key ? '#FFF' : colors.textMuted }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {tab === 'chats' ? (
        <ListScreen
          columns={columns}
          fetchData={fetchData}
          keyExtractor={(item: ChatItem) => item._id}
          onCreate={() => setCreateVisible(true)}
          emptyTitleKey="No Chats"
          emptyMessageKey="No group chats found"
          rowActions={(item: ChatItem) => [
            { label: t('View'), icon: <Eye size={16} color={colors.primary} />, onPress: () => { setDetailsChat(item); setDetailsVisible(true); } },
            { label: t('Edit'), icon: <Pencil size={16} color={colors.primary} />, onPress: () => { setAddChat(item); setAddVisible(true); } },
            { label: t('Delete'), icon: <Trash2 size={16} color="#DF1C41" />, onPress: () => handleArchive(item), destructive: true },
          ]}
        />
      ) : (
        <ScrollView style={[styles.permissionsWrap, { backgroundColor: colors.background }]} showsVerticalScrollIndicator={false}>
          <View style={[styles.permissionsCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[styles.permissionsTitle, { color: colors.ink, textAlign: align }]}>{t('Chat Permissions')}</Text>
            {permissionsLoading && permissions.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }}>{t('Loading...')}</Text>
            ) : permissions.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: spacing.xl }}>{t('No permissions found')}</Text>
            ) : (
              permissions.map((perm, i) => (
                <View
                  key={perm._id}
                  style={[
                    styles.permRow,
                    { borderBottomColor: colors.borderLight || colors.border },
                    i < permissions.length - 1 && { borderBottomWidth: 1 },
                  ]}
                >
                  <Text style={[styles.permName, { color: colors.ink, textAlign: align }]}>{perm.name}</Text>
                  <Text style={[styles.permDesc, { color: colors.textMuted, textAlign: align }]}>{perm.description || '—'}</Text>
                </View>
              ))
            )}
          </View>
        </ScrollView>
      )}

      <CreateChatModal visible={createVisible} onClose={() => setCreateVisible(false)} onSaved={() => setRefreshKey(k => k + 1)} />
      <ChatDetailsModal visible={detailsVisible} chat={detailsChat} onClose={() => setDetailsVisible(false)} />
      <AddChatParticipantsModal visible={addVisible} chat={addChat} onClose={() => setAddVisible(false)} onSaved={() => setRefreshKey(k => k + 1)} />
    </>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: radii.full, height: 32, width: 32 },
  miniAvatar: { borderRadius: radii.full, height: 26, width: 26, borderWidth: 2, borderColor: '#FFF' },
  miniMore: { backgroundColor: '#E5E7EB', alignItems: 'center', justifyContent: 'center' },
  miniMoreText: { color: '#6B7280', fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  permDesc: { fontSize: font.sizes.sm, marginTop: 2 },
  permName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  permRow: { paddingVertical: spacing.md },
  permissionsCard: { borderRadius: radii.xxl, borderWidth: 1, padding: spacing.md },
  permissionsTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginBottom: spacing.xs },
  permissionsWrap: { flex: 1, padding: spacing.md },
  tabBtn: { alignItems: 'center', borderRadius: radii.xl, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  tabText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  tabs: { borderRadius: radii.xl, borderWidth: 1, margin: spacing.md, marginBottom: 0, padding: spacing.xs },
  tabsContent: { gap: spacing.xs },
  titleCell: { alignItems: 'center', gap: spacing.sm },
});
