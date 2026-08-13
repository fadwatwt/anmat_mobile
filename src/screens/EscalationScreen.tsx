import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Clock, MessageCircle, User } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { EmptyState } from '../components/EmptyState';
import { Button } from '../components/Button';
import {
  fetchPendingEscalations,
  approveEscalation,
  rejectEscalation,
  EscalationRequest,
} from '../services/escalations';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

export default function EscalationScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<any>();
  const [requests, setRequests] = useState<EscalationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const load = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      setRequests(await fetchPendingEscalations());
    } catch {
      setRequests([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      const result = await approveEscalation(id);
      if (result?.chat_id) {
        // Mirrors web `/chat/{chat_id}` navigation — open the AI conversation screen.
        navigation.navigate('AI');
      }
      load();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      await rejectEscalation(id);
      load();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={styles.loading} />;
  }

  if (requests.length === 0) {
    return (
      <EmptyState
        title={t('No pending requests')}
        message={t('There are no pending human handoff requests right now')}
        icon="🕒"
      />
    );
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => load(true)} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {requests.map((request) => {
        const processing = processingId === request._id;
        const requesterName = request.requester_name || request.requester?.name || '—';
        const requesterEmail = request.requester_email || request.requester?.email || '';
        const createdAt = request.created_at ? new Date(request.created_at) : null;
        return (
          <View key={request._id} style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.userRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
                  <User size={20} color={colors.primary} />
                </View>
                <View style={[styles.userInfo, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
                  <Text style={[styles.name, { color: colors.ink, textAlign: align }]}>{requesterName}</Text>
                  {!!requesterEmail && (
                    <Text style={[styles.email, { color: colors.textMuted, textAlign: align }]}>{requesterEmail}</Text>
                  )}
                  {createdAt && (
                    <Text style={[styles.date, { color: colors.textMuted, textAlign: align }]}>
                      {createdAt.toLocaleString()}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {!!request.message && (
              <View style={[styles.messageBox, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                <Text style={[styles.message, { color: colors.textMuted, textAlign: align }]}>{request.message}</Text>
              </View>
            )}

            {createdAt && (
              <View style={[styles.timeRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <MessageCircle size={14} color={colors.textMuted} />
                <Text style={[styles.time, { color: colors.textMuted, textAlign: align }]}>
                  {t('Request time')}: {createdAt.toLocaleTimeString()}
                </Text>
              </View>
            )}

            <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Button
                  label={t('Approve')}
                  icon={<Clock size={16} color="#FFF" />}
                  onPress={() => handleApprove(request._id)}
                  loading={processing}
                  size="sm"
                />
              </View>
              <TouchableOpacity
                disabled={processing}
                onPress={() => handleReject(request._id)}
                style={[styles.rejectBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              >
                <Text style={[styles.rejectText, { color: colors.textMuted }]}>{t('Reject')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  actions: { gap: spacing.sm, marginTop: spacing.sm },
  avatar: { alignItems: 'center', borderRadius: radii.full, height: 40, justifyContent: 'center', width: 40 },
  card: { borderRadius: radii.xl, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between' },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  date: { fontSize: font.sizes.xs, marginTop: 2 },
  email: { fontSize: font.sizes.sm },
  loading: { marginTop: spacing.xxl },
  message: { fontSize: font.sizes.sm, lineHeight: 20 },
  messageBox: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.sm },
  name: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  rejectBtn: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 36,
    paddingHorizontal: spacing.lg,
  },
  rejectText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  time: { fontSize: font.sizes.xs },
  timeRow: { alignItems: 'center', gap: spacing.xs },
  userInfo: { flex: 1, gap: 1 },
  userRow: { alignItems: 'center', flex: 1, gap: spacing.sm },
});
