import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send, Plus, MessageSquare, Trash2, Edit3, ChevronLeft, ShoppingCart } from 'lucide-react-native';
import { MarkdownText } from '../components/MarkdownText';
import { useTranslation } from 'react-i18next';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';
import {
  AIMessage,
  AIConversation,
  fetchTokenBalance,
  listConversations,
  getConversationMessages,
  sendMessage,
  renameConversation,
  deleteConversation,
  TokenBalance,
} from '../services/ai';

export default function AIScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const flatListRef = useRef<FlatList>(null);
  const skipNextFetch = useRef(false);

  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [conversations, setConversations] = useState<AIConversation[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [tokenBalance, setTokenBalance] = useState<TokenBalance | null>(null);
  const [showSidebar, setShowSidebar] = useState(false);

  const loadConversations = useCallback(async () => {
    try {
      const [convs, tokens] = await Promise.all([listConversations(), fetchTokenBalance()]);
      setConversations(convs);
      setTokenBalance(tokens);
    } catch {}
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Re-fetch token balance every time screen comes into focus (e.g. after purchasing tokens)
  useFocusEffect(useCallback(() => {
    fetchTokenBalance().then(setTokenBalance).catch(() => {});
  }, []));

  useEffect(() => {
    if (!currentId) return;
    if (skipNextFetch.current) { skipNextFetch.current = false; return; }
    (async () => {
      setLoading(true);
      try {
        const msgs = await getConversationMessages(currentId);
        setMessages(msgs);
      } catch { setMessages([]); }
      finally { setLoading(false); }
    })();
  }, [currentId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    const userMsg: AIMessage = { role: 'user', content: input.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    try {
      const res = await sendMessage({ message: userMsg.content!, conversation_id: currentId || undefined });
      if (res.message) setMessages(prev => [...prev, res.message]);
      if (res.conversation_id && res.conversation_id !== currentId) {
        skipNextFetch.current = true;
        setCurrentId(res.conversation_id);
        loadConversations();
      }
    } catch {
      Alert.alert(t('Error'), t('Failed to send message'));
    }
    finally { setSending(false); }
  };

  const handleNew = () => {
    setCurrentId(null);
    setMessages([]);
    setShowSidebar(false);
  };

  const handleSelect = (id: string) => {
    setCurrentId(id);
    setShowSidebar(false);
  };

  const handleRename = (id: string) => {
    Alert.prompt?.(t('Rename'), t('Enter new name'), async (val) => {
      if (val) { await renameConversation(id, val); loadConversations(); }
    });
  };

  const handleDelete = (id: string) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      { text: t('Delete'), style: 'destructive', onPress: async () => {
        await deleteConversation(id);
        if (currentId === id) { setCurrentId(null); setMessages([]); }
        loadConversations();
      }},
    ]);
  };

  const freeRemaining = tokenBalance ? Math.max(0, (tokenBalance.free_limit || 0) - (tokenBalance.free_consumed || 0)) : 0;
  const paidBalance = tokenBalance?.balance || 0;
  const isGated = !tokenBalance?.is_unlimited && freeRemaining <= 0 && paidBalance <= 0;

  const renderMessage = ({ item }: { item: AIMessage }) => {
    if (!item) return null;
    const isUser = item.role === 'user';
    const textColor = isUser ? '#FFF' : colors.ink;
    const codeBg = isUser ? 'rgba(255,255,255,0.15)' : colors.background;
    return (
      <View style={[s.msgRow, isUser ? s.msgRowUser : s.msgRowAssistant]}>
        <View style={[s.msgBubble, { backgroundColor: isUser ? colors.primary : colors.surface, borderColor: colors.border }]}>
          {item.thought ? (
            <Text style={[s.thoughtText, { color: isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
              {item.thought}
            </Text>
          ) : null}
          <MarkdownText color={textColor} bgColor={codeBg} isRTL={isRTL}>
            {item.content || ''}
          </MarkdownText>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView style={[s.container, { backgroundColor: colors.background }]} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Sidebar */}
      <Modal visible={showSidebar} transparent animationType="slide" onRequestClose={() => setShowSidebar(false)}>
        <View style={[s.sidebar, { backgroundColor: colors.surface }]}>
          <View style={s.sidebarHeader}>
            <Text style={[s.sidebarTitle, { color: colors.ink }]}>{t('Conversations')}</Text>
            <TouchableOpacity onPress={() => setShowSidebar(false)}>
              <ChevronLeft size={20} color={colors.ink} />
            </TouchableOpacity>
          </View>
          <FlatList
            data={conversations}
            keyExtractor={c => c._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[s.convItem, currentId === item._id && { backgroundColor: colors.primaryLight }]}
                onPress={() => handleSelect(item._id)}
              >
                <MessageSquare size={16} color={colors.textMuted} />
                <Text style={[s.convTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                  {item.title || t('New conversation')}
                </Text>
                <View style={s.convActions}>
                  <TouchableOpacity onPress={() => handleRename(item._id)}>
                    <Edit3 size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(item._id)}>
                    <Trash2 size={14} color={colors.danger} />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <Text style={[s.emptyText, { color: colors.textMuted, textAlign: 'center' }]}>{t('No conversations')}</Text>
            }
          />
        </View>
      </Modal>

      {/* Main Chat */}
      <View style={s.chatHeader}>
        <TouchableOpacity onPress={() => setShowSidebar(true)} style={s.sidebarBtn}>
          <MessageSquare size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[s.chatTitle, { color: colors.ink }]}>{t('AI Assistant')}</Text>
        <TouchableOpacity onPress={handleNew} style={s.sidebarBtn}>
          <Plus size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      {/* Token bar */}
      {tokenBalance && (
        <View style={[s.tokenBar, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <Text style={[s.tokenText, { color: colors.textMuted }]}>
            {t('Free')}: {freeRemaining} | {t('Paid')}: {paidBalance}
          </Text>
          {isGated && (
            <TouchableOpacity
              style={s.gatedBtn}
              onPress={() => navigation.navigate('TokenPricing')}
              activeOpacity={0.8}
            >
              <ShoppingCart size={13} color="#FFF" />
              <Text style={s.gatedBtnText}>{t('Out of tokens — Buy more')}</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Messages */}
      {loading ? (
        <View style={s.center}><ActivityIndicator color={colors.primary} /></View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(_, i) => String(i)}
          renderItem={renderMessage}
          contentContainerStyle={s.msgList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={s.center}>
              <Text style={[s.emptyTitle, { color: colors.textMuted, textAlign: 'center' }]}>
                {t('How can I help you today?')}
              </Text>
            </View>
          }
        />
      )}

      {/* Gated banner */}
      {isGated && (
        <TouchableOpacity
          style={[s.gatedBanner, { backgroundColor: '#FEF2F2', borderTopColor: '#FECACA' }]}
          onPress={() => navigation.navigate('TokenPricing')}
          activeOpacity={0.85}
        >
          <ShoppingCart size={16} color="#EF4444" />
          <Text style={s.gatedBannerText}>{t("You've run out of tokens. Tap to buy more.")}</Text>
        </TouchableOpacity>
      )}

      {/* Input */}
      <View style={[s.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        <TextInput
          style={[s.textInput, { backgroundColor: colors.background, color: colors.ink, borderColor: colors.border, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('Type a message...')}
          placeholderTextColor={colors.textMuted}
          value={input}
          onChangeText={setInput}
          multiline
          editable={!isGated}
        />
        <TouchableOpacity
          style={[s.sendBtn, { backgroundColor: colors.primary }, (!input.trim() || sending || isGated) && { opacity: 0.5 }]}
          onPress={handleSend}
          disabled={!input.trim() || sending || isGated}
        >
          {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={18} color="#FFF" />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing.xl },
  chatHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderBottomWidth: 1, borderBottomColor: '#F0F1F3',
  },
  chatTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  container: { flex: 1 },
  convActions: { flexDirection: 'row', gap: spacing.xs },
  convItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md, borderRadius: radii.lg },
  convTitle: { flex: 1, fontSize: font.sizes.sm },
  emptyText: { padding: spacing.xl, fontSize: font.sizes.sm },
  emptyTitle: { fontSize: font.sizes.base },
  gatedBanner: {
    alignItems: 'center',
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  gatedBannerText: { color: '#EF4444', flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  gatedBtn: {
    alignItems: 'center',
    backgroundColor: '#EF4444',
    borderRadius: radii.full,
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  gatedBtnText: { color: '#FFF', fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  inputBar: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1,
  },
  msgBubble: { borderRadius: radii.xl, borderWidth: 1, padding: spacing.md, maxWidth: '85%' },
  msgList: { padding: spacing.md, gap: spacing.sm },
  msgRow: { flexDirection: 'row', marginBottom: spacing.xs },
  msgRowAssistant: { justifyContent: 'flex-start' },
  msgRowUser: { justifyContent: 'flex-end' },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  sidebar: { flex: 1, paddingTop: Platform.OS === 'ios' ? 50 : 0 },
  sidebarBtn: { padding: spacing.sm },
  sidebarHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: '#F0F1F3',
  },
  sidebarTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  textInput: {
    flex: 1, borderWidth: 1, borderRadius: radii.xl, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, fontSize: font.sizes.base, maxHeight: 120,
  },
  thoughtText: { fontSize: font.sizes.xs, fontStyle: 'italic', marginBottom: spacing.xs },
  tokenBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderBottomWidth: 1,
  },
  tokenText: { fontSize: font.sizes.xs },
});
