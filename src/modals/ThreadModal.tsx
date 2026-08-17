import React, { useEffect, useRef, useState } from 'react';
import { Alert, ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { ChatMessage, createThreadReply, fetchThreadReplies } from '../services/conversations';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  message: ChatMessage | null;
  onClose: () => void;
};

export function ThreadModal({ visible, message, onClose }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const userId = user?._id;

  const [replies, setReplies] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const rowDir = (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse';

  useEffect(() => {
    if (!visible || !message) return;
    setText('');
    setLoading(true);
    fetchThreadReplies(message._id)
      .then(setReplies)
      .catch(() => setReplies([]))
      .finally(() => setLoading(false));
  }, [visible, message]);

  const senderName = (m: ChatMessage) =>
    typeof m.sent_by === 'string' ? t('User') : m.sent_by?.name || t('User');
  const isMine = (m: ChatMessage) =>
    !!userId && (typeof m.sent_by === 'string' ? m.sent_by === userId : m.sent_by?._id === userId);

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleSend = async () => {
    if (!message || !text.trim() || sending) return;
    setSending(true);
    try {
      const reply = await createThreadReply(message._id, text.trim());
      setReplies((prev) => [...prev, reply]);
      setText('');
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to send reply'));
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Thread')} size="md" noScroll>
      <View style={styles.body}>
        {message && (
          <View style={[styles.original, { borderBottomColor: colors.border }]}>
            <Text style={[styles.origName, { color: colors.ink, textAlign: align }]}>
              {isMine(message) ? t('You') : senderName(message)}
            </Text>
            <Text style={[styles.origTime, { color: colors.textMuted, textAlign: align }]}>
              {formatTime(message.created_at)}
            </Text>
            <View style={[styles.origBubble, { backgroundColor: colors.statusBg }]}>
              <Text style={[styles.origText, { color: colors.ink, textAlign: align }]}>
                {message.content || t('Attachment')}
              </Text>
            </View>
          </View>
        )}

        <View style={[styles.countRow, { flexDirection: rowDir }]}>
          <View style={[styles.hr, { backgroundColor: colors.border }]} />
          <Text style={[styles.countText, { color: colors.textMuted }]}>{replies.length} {t('Replies')}</Text>
          <View style={[styles.hr, { backgroundColor: colors.border }]} />
        </View>

        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : (
          <FlatList
            ref={listRef}
            style={styles.list}
            data={replies}
            keyExtractor={(m) => m._id}
            renderItem={({ item }) => {
              const mine = isMine(item);
              return (
                <View style={[styles.replyRow, { flexDirection: rowDir }]}>
                  <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                    <Text style={[styles.avatarText, { color: colors.primary }]}>
                      {(senderName(item)).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.replyBody}>
                    <View style={[styles.replyHeader, { flexDirection: rowDir }]}>
                      <Text style={[styles.replyName, { color: colors.ink }]}>
                        {mine ? t('You') : senderName(item)}
                      </Text>
                      <Text style={[styles.replyTime, { color: colors.textMuted }]}>{formatTime(item.created_at)}</Text>
                    </View>
                    <Text style={[styles.replyText, { color: colors.ink, textAlign: align }]}>{item.content}</Text>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <Text style={[styles.empty, { color: colors.textMuted, textAlign: 'center' }]}>
                {t('No replies yet')}
              </Text>
            }
          />
        )}

        <View style={[styles.inputBar, { borderTopColor: colors.border, flexDirection: rowDir }]}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.statusBg, color: colors.ink, borderColor: colors.border, textAlign: align }]}
            placeholder={t('Reply...')}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            style={[styles.sendBtn, { backgroundColor: colors.primary }, (!text.trim() || sending) && { opacity: 0.5 }]}
            onPress={handleSend}
            disabled={!text.trim() || sending}
          >
            {sending ? <ActivityIndicator color="#FFF" size="small" /> : <Send size={16} color="#FFF" />}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  avatar: { borderRadius: radii.full, height: 30, width: 30, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  body: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  countRow: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  countText: { fontSize: font.sizes.xs },
  empty: { padding: spacing.lg, fontSize: font.sizes.sm },
  hr: { flex: 1, height: 1 },
  input: { borderRadius: radii.lg, borderWidth: 1, flex: 1, fontSize: font.sizes.sm, maxHeight: 80, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  inputBar: { alignItems: 'flex-end', borderTopWidth: 1, gap: spacing.sm, padding: spacing.md },
  list: { flex: 1 },
  origBubble: { borderRadius: radii.lg, marginTop: spacing.sm, padding: spacing.md },
  origName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  original: { borderBottomWidth: 1, padding: spacing.md },
  origText: { fontSize: font.sizes.sm },
  origTime: { fontSize: font.sizes.xs, marginTop: 2 },
  replyBody: { flex: 1 },
  replyHeader: { alignItems: 'center', gap: spacing.sm },
  replyName: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  replyRow: { gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  replyText: { fontSize: font.sizes.sm, marginTop: 2 },
  replyTime: { fontSize: font.sizes.xs, color: undefined },
  sendBtn: { borderRadius: radii.full, height: 40, width: 40, alignItems: 'center', justifyContent: 'center' },
});
