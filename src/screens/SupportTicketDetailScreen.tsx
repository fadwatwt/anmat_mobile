import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Send } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import {
  fetchTicketDetails,
  fetchTicketMessages,
  addTicketMessage,
  updateSupportTicketStatus,
  SupportTicket,
  TicketMessage,
} from '../services/supportTickets';
import { font, radii, spacing } from '../theme';

const statusVariant: Record<string, 'success' | 'info' | 'warning' | 'danger' | 'default'> = {
  open: 'default',
  pending: 'warning',
  'in-progress': 'info',
  resolved: 'success',
  closed: 'info',
  rejected: 'danger',
};

const statusLabels: Record<string, string> = {
  open: 'Open',
  pending: 'Pending',
  'in-progress': 'In Progress',
  resolved: 'Resolved',
  closed: 'Closed',
  rejected: 'Rejected',
};

const statusOptions = ['open', 'in-progress', 'resolved', 'closed'];

export default function SupportTicketDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const ticketId: string = route.params?.id || route.params?.ticketId;
  const isAdmin = user?.type === 'Admin';
  const scrollRef = useRef<ScrollView>(null);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const load = async () => {
    if (!ticketId) return;
    setLoading(true);
    try {
      const [t, msgs] = await Promise.all([
        fetchTicketDetails(ticketId),
        fetchTicketMessages(ticketId).catch(() => []),
      ]);
      setTicket(t);
      setMessages(msgs);
    } catch {
      Alert.alert(t('Error'), t('Failed to load ticket'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [ticketId]);

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 200);
    }
  }, [messages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !ticketId) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', newMessage.trim());
      await addTicketMessage(ticketId, fd);
      setNewMessage('');
      const msgs = await fetchTicketMessages(ticketId).catch(() => []);
      setMessages(msgs);
    } catch {
      Alert.alert(t('Error'), t('Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status: string) => {
    if (!ticketId) return;
    setUpdatingStatus(true);
    try {
      await updateSupportTicketStatus(ticketId, status);
      setTicket(prev => prev ? { ...prev, status } : null);
    } catch {
      Alert.alert(t('Error'), t('Failed to update status'));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const isClosed = ticket?.status === 'closed' || (!isAdmin && ticket?.status === 'resolved');

  if (loading) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!ticket) {
    return (
      <View style={[s.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.danger }}>{t('Ticket not found')}</Text>
      </View>
    );
  }

  const st = (ticket.status || '').toLowerCase();

  return (
    <KeyboardAvoidingView
      style={[s.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Ticket Info Card */}
      <View style={[s.infoCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[s.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={2}>
          {ticket.title || '--'}
        </Text>
        <View style={[s.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[s.infoLabel, { color: colors.textMuted }]}>{t('Status')}</Text>
          {isAdmin ? (
            <StatusPicker
              current={ticket.status || 'open'}
              options={statusOptions}
              loading={updatingStatus}
              onChange={handleStatusChange}
              colors={colors}
            />
          ) : (
            <Badge label={t(statusLabels[st] || ticket.status || '--')} variant={statusVariant[st] || 'default'} />
          )}
        </View>
        <View style={[s.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[s.infoLabel, { color: colors.textMuted }]}>{t('Priority')}</Text>
          <Text style={[s.infoValue, { color: colors.ink }]}>{t(ticket.priority || 'LOW')}</Text>
        </View>
        {ticket.description ? (
          <Text style={[s.description, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {ticket.description}
          </Text>
        ) : null}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={s.messageList}
        contentContainerStyle={s.messageListContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.length === 0 ? (
          <View style={s.emptyMessages}>
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{t('No messages yet')}</Text>
          </View>
        ) : (
          messages.map((msg, idx) => {
            const senderId = (msg.sender_id?._id || '').toString();
            const isMe = senderId === user?._id?.toString();
            const prevSenderId = idx > 0 ? (messages[idx - 1]?.sender_id?._id || '').toString() : null;
            const showAvatar = idx === 0 || prevSenderId !== senderId;
            return (
              <View key={msg._id || idx} style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowOther]}>
                <View
                  style={[
                    s.msgBubble,
                    isMe
                      ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                      : { backgroundColor: colors.primaryLight, borderBottomLeftRadius: 4 },
                  ]}
                >
                  {!isMe && showAvatar && msg.sender_id?.name ? (
                    <Text style={[s.senderName, { color: colors.ink }]}>{msg.sender_id.name}</Text>
                  ) : null}
                  {msg.message ? (
                    <Text style={[s.msgText, { color: isMe ? '#FFF' : colors.ink }]}>{msg.message}</Text>
                  ) : null}
                  {msg.attachments && msg.attachments.length > 0 ? (
                    <View style={s.attachmentList}>
                      {msg.attachments.map((att) => (
                        <Text key={att._id} style={[s.attachmentLink, { color: isMe ? '#FFF' : colors.primary }]}>
                          {att.name || t('Attachment')}
                        </Text>
                      ))}
                    </View>
                  ) : null}
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      {!isClosed ? (
        <View style={[s.inputRow, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
          <TextInput
            style={[s.input, { color: colors.ink, backgroundColor: colors.background, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={t('Type a message...')}
            placeholderTextColor={colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: colors.primary }, (!newMessage.trim() || sending) && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!newMessage.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Send size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
}

function StatusPicker({
  current,
  options,
  loading,
  onChange,
  colors,
}: {
  current: string;
  options: string[];
  loading: boolean;
  onChange: (v: string) => void;
  colors: any;
}) {
  const { t } = useTranslation();
  return (
    <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
      {options.map((opt) => {
        const isSelected = opt === current;
        return (
          <TouchableOpacity
            key={opt}
            onPress={() => onChange(opt)}
            disabled={loading || isSelected}
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: 8,
              backgroundColor: isSelected ? colors.primary : colors.background,
            }}
          >
            <Text style={{ fontSize: 10, color: isSelected ? '#FFF' : colors.textMuted, fontWeight: isSelected ? '600' : '400' }}>
              {t(statusLabels[opt] || opt)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const s = StyleSheet.create({
  attachmentLink: { fontSize: font.sizes.xs, textDecorationLine: 'underline', marginTop: 2 },
  attachmentList: { marginTop: 4 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  description: { fontSize: font.sizes.sm, marginTop: spacing.sm, lineHeight: 20 },
  emptyMessages: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  infoCard: {
    borderWidth: 1, borderRadius: radii.xxl, padding: spacing.md,
    marginBottom: spacing.sm, gap: spacing.xs,
  },
  infoLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  input: { flex: 1, fontSize: font.sizes.sm, maxHeight: 100, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.xl },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1,
  },
  messageList: { flex: 1 },
  messageListContent: { padding: spacing.md },
  msgBubble: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.xl, maxWidth: '85%',
  },
  msgRow: { marginBottom: spacing.sm, flexDirection: 'row' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgText: { fontSize: font.sizes.sm, lineHeight: 20 },
  root: { flex: 1 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  senderName: { fontSize: 10, fontWeight: font.weights.semibold, marginBottom: 2 },
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginBottom: spacing.xs },
});
