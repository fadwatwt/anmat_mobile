import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import {
  Send,
  ArrowLeft,
  Check,
  CheckCheck,
  BarChart3,
  X,
  CheckCircle2,
  Paperclip,
  Search,
  Info,
  SquarePen,
  FileText,
  Phone,
  Video,
  Image as ImageIcon,
} from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { useCall, useGroupCall } from '../calls/CallContext';
import { font, radii, spacing } from '../theme';
import {
  ChatItem,
  ChatMessage,
  ChatPoll,
  archiveChat,
  editChatMessage,
  deleteChatMessage,
  fetchChats,
  fetchMessages,
  markChatRead,
  votePoll,
  closePoll,
  addReaction,
  removeReaction,
  uploadChatFile,
  searchChatMessages,
} from '../services/conversations';
import { connectSocket, disconnectSocket, getSocket } from '../services/socket';
import { CreatePollModal } from '../modals/CreatePollModal';
import { ChatDetailsModal } from '../modals/ChatDetailsModal';
import { NewConversationModal } from '../modals/NewConversationModal';
import { ThreadModal } from '../modals/ThreadModal';

const EMOJI_LIST = ['👍', '❤️', '😂', '😮', '😢', '👏'];

const avatarUrl = (name?: string, image?: string) =>
  image || `https://ui-avatars.com/api/?background=375DFB&color=fff&name=${encodeURIComponent(name || '?')}`;

const attachmentUrlOf = (m: ChatMessage) =>
  typeof m.attachment === 'string' ? m.attachment : m.attachment?.url || '';

const isImageAttachment = (url: string) =>
  /\.(jpg|jpeg|png|gif|webp|heic)$/i.test(url) || /^data:image\//.test(url) || /^blob:/.test(url);

export default function ConversationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const rowDir = isRTL ? ('row-reverse' as const) : ('row' as const);
  const { user, token, permissions } = useAuth();
  const { initiateCall } = useCall();
  const { initiateGroupCall } = useGroupCall();
  const has = useCallback(
    (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm)),
    [permissions],
  );
  const flatListRef = useRef<FlatList>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const userId = user?._id;

  const [chats, setChats] = useState<ChatItem[]>([]);
  const [activeChat, setActiveChat] = useState<ChatItem | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);
  const [pollVisible, setPollVisible] = useState(false);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [newChatVisible, setNewChatVisible] = useState(false);
  const [threadMessage, setThreadMessage] = useState<ChatMessage | null>(null);
  const [threadVisible, setThreadVisible] = useState(false);
  const [editMessage, setEditMessage] = useState<ChatMessage | null>(null);
  const [typing, setTyping] = useState(false);
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string; size?: number } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [listSearch, setListSearch] = useState('');
  const [searchMode, setSearchMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<ChatMessage[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedPollOptions, setSelectedPollOptions] = useState<Record<string, string[]>>({});

  const loadChats = useCallback(async () => {
    setLoadingChats(true);
    try { setChats(await fetchChats(userId, showArchived)); } catch {}
    finally { setLoadingChats(false); }
  }, [userId, showArchived]);

  useEffect(() => { loadChats(); }, [loadChats]);

  useEffect(() => {
    if (!token) return;
    const s = connectSocket(token);
    s.on('connect', () => setSocketConnected(true));
    s.on('disconnect', () => setSocketConnected(false));
    s.on('new_message', (msg: ChatMessage) => {
      setMessages(prev => {
        const idx = prev.findIndex(m => m._id === msg._id);
        if (idx === -1) return [...prev, msg];
        const next = [...prev];
        next[idx] = msg;
        return next;
      });
      loadChats();
    });
    s.on('message_updated', (msg: ChatMessage) => {
      setMessages(prev => prev.map(m => (m._id === msg._id ? msg : m)));
      loadChats();
    });
    s.on('message_deleted', ({ message_id }: { message_id: string }) => {
      setMessages(prev => prev.filter(m => m._id !== message_id));
    });
    s.on('user_typing', ({ user_id, is_typing }: { user_id: string; is_typing: boolean }) => {
      if (user_id?.toString() !== userId?.toString()) setTyping(is_typing);
    });
    s.on('messages_read', ({ user_id }: { user_id: string }) => {
      setMessages(prev => prev.map(m => {
        if (m.read_by && !m.read_by.includes(user_id)) return { ...m, read_by: [...m.read_by, user_id] };
        return m;
      }));
    });
    return () => {
      s.off('connect');
      s.off('disconnect');
      s.off('new_message');
      s.off('message_updated');
      s.off('message_deleted');
      s.off('user_typing');
      s.off('messages_read');
      disconnectSocket();
    };
  }, [token, userId, loadChats]);

  useEffect(() => {
    if (!activeChat) return;
    setTyping(false);
    setEditMessage(null);
    setSearchMode(false);
    setSearchQuery('');
    setSelectedFile(null);
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

  const emitTyping = (isTyping: boolean) => {
    const s = getSocket();
    if (s?.connected && activeChat) s.emit('typing', { chat_id: activeChat._id, is_typing: isTyping });
  };

  const handleChangeInput = (text: string) => {
    setInput(text);
    if (!activeChat) return;
    if (!typingTimer.current) emitTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => {
      emitTyping(false);
      typingTimer.current = null;
    }, 3000);
  };

  const handleSelectChat = (chat: ChatItem) => setActiveChat(chat);

  const handleArchiveToggle = (chat: ChatItem) => {
    Alert.alert(t('Archive Chat'), t('Are you sure you want to archive this conversation?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Archive'),
        onPress: async () => {
          try {
            await archiveChat(chat._id, !chat.is_archived);
            loadChats();
          } catch {
            Alert.alert(t('Error'), t('Failed to archive chat'));
          }
        },
      },
    ]);
  };

  const handlePickFile = async () => {
    if (!activeChat) return;
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      setSelectedFile({
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType || 'application/octet-stream',
        size: asset.size,
      });
    } catch {}
  };

  const handleSend = async () => {
    if (!activeChat || sending || uploading) return;
    const text = input.trim();
    if (!text && !selectedFile) return;
    setSending(true);
    try {
      let attachmentUrl = '';
      if (selectedFile) {
        const up = await uploadChatFile(activeChat._id, { uri: selectedFile.uri, name: selectedFile.name, type: selectedFile.type });
        attachmentUrl = up.url || '';
      }
      if (editMessage) {
        await editChatMessage(editMessage._id, text);
        setEditMessage(null);
        setInput('');
      } else {
        const s = getSocket();
        setInput('');
        setSelectedFile(null);
        if (s?.connected) {
          s.emit('send_message', { chat_id: activeChat._id, content: text, attachment: attachmentUrl }, (ack: any) => {
            if (ack?.error) Alert.alert(t('Error'), t('Failed to send message'));
          });
        } else {
          Alert.alert(t('Error'), t('Not connected to chat server'));
        }
      }
    } catch (e: any) {
      Alert.alert(t('Error'), e?.message || t('Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (msg: ChatMessage): boolean => {
    if (!userId) return false;
    if (typeof msg.sent_by === 'string') return msg.sent_by === userId;
    return msg.sent_by?._id === userId;
  };

  const senderName = (msg: ChatMessage) =>
    typeof msg.sent_by === 'string' ? t('User') : msg.sent_by?.name || t('User');

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

  const chatTitle = (chat: ChatItem) => {
    if (chat.is_group && chat.title) return chat.title;
    const names = chat.participants?.map(p => p.name).filter(Boolean).join('، ');
    return names || chat.title || t('Chat');
  };

  const startDirectCall = useCallback((chat: ChatItem, isVideo: boolean) => {
    const target = chat.participants?.[0];
    if (!target?._id) return;
    initiateCall(chat._id, target._id, target.name || chatTitle(chat), isVideo);
  }, [initiateCall]);

  const startGroupCall = useCallback((chat: ChatItem, isVideo: boolean) => {
    initiateGroupCall(chat._id, isVideo);
  }, [initiateGroupCall]);

  // ---- Poll helpers ----
  const pollHasVoted = (poll: ChatPoll) =>
    poll.options.some(opt =>
      (opt.votes || []).some(v => (typeof v === 'string' ? v === userId : v?._id === userId)),
    );

  const pollTotalVotes = (poll: ChatPoll) =>
    poll.options.reduce((sum, opt) => sum + (opt.votes?.length || 0), 0);

  const pollIsClosed = (poll: ChatPoll) =>
    poll.is_closed || (poll.closes_at ? new Date(poll.closes_at).getTime() < Date.now() : false);

  const applyPollUpdate = (poll: ChatPoll) =>
    setMessages(prev => prev.map(m => (m.poll?._id === poll._id ? { ...m, poll } : m)));

  const handlePollOptionTap = async (poll: ChatPoll, optionId: string) => {
    if (pollIsClosed(poll) || pollHasVoted(poll)) return;
    if (poll.allow_multiple_choice) {
      setSelectedPollOptions(prev => {
        const cur = prev[poll._id] || [];
        return { ...prev, [poll._id]: cur.includes(optionId) ? cur.filter(id => id !== optionId) : [...cur, optionId] };
      });
      return;
    }
    try { applyPollUpdate(await votePoll(poll._id, [optionId])); } catch { Alert.alert(t('Error'), t('Failed to vote')); }
  };

  const handleSubmitPoll = async (poll: ChatPoll) => {
    const ids = selectedPollOptions[poll._id] || [];
    if (ids.length === 0) return;
    try {
      applyPollUpdate(await votePoll(poll._id, ids));
      setSelectedPollOptions(prev => ({ ...prev, [poll._id]: [] }));
    } catch { Alert.alert(t('Error'), t('Failed to vote')); }
  };

  const handleClosePoll = (poll: ChatPoll) => {
    Alert.alert(t('Close Poll'), t('Are you sure you want to close this poll?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Close Poll'),
        onPress: async () => {
          try { applyPollUpdate(await closePoll(poll._id)); } catch { Alert.alert(t('Error'), t('Failed to close poll')); }
        },
      },
    ]);
  };

  const renderPoll = (poll: ChatPoll) => {
    const voted = pollHasVoted(poll);
    const closed = pollIsClosed(poll);
    const total = pollTotalVotes(poll);
    const selected = selectedPollOptions[poll._id] || [];
    const isCreator = poll.created_by ? (typeof poll.created_by === 'string' ? poll.created_by === userId : poll.created_by._id === userId) : false;
    return (
      <View style={[s.pollCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[s.pollHeader, { flexDirection: rowDir }]}>
          <BarChart3 size={16} color={colors.primary} />
          <Text style={[s.pollQuestion, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{poll.question}</Text>
          {closed && <Text style={[s.pollClosed, { color: colors.danger }]}>{t('Closed')}</Text>}
        </View>
        {poll.options.map((opt) => {
          const optId = opt._id || '';
          const votes = opt.votes?.length || 0;
          const pct = total > 0 ? Math.round((votes / total) * 100) : 0;
          const isSelected = selected.includes(optId);
          const showResults = voted || closed;
          return (
            <TouchableOpacity
              key={optId}
              style={[s.pollOption, { borderColor: isSelected ? colors.primary : colors.border }]}
              onPress={() => handlePollOptionTap(poll, optId)}
              disabled={closed || voted}
            >
              <View style={[s.pollOptRow, { flexDirection: rowDir }]}>
                <Text style={[s.pollOptText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left', flex: 1 }]}>{opt.text}</Text>
                {showResults ? (
                  <Text style={[s.pollPct, { color: colors.textMuted }]}>{pct}%</Text>
                ) : isSelected ? (
                  <CheckCircle2 size={16} color={colors.primary} />
                ) : (
                  <View style={[s.pollRadio, { borderColor: colors.border }]} />
                )}
              </View>
              {showResults && (
                <View style={[s.pollBarTrack, { backgroundColor: colors.statusBg }]}>
                  <View style={[s.pollBarFill, { width: `${pct}%` }]} />
                </View>
              )}
            </TouchableOpacity>
          );
        })}
        <View style={[s.pollFooter, { flexDirection: rowDir }]}>
          <Text style={[s.pollTotal, { color: colors.textMuted }]}>{total} {t('votes')}</Text>
          {poll.allow_multiple_choice && !voted && !closed && (
            <TouchableOpacity
              onPress={() => handleSubmitPoll(poll)}
              style={[s.pollSubmit, { backgroundColor: colors.primary }, (selected.length === 0) && { opacity: 0.5 }]}
              disabled={selected.length === 0}
            >
              <Text style={s.pollSubmitText}>{t('Vote')}</Text>
            </TouchableOpacity>
          )}
          {isCreator && !closed && (
            <TouchableOpacity onPress={() => handleClosePoll(poll)} style={s.pollCloseBtn}>
              <Text style={[s.pollCloseText, { color: colors.danger }]}>{t('Close Poll')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  // ---- Reactions ----
  const groupedReactions = (msg: ChatMessage) => {
    const map = new Map<string, { emoji: string; count: number; mine: boolean }>();
    for (const r of msg.reactions || []) {
      const uid = typeof r.user === 'string' ? r.user : r.user?._id;
      const entry = map.get(r.emoji) || { emoji: r.emoji, count: 0, mine: false };
      entry.count += 1;
      if (uid === userId) entry.mine = true;
      map.set(r.emoji, entry);
    }
    return Array.from(map.values());
  };

  const toggleReaction = async (msg: ChatMessage, emoji: string) => {
    const mine = (msg.reactions || []).some(r =>
      r.emoji === emoji && userId && (typeof r.user === 'string' ? r.user === userId : r.user?._id === userId),
    );
    try {
      const updated = mine ? await removeReaction(msg._id, emoji) : await addReaction(msg._id, emoji);
      setMessages(prev => prev.map(m => (m._id === updated._id ? updated : m)));
    } catch { Alert.alert(t('Error'), t('Failed to update reaction')); }
  };

  const handleReactAlert = (msg: ChatMessage) => {
    Alert.alert(t('React'), undefined, [
      ...EMOJI_LIST.map((emoji) => ({ text: emoji, onPress: () => toggleReaction(msg, emoji) })),
      { text: t('Cancel'), style: 'cancel' },
    ]);
  };

  const confirmDelete = (msg: ChatMessage) => {
    Alert.alert(t('Delete Message'), t('Are you sure you want to delete this message?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteChatMessage(msg._id);
            setMessages(prev => prev.filter(m => m._id !== msg._id));
          } catch { Alert.alert(t('Error'), t('Failed to delete message')); }
        },
      },
    ]);
  };

  const handleMessageLongPress = (msg: ChatMessage) => {
    const isMe = isMyMessage(msg);
    const options: { text: string; style?: 'destructive'; onPress: () => void }[] = [
      { text: t('React'), onPress: () => handleReactAlert(msg) },
      { text: t('Reply'), onPress: () => { setThreadMessage(msg); setThreadVisible(true); } },
    ];
    if (isMe) {
      options.push({ text: t('Edit'), onPress: () => { setEditMessage(msg); setInput(msg.content || ''); } });
      options.push({ text: t('Delete'), style: 'destructive', onPress: () => confirmDelete(msg) });
    }
    options.push({ text: t('Cancel'), style: undefined, onPress: () => {} });
    Alert.alert(t('Message actions'), undefined, options);
  };

  const openAttachment = (msg: ChatMessage) => {
    const url = attachmentUrlOf(msg);
    if (url) Linking.openURL(url).catch(() => {});
  };

  const renderAttachment = (msg: ChatMessage, isMe: boolean) => {
    const url = attachmentUrlOf(msg);
    if (!url) return null;
    if (isImageAttachment(url)) {
      return (
        <TouchableOpacity onPress={() => openAttachment(msg)} style={s.attImageWrap}>
          <Image source={{ uri: url }} style={s.attImage} resizeMode="cover" />
        </TouchableOpacity>
      );
    }
    const name = typeof msg.attachment === 'object' ? msg.attachment?.name : url.split('/').pop();
    return (
      <TouchableOpacity
        onPress={() => openAttachment(msg)}
        style={[s.attFile, { backgroundColor: isMe ? 'rgba(255,255,255,0.15)' : colors.statusBg, borderColor: colors.border }]}
      >
        <FileText size={16} color={isMe ? '#FFF' : colors.primary} />
        <Text style={[s.attFileName, { color: isMe ? '#FFF' : colors.ink }]} numberOfLines={1}>{name || t('Attachment')}</Text>
      </TouchableOpacity>
    );
  };

  const renderReactions = (msg: ChatMessage, isMe: boolean) => {
    const groups = groupedReactions(msg);
    if (groups.length === 0) return null;
    return (
      <View style={[s.reactionsRow, { flexDirection: rowDir }]}>
        {groups.map((g) => (
          <TouchableOpacity
            key={g.emoji}
            style={[s.reactionChip, { backgroundColor: colors.surface, borderColor: g.mine ? colors.primary : colors.border }]}
            onPress={() => toggleReaction(msg, g.emoji)}
          >
            <Text style={s.reactionEmoji}>{g.emoji}</Text>
            <Text style={[s.reactionCount, { color: colors.textMuted }]}>{g.count}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  // ---- Search ----
  useEffect(() => {
    if (!searchMode || !activeChat) return;
    setSearching(true);
    const timer = setTimeout(async () => {
      if (searchQuery.trim()) {
        try { setSearchResults(await searchChatMessages(activeChat._id, searchQuery.trim())); }
        catch { setSearchResults([]); }
      } else {
        setSearchResults([]);
      }
      setSearching(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery, searchMode, activeChat]);

  // ---- List view ----
  const filteredChats = chats.filter((c) => {
    const q = listSearch.trim().toLowerCase();
    if (!q) return true;
    return chatTitle(c).toLowerCase().includes(q);
  });

  if (!activeChat) {
    return (
      <View style={[s.container, { backgroundColor: colors.background }]}>
        <View style={[s.header, { borderBottomColor: colors.border, flexDirection: rowDir }]}>
          <Text style={[s.headerTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Conversations')}</Text>
          <View style={{ flexDirection: rowDir, alignItems: 'center', gap: spacing.sm }}>
            {socketConnected && <View style={s.onlineDot} />}
            <TouchableOpacity style={s.iconBtn} onPress={() => setNewChatVisible(true)}>
              <SquarePen size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[s.listSearchBar, { flexDirection: rowDir }]}>
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[s.listSearchInput, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('Search conversations...')}
            placeholderTextColor={colors.textMuted}
            value={listSearch}
            onChangeText={setListSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[s.segmentContent, { flexDirection: rowDir }]}
          style={[s.segment, { backgroundColor: colors.statusBg }]}
        >
          {([
            { key: false, label: t('Active') },
            { key: true, label: t('Archived') },
          ] as const).map((seg) => (
            <TouchableOpacity
              key={String(seg.key)}
              style={[s.segmentBtn, showArchived === seg.key && { backgroundColor: colors.surface, borderColor: colors.primary }]}
              onPress={() => setShowArchived(seg.key)}
            >
              <Text numberOfLines={1} style={[s.segmentText, { color: showArchived === seg.key ? colors.primary : colors.textMuted }]}>{seg.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loadingChats ? (
          <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            data={filteredChats}
            keyExtractor={c => c._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.chatItem, { borderBottomColor: colors.border, flexDirection: rowDir }]}
                onPress={() => handleSelectChat(item)}
                onLongPress={() => handleArchiveToggle(item)}
              >
                <Image source={{ uri: avatarUrl(chatTitle(item), item.image) }} style={[s.avatar, { borderColor: colors.border }]} />
                <View style={s.chatInfo}>
                  <View style={[s.chatTop, { flexDirection: rowDir }]}>
                    <Text style={[s.chatName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{chatTitle(item)}</Text>
                    <Text style={[s.chatTime, { color: colors.textMuted }]}>{formatRelative(item.last_message?.created_at)}</Text>
                  </View>
                  <View style={[s.chatBottom, { flexDirection: rowDir }]}>
                    <Text style={[s.chatLastMsg, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                      {item.last_message?.content || t('No messages yet')}
                    </Text>
                    {item.unread_count ? (
                      <View style={s.unreadBadge}><Text style={s.unreadText}>{item.unread_count}</Text></View>
                    ) : null}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[s.emptyText, { color: colors.textMuted, textAlign: 'center' }]}>
                {showArchived ? t('No archived conversations') : t('No conversations')}
              </Text>
            }
          />
        )}
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Chat header */}
      <View style={[s.chatHeader, { borderBottomColor: colors.border, flexDirection: rowDir }]}>
        {searchMode ? (
          <>
            <Search size={16} color={colors.textMuted} />
            <TextInput
              style={[s.searchInput, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}
              placeholder={t('Search in conversation...')}
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => { setSearchMode(false); setSearchQuery(''); }} style={s.iconBtn}>
              <X size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => setActiveChat(null)} style={s.backBtn}>
              <ArrowLeft size={20} color={colors.ink} style={{ transform: [{ scaleX: isRTL ? -1 : 1 }] }} />
            </TouchableOpacity>
            <Image source={{ uri: avatarUrl(chatTitle(activeChat), activeChat.image) }} style={[s.chatAvatar, { borderColor: colors.border }]} />
            <View style={s.chatHeaderInfo}>
              <Text style={[s.chatHeaderName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{chatTitle(activeChat)}</Text>
              {typing ? (
                <Text style={[s.typingText, { color: colors.primary }]}>{t('typing...')}</Text>
              ) : !socketConnected ? (
                <Text style={[s.offlineText, { color: colors.danger }]}>{t('Offline')}</Text>
              ) : null}
            </View>
            <View style={{ flexDirection: rowDir, alignItems: 'center', gap: spacing.xs }}>
              {has('chats.call') && activeChat?.is_group ? (
                <>
                  <TouchableOpacity style={s.iconBtn} onPress={() => startGroupCall(activeChat, false)}>
                    <Phone size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} onPress={() => startGroupCall(activeChat, true)}>
                    <Video size={18} color={colors.primary} />
                  </TouchableOpacity>
                </>
              ) : has('chats.call') && activeChat ? (
                <>
                  <TouchableOpacity style={s.iconBtn} onPress={() => startDirectCall(activeChat, false)}>
                    <Phone size={18} color={colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity style={s.iconBtn} onPress={() => startDirectCall(activeChat, true)}>
                    <Video size={18} color={colors.primary} />
                  </TouchableOpacity>
                </>
              ) : null}
              <TouchableOpacity style={s.iconBtn} onPress={() => setSearchMode(true)}>
                <Search size={18} color={colors.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity style={s.iconBtn} onPress={() => setDetailsVisible(true)}>
                <Info size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>

      {loadingMsgs ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
      ) : searchMode ? (
        <View style={s.searchResultsWrap}>
          <Text style={[s.searchResultsTitle, { color: colors.textMuted }]}>{t('Search Results')}</Text>
          {searching ? (
            <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
          ) : (
            <FlatList
              data={searchResults}
              keyExtractor={(m) => m._id}
              renderItem={({ item }) => (
                <View style={[s.searchResultItem, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <Text style={[s.searchResultName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{senderName(item)}</Text>
                  <Text style={[s.searchResultContent, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>{item.content}</Text>
                </View>
              )}
              ListEmptyComponent={
                <Text style={[s.emptyText, { color: colors.textMuted, textAlign: 'center' }]}>
                  {searchQuery.trim() ? t('No messages found') : t('Type to search messages')}
                </Text>
              }
            />
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={m => m._id}
          renderItem={({ item }) => {
            const isMe = isMyMessage(item);
            if (item.message_type === 'call_log') {
              return (
                <View style={s.center}>
                  <View style={[s.callChip, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                    <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs }}>{item.content}</Text>
                  </View>
                </View>
              );
            }
            if (item.poll) {
              return (
                <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowOther]}>
                  {renderPoll(item.poll)}
                </View>
              );
            }
            return (
              <View style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowOther]}>
                <TouchableOpacity
                  style={[s.msgBubble, { backgroundColor: isMe ? colors.primary : colors.surface }]}
                  onLongPress={() => handleMessageLongPress(item)}
                  delayLongPress={350}
                  activeOpacity={0.8}
                >
                  {!isMe && (
                    <Text style={[s.msgSender, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{senderName(item)}</Text>
                  )}
                  {renderAttachment(item, isMe)}
                  {!!item.content && (
                    <Text style={[s.msgText, { color: isMe ? '#FFF' : colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
                      {item.content}
                    </Text>
                  )}
                  {item.is_edited && (
                    <Text style={[s.editedText, { color: isMe ? 'rgba(255,255,255,0.6)' : colors.textMuted }]}>{t('(edited)')}</Text>
                  )}
                  <View style={[s.msgMeta, { flexDirection: rowDir }]}>
                    <Text style={[s.msgTime, { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textMuted }]}>
                      {formatTime(item.created_at)}
                    </Text>
                    {isMe && (
                      item.read_by && item.read_by.length > 1
                        ? <CheckCheck size={12} color={isMe ? 'rgba(255,255,255,0.7)' : colors.textMuted} />
                        : <Check size={12} color={isMe ? 'rgba(255,255,255,0.7)' : colors.textMuted} />
                    )}
                  </View>
                  {!!item.thread_count && item.thread_count > 0 && (
                    <TouchableOpacity onPress={() => { setThreadMessage(item); setThreadVisible(true); }} style={s.threadBtn}>
                      <Text style={[s.threadBtnText, { color: isMe ? '#FFF' : colors.primary }]}>
                        {item.thread_count} {t('Replies')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </TouchableOpacity>
                {renderReactions(item, isMe)}
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

      {/* Composer */}
      <View style={[s.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, flexDirection: rowDir }]}>
        {editMessage ? (
          <View style={[s.editBar, { borderColor: colors.primary, flexDirection: rowDir }]}>
            <Text style={[s.editHint, { color: colors.primary }]}>{t('Editing message')}</Text>
            <TouchableOpacity onPress={() => { setEditMessage(null); setInput(''); }}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={{ flexDirection: rowDir, gap: spacing.sm, alignItems: 'flex-end' }}>
            <TouchableOpacity style={[s.pollBtn, { borderColor: colors.border }]} onPress={() => setPollVisible(true)}>
              <BarChart3 size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity style={[s.pollBtn, { borderColor: colors.border }, selectedFile && { borderColor: colors.primary }]} onPress={handlePickFile}>
              <Paperclip size={18} color={selectedFile ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          </View>
        )}
        {selectedFile && !editMessage && (
          <View style={[s.fileChip, { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: rowDir }]}>
            <FileText size={14} color={colors.primary} />
            <Text style={[s.fileChipName, { color: colors.ink }]} numberOfLines={1}>{selectedFile.name}</Text>
            <TouchableOpacity onPress={() => setSelectedFile(null)}>
              <X size={14} color={colors.danger} />
            </TouchableOpacity>
          </View>
        )}
        <TextInput
          style={[s.textInput, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={editMessage ? t('Edit your message...') : t('Type a message...')}
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={handleChangeInput}
          multiline
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: colors.primary }, (!input.trim() && !selectedFile) || sending || uploading ? { opacity: 0.5 } : null]}
          onPress={handleSend}
          disabled={(!input.trim() && !selectedFile) || sending || uploading}
        >
          {(sending || uploading) ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>

      <CreatePollModal
        visible={pollVisible}
        chatId={activeChat._id}
        onClose={() => setPollVisible(false)}
        onCreated={() => {
          setMessages([]);
          (async () => {
            try {
              const msgs = await fetchMessages(activeChat._id);
              setMessages(msgs);
            } catch {}
          })();
        }}
      />
      <ChatDetailsModal
        visible={detailsVisible}
        chat={activeChat}
        onClose={() => setDetailsVisible(false)}
        onChanged={loadChats}
      />
      <NewConversationModal
        visible={newChatVisible}
        onClose={() => setNewChatVisible(false)}
        onCreated={(chatId) => {
          loadChats().then(() => {
            const chat = chats.find((c) => c._id === chatId);
            if (chat) setActiveChat(chat);
          });
        }}
      />
      <ThreadModal
        visible={threadVisible}
        message={threadMessage}
        onClose={() => { setThreadVisible(false); setThreadMessage(null); }}
      />
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  attFile: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.xs, padding: spacing.sm },
  attFileName: { flex: 1, fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  attImage: { borderRadius: radii.lg, height: 160, width: 220 },
  attImageWrap: { borderRadius: radii.lg, marginBottom: spacing.xs, overflow: 'hidden' },
  avatar: { width: 44, height: 44, borderRadius: 22, borderWidth: 1 },
  avatarText: { color: '#FFF', fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  backBtn: { padding: spacing.xs, marginRight: spacing.sm },
  callChip: { borderRadius: radii.full, borderWidth: 1, marginVertical: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  chatAvatar: { borderRadius: radii.full, height: 34, width: 34, borderWidth: 1 },
  chatBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  chatHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, gap: spacing.sm },
  chatHeaderInfo: { flex: 1 },
  chatHeaderName: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  chatInfo: { flex: 1, gap: spacing.xs },
  chatItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  chatLastMsg: { fontSize: font.sizes.xs, flex: 1 },
  chatName: { fontSize: font.sizes.base, fontWeight: font.weights.semibold, flex: 1 },
  chatTime: { fontSize: font.sizes.xs },
  chatTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  container: { flex: 1 },
  editBar: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  editHint: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  editedText: { fontSize: font.sizes.xs, marginTop: 2 },
  emptyText: { padding: spacing.xl, fontSize: font.sizes.sm },
  fileChip: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.xs, maxWidth: 160, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  fileChipName: { flex: 1, fontSize: font.sizes.xs },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  headerTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold, flex: 1 },
  iconBtn: { padding: spacing.xs },
  inputBar: {
    alignItems: 'flex-end', flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1,
  },
  listSearchBar: { alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.04)', borderRadius: radii.xl, flexDirection: 'row', gap: spacing.sm, marginHorizontal: spacing.md, marginTop: spacing.md, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  listSearchInput: { flex: 1, fontSize: font.sizes.sm, paddingVertical: spacing.xs },
  msgBubble: { borderRadius: radii.xl, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, maxWidth: '80%' },
  msgList: { padding: spacing.md, paddingBottom: spacing.lg, gap: spacing.sm },
  msgMeta: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'flex-end', marginTop: 2 },
  msgRow: { flexDirection: 'row', marginBottom: spacing.xs },
  msgRowMe: { justifyContent: 'flex-end', flexDirection: 'row' },
  msgRowOther: { justifyContent: 'flex-start', flexDirection: 'row' },
  msgSender: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, marginBottom: 2 },
  msgText: { fontSize: font.sizes.base, lineHeight: 22 },
  msgTime: { fontSize: font.sizes.xs },
  offlineText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34C759' },
  pollBarFill: { backgroundColor: '#375DFB', borderRadius: radii.full, height: '100%' },
  pollBarTrack: { borderRadius: radii.full, height: 6, marginTop: spacing.sm, overflow: 'hidden' },
  pollBtn: { borderWidth: 1, borderRadius: radii.xl, width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pollCard: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.md, maxWidth: '85%', gap: spacing.sm },
  pollClosed: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  pollCloseBtn: { padding: spacing.xs },
  pollCloseText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  pollFooter: { alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.xs },
  pollHeader: { alignItems: 'center', gap: spacing.sm },
  pollOptRow: { alignItems: 'center', gap: spacing.sm },
  pollOptText: { fontSize: font.sizes.sm },
  pollOption: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  pollPct: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  pollQuestion: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  pollRadio: { borderRadius: radii.full, borderWidth: 1, height: 16, width: 16 },
  pollSubmit: { borderRadius: radii.full, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  pollSubmitText: { color: '#FFF', fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  pollTotal: { fontSize: font.sizes.xs },
  reactionChip: { alignItems: 'center', borderRadius: radii.full, borderWidth: 1, flexDirection: 'row', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: 3 },
  reactionCount: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  reactionEmoji: { fontSize: font.sizes.sm },
  reactionsRow: { gap: spacing.xs, marginTop: 4 },
  searchInput: { flex: 1, fontSize: font.sizes.sm, paddingVertical: spacing.xs },
  searchResultContent: { fontSize: font.sizes.xs, marginTop: 2 },
  searchResultItem: { borderRadius: radii.lg, borderWidth: 1, marginBottom: spacing.sm, padding: spacing.md },
  searchResultName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  searchResultsTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, marginBottom: spacing.sm },
  searchResultsWrap: { flex: 1, padding: spacing.md },
  segment: { borderRadius: radii.xl, margin: spacing.md, marginBottom: 0, padding: spacing.xs },
  segmentBtn: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, borderColor: 'transparent', paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
  segmentContent: { gap: spacing.xs },
  segmentText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  textInput: {
    flex: 1, borderWidth: 1, borderRadius: radii.xl, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: font.sizes.base, maxHeight: 100,
  },
  threadBtn: { marginTop: spacing.xs },
  threadBtnText: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  typingText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, fontStyle: 'italic' },
  unreadBadge: {
    backgroundColor: '#375DFB', borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', marginLeft: spacing.xs,
  },
  unreadText: { color: '#FFF', fontSize: font.sizes.xs, fontWeight: font.weights.bold, paddingHorizontal: 6 },
});
