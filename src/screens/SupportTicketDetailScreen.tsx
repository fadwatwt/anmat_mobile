import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { Send, Paperclip, X, Trash2, FileText, Image as ImageIcon } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useRoute, useNavigation } from '@react-navigation/native';
import * as DocumentPicker from 'expo-document-picker';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { Badge } from '../components/Badge';
import {
  fetchTicketDetails,
  fetchTicketMessages,
  addTicketMessage,
  updateSupportTicketStatus,
  deleteSupportTicket,
  SupportTicket,
  TicketMessage,
} from '../services/supportTickets';
import { extractErrorMessage } from '../lib/http';
import { API_URL } from '../config/api';
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

const getAttachmentUrl = (url?: string) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_URL}${url.startsWith('/') ? '' : '/'}${url}`;
};

const formatDate = (dateStr?: string, locale?: string) => {
  const d = dateStr ? new Date(dateStr) : null;
  if (!d || isNaN(d.getTime())) return '--';
  return d.toLocaleDateString(locale === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'short', year: 'numeric' });
};

const formatTime = (dateStr?: string) => {
  const d = dateStr ? new Date(dateStr) : null;
  if (!d || isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

type PickedFile = { uri: string; name: string; mimeType?: string; size?: number };

export default function SupportTicketDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale, isRTL } = useLocale();
  const { user, permissions } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const ticketId: string = route.params?.id || route.params?.ticketId;
  const isAdmin = user?.type === 'Admin';
  const has = (perm: string) => Array.isArray(permissions) && (permissions.includes('*') || permissions.includes(perm));
  const canDelete = has(isAdmin ? 'admin.support_tickets.delete' : 'support_tickets.delete');
  const scrollRef = useRef<ScrollView>(null);

  const [ticket, setTicket] = useState<SupportTicket | null>(null);
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<PickedFile[]>([]);
  const [deleting, setDeleting] = useState(false);

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
    if ((!newMessage.trim() && selectedFiles.length === 0) || !ticketId) return;
    setSending(true);
    try {
      const fd = new FormData();
      fd.append('message', newMessage.trim());
      selectedFiles.forEach((file) => {
        fd.append('attachments', {
          uri: file.uri,
          name: file.name,
          type: file.mimeType || 'application/octet-stream',
        } as any);
      });
      await addTicketMessage(ticketId, fd);
      setNewMessage('');
      setSelectedFiles([]);
      const msgs = await fetchTicketMessages(ticketId).catch(() => []);
      setMessages(msgs);
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to send message'));
    } finally {
      setSending(false);
    }
  };

  const handlePickFiles = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: true,
      });
      if (result.canceled || !result.assets.length) return;
      const picked: PickedFile[] = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name || t('Attachment'),
        mimeType: asset.mimeType || undefined,
        size: asset.size,
      }));
      setSelectedFiles((prev) => [...prev, ...picked]);
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to attach file'));
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDelete = () => {
    if (!ticketId) return;
    Alert.alert(t('Delete Ticket'), t('Are you sure you want to delete this ticket? This action cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Yes, Delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteSupportTicket(ticketId);
            navigation.goBack();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to delete'));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
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
        <View style={[s.infoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text style={[s.infoLabel, { color: colors.textMuted }]}>{t('Created At')}</Text>
          <Text style={[s.infoValue, { color: colors.ink }]}>{formatDate(ticket.created_at || ticket.createdAt, locale)}</Text>
        </View>
        {ticket.description ? (
          <Text style={[s.description, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            {ticket.description}
          </Text>
        ) : null}
        {canDelete && (
          <TouchableOpacity
            style={[s.deleteBtn, { borderColor: colors.danger, opacity: deleting ? 0.6 : 1 }]}
            onPress={handleDelete}
            disabled={deleting}
          >
            {deleting ? (
              <ActivityIndicator color={colors.danger} size="small" />
            ) : (
              <>
                <Trash2 size={14} color={colors.danger} />
                <Text style={{ color: colors.danger, fontSize: font.sizes.sm, fontWeight: font.weights.medium }}>
                  {t('Delete Ticket')}
                </Text>
              </>
            )}
          </TouchableOpacity>
        )}
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
            <Text style={{ color: colors.textMuted, textAlign: 'center' }}>{t('No messages yet. Start the conversation!')}</Text>
          </View>
        ) : (
          messages.map((msg, idx) => {
            const senderId = (msg.sender_id?._id || msg.sender_id || '').toString();
            const isMe = senderId === user?._id?.toString();
            const prevSenderId = idx > 0 ? (messages[idx - 1]?.sender_id?._id || messages[idx - 1]?.sender_id || '').toString() : null;
            const showAvatar = idx === 0 || prevSenderId !== senderId;
            const senderName = msg.sender_id?.name || msg.sender?.name;
            return (
              <View key={msg._id || idx} style={[s.msgRow, isMe ? s.msgRowMe : s.msgRowOther]}>
                {!isMe && (
                  <View style={[s.avatar, showAvatar ? {} : s.avatarHidden, { backgroundColor: colors.border }]}>
                    <Text style={{ color: colors.ink, fontSize: 10, fontWeight: font.weights.bold }}>
                      {senderName?.charAt(0) || 'U'}
                    </Text>
                  </View>
                )}
                <View style={s.msgCol}>
                  <View
                    style={[
                      s.msgBubble,
                      isMe
                        ? { backgroundColor: colors.primary, borderBottomRightRadius: 4 }
                        : { backgroundColor: colors.primaryLight, borderBottomLeftRadius: 4 },
                    ]}
                  >
                    {!isMe && showAvatar && senderName ? (
                      <Text style={[s.senderName, { color: colors.ink }]}>{senderName}</Text>
                    ) : null}
                    {msg.message ? (
                      <Text style={[s.msgText, { color: isMe ? '#FFF' : colors.ink }]}>{msg.message}</Text>
                    ) : null}
                    {msg.attachments && msg.attachments.length > 0 ? (
                      <View style={s.attachmentList}>
                        {msg.attachments.map((att) => (
                          <TouchableOpacity
                            key={att._id}
                            accessibilityRole="link"
                            accessibilityLabel={att.name || t('Attachment')}
                            onPress={() => {
                              if (!att.url) return;
                              Linking.openURL(getAttachmentUrl(att.url)).catch(() => Alert.alert(t('Error'), t('Unable to open file')));
                            }}
                          >
                            <Text style={[s.attachmentLink, { color: isMe ? '#FFF' : colors.primary }]}>
                              {att.name || t('Attachment')}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    ) : null}
                  </View>
                  <Text style={[s.timestamp, isMe ? s.timestampMe : s.timestampOther, { color: colors.textMuted }]}>
                    {formatTime(msg.created_at || msg.createdAt)}
                  </Text>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Input */}
      <View style={[s.inputWrap, { backgroundColor: colors.surface, borderTopColor: colors.border }]}>
        {selectedFiles.length > 0 && (
          <View style={s.filesPreview}>
            {selectedFiles.map((file, index) => {
              const isImage = file.mimeType?.startsWith('image/');
              return (
                <View key={`${file.name}-${index}`} style={[s.fileChip, { backgroundColor: colors.background, borderColor: colors.border }]}>
                  {isImage ? (
                    <ImageIcon size={14} color={colors.primary} />
                  ) : (
                    <FileText size={14} color={colors.primary} />
                  )}
                  <Text style={[s.fileName, { color: colors.ink }]} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={{ color: colors.textMuted, fontSize: 10 }}>
                    {file.size ? `${(file.size / 1024 / 1024).toFixed(2)} ${t('MB')}` : ''}
                  </Text>
                  <TouchableOpacity onPress={() => removeFile(index)} style={s.fileRemove} hitSlop={6}>
                    <X size={12} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </View>
        )}
        <View style={s.inputRow}>
          {!isClosed && (
            <TouchableOpacity
              style={[s.attachBtn, { backgroundColor: colors.background }]}
              onPress={handlePickFiles}
              disabled={sending}
            >
              <Paperclip size={18} color={selectedFiles.length > 0 ? colors.primary : colors.textMuted} />
            </TouchableOpacity>
          )}
          <TextInput
            style={[s.input, { color: colors.ink, backgroundColor: colors.background, textAlign: isRTL ? 'right' : 'left' }]}
            placeholder={
              isClosed
                ? ticket.status === 'resolved'
                  ? t('This ticket has been resolved')
                  : t('This ticket is closed')
                : t('Type a message...')
            }
            placeholderTextColor={colors.textMuted}
            value={newMessage}
            onChangeText={setNewMessage}
            multiline
            editable={!isClosed}
          />
          <TouchableOpacity
            style={[s.sendBtn, { backgroundColor: colors.primary }, ((!newMessage.trim() && selectedFiles.length === 0) || sending || isClosed) && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={(!newMessage.trim() && selectedFiles.length === 0) || sending || isClosed}
          >
            {sending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Send size={18} color="#FFF" />
            )}
          </TouchableOpacity>
        </View>
      </View>
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
  attachBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  attachmentLink: { fontSize: font.sizes.xs, textDecorationLine: 'underline', marginTop: 2 },
  attachmentList: { marginTop: 4 },
  avatar: {
    width: 26, height: 26, borderRadius: 13,
    alignItems: 'center', justifyContent: 'center',
    marginRight: 8,
  },
  avatarHidden: { opacity: 0 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  deleteBtn: {
    marginTop: spacing.sm, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: radii.lg, borderWidth: 1,
  },
  description: { fontSize: font.sizes.sm, marginTop: spacing.sm, lineHeight: 20 },
  emptyMessages: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 60 },
  fileChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: spacing.sm, paddingVertical: 6, borderRadius: radii.lg, borderWidth: 1,
    maxWidth: '100%',
  },
  fileName: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, flexShrink: 1 },
  fileRemove: { marginLeft: 2 },
  filesPreview: {
    flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm,
    paddingHorizontal: spacing.md, paddingTop: spacing.sm,
  },
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
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  inputWrap: {
    borderTopWidth: 1, paddingBottom: Platform.OS === 'ios' ? 12 : 0,
  },
  messageList: { flex: 1 },
  messageListContent: { padding: spacing.md },
  msgBubble: {
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderRadius: radii.xl, maxWidth: '85%',
  },
  msgCol: { flexShrink: 1, maxWidth: '85%' },
  msgRow: { marginBottom: spacing.sm, flexDirection: 'row', alignItems: 'flex-end' },
  msgRowMe: { justifyContent: 'flex-end' },
  msgRowOther: { justifyContent: 'flex-start' },
  msgText: { fontSize: font.sizes.sm, lineHeight: 20 },
  root: { flex: 1 },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  senderName: { fontSize: 10, fontWeight: font.weights.semibold, marginBottom: 2 },
  timestamp: { fontSize: 9, marginTop: 2 },
  timestampMe: { textAlign: 'right', marginRight: 2 },
  timestampOther: { textAlign: 'left', marginLeft: 2 },
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, marginBottom: spacing.xs },
});
