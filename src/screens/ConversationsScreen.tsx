import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send, ArrowLeft, Check, CheckCheck } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { font, radii, spacing } from '../theme';
import {
  ChatItem,
  ChatMessage,
  fetchChats,
  fetchMessages,
  markChatRead,
} from '../services/conversations';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';

export default function ConversationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user, token } = useAuth();
  const flatListRef = useRef<FlatList>(null);
  const userId = user?._id;

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);
    s.on('connect', () => setSocketConnected(true));
    s.on('disconnect', () => setSocketConnected(false));
    s.on('new_message', (msg: ChatMessage) => {
      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
      loadChats();
    });
    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('new_message');
      disconnectSocket();
    };
  }, [token]);

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    try { setChats(await fetchChats()); } catch {}
    finally { setLoadingChats(false); }
  }, []);

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => {
    if (!activeChat) return;
    (async () => {
      setLoadingMsgs(true);
      try {
        const msgs = await fetchMessages(activeChat._id);
        setMessages(msgs);
        markChatRead(activeChat._id);
        const s = getSocket();
        if (s?.connected) s.emit('join_chat', { chat_id: activeChat._id });
      } catch { setMessages([]); }
      finally { setLoadingMsgs(false); }
    })();
  }, [activeChat]);

  const handleSelectChat = (chat: ChatItem) => {
    setActiveChat(chat);
  };

  const handleSend = async () => {
    if (!input.trim() || !activeChat || sending) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    const s = getSocket();
    if (s?.connected) {
      s.emit('send_message', { chat_id: activeChat._id, content: text }, (ack: any) => {
        if (ack?.error) {
          Alert.alert(t('Error'), t('Failed to send message'));
        }
        setSending(false);
      });
    } else {
      Alert.alert(t('Error'), t('Not connected to chat server'));
      setSending(false);
    }
  };

  const isMyMessage = (msg: ChatMessage): boolean => {
    if (!userId) return false;
    if (typeof msg.sent_by === 'string') return msg.sent_by === userId;
    return msg.sent_by?._id === userId;
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const formatRelative = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return formatTime(dateStr);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const chatTitle = (chat: ChatItem) => chat.title || chat.participants?.map(p => p.name).join(', ') || t('Chat');

  if (!activeChat) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border }]}>
          <Text style={[s.headerTitle, { color: colors.ink }]}>{t('Conversations')}</Text>
          {socketConnected && <View style={s.onlineDot} />}
        </View>
        {loadingChats ? (
          <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            data={chats}
            keyExtractor={c => c._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.chatItem, { borderBottomColor: colors.border }]}
                onPress={() => handleSelectChat(item)}
              >
                <View style={[s.avatar, { backgroundColor: colors.primary }]}>
                  <Text style={s.avatarText}>
                    {(chatTitle(item)).slice(0, 1).toUpperCase()}
                  </Text>
                </View>
                <View style={s.chatInfo}>
                  <View style={s.chatTop}>
                    <Text style={[s.chatName, { color: colors.ink }]} numberOfLines={1}>{chatTitle(item)}</Text>
                    <Text style={[s.chatTime, { color: colors.textMuted }]}>{formatRelative(item.last_message?.created_at)}</Text>
                  </View>
                  <View style={s.chatBottom}>
                    <Text style={[s.chatLastMsg, { color: colors.textMuted }]} numberOfLines={1}>
                      {item.last_message?.content || t('No messages yet')}
                    </Text>
                    {item.unread_count ? (
                      <View style={s.unreadBadge}>
                        <Text style={s.unreadText}>{item.unread_count}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[s.emptyText, { color: colors.textMuted, textAlign: 'center' }]}>{t('No conversations')}</Text>
            }
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.chatHeader, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => setActiveChat(null)} style={s.backBtn}>
          <ArrowLeft size={20} color={colors.ink} />
        </TouchableOpacity>
        <View style={s.chatHeaderInfo}>
          <Text style={[s.chatHeaderName, { color: colors.ink }]} numberOfLines={1}>{chatTitle(activeChat)}</Text>
        </View>
        {!socketConnected && (
          <Text style={[s.offlineText, { color: colors.danger }]}>{t('Offline')}</Text>
        )}
      </View>

      {loadingMsgs ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m._id}
          renderItem={({ item }) => {
            const isMe = isMyMessage(item);
            return (
              <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowOther]}>
                <View style={[s.msgBubble, { backgroundColor: isMe ? colors.primary : colors.surface }]}>
                  {item.attachment && (
                    <Text style={[s.attachmentText, { color: colors.textMuted }]}>📎 {typeof item.attachment === 'string' ? 'Attachment' : item.attachment.name || 'File'}</Text>
                  )}
                  <Text style={[s.msgText, { color: isMe ? '#FFF' : colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
                    {item.content || ''}
                  </Text>
                  <View style={s.msgMeta}>
                    <Text style={[s.msgTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                      {formatTime(item.created_at)}
                    </Text>
                    {isMe && item.read_by && item.read_by.length > 1 && (
                      <CheckCheck size={12} color={isMe ? 'rgba(255,255,255,0.7)' : colors.textMuted} />
                    )}
                    {item.is_edited && (
                      <Text style={[s.editedText, { color: isMe ? 'rgba(255,255,255,0.5)' : colors.textMuted }]}>
                        {t('edited')}
                      </Text>
                    )}
                  </View>
                </View>
              </View>
            );
          }}
          contentContainerStyle={s.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <Text style={[s.emptyText, { color: colors.textMuted, textAlign: 'center', paddingTop: 40 }]}>
              {t('No messages yet. Start the conversation!')}
            </Text>
          }
        />
      )}

      <View style={[s.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[s.textInput, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('Type a message...')}
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: colors.primary }, (!input.trim() || sending) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!input.trim() || sending}
        >
          {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  attachmentText: { fontSize: font.sizes.xs, marginBottom: spacing.xs },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#FFF', fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1 },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  chatInfo: { flex: 1, gap: spacing.xs },
  chatItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  chatLastMsg: { fontSize: font.sizes.xs, flex: 1 },
  chatName: { fontSize: font.sizes.base, fontWeight: font.weights.semibold, flex: 1 },
  chatTime: { fontSize: font.sizes.xs },
  chatTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  container: { flex: 1 },
  editedText: { fontSize: font.sizes.xs, marginLeft: spacing.xs },
  emptyText: { padding: spacing.xl, fontSize: font.sizes.sm },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1,
  },
  msgBubble: { borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxWidth: '80%' },
  msgList: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  msgMeta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.xs, marginTop: 2 },
  msgRow: { flexDirection: 'row', marginBottom: spacing.xs },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgText: { fontSize: font.sizes.base, lineHeight: 22 },
  msgTime: { fontSize: font.sizes.xs },
  offlineText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759', marginLeft: spacing.sm },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  textInput: {
    flex: 1, borderWidth: 1, borderRadius: radii.xl, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: font.sizes.base, maxHeight: 100,
  },
  unreadBadge: {
    backgroundColor: '#375DFB', borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs,
  },
  unreadText: { color: '#FFF', fontSize: font.sizes.xs, fontWeight: font.weights.bold, paddingHorizontal: 6 },
});
