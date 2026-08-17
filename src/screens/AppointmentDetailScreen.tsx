import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation, useRoute } from '@react-navigation/native';
import { ArrowLeft, Calendar, Clock, MapPin, User } from 'lucide-react-native';
import { Badge } from '../components/Badge';
import { EditAppointmentModal } from '../components/agenda/EditAppointmentModal';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import {
  Appointment,
  addAppointmentNotes,
  cancelAppointment,
  completeAppointment,
  deleteAppointment,
  fetchAppointmentDetails,
} from '../services/appointments';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const QUICK_NOTES = [
  { key: 'Meeting Done', label: 'تم الاجتماع' },
  { key: 'Agreed On', label: 'تم الاتفاق على' },
  { key: 'Awaiting Response', label: 'بانتظار الرد' },
  { key: 'Postponed', label: 'تم التأجيل' },
  { key: 'Cancelled', label: 'تم الإلغاء' },
];

const statusVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'default'> = {
  completed: 'success',
  cancelled: 'danger',
  upcoming: 'info',
};

export default function AppointmentDetailScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const route = useRoute<any>();
  const navigation = useNavigation<any>();
  const role = user?.type;

  const passed = route.params?.appointment as Appointment | undefined;
  const appointmentId = passed?._id || route.params?.id;

  const [appointment, setAppointment] = useState<Appointment | undefined>(passed);
  const [loading, setLoading] = useState(!passed);
  const [editVisible, setEditVisible] = useState(false);
  const [notesEditing, setNotesEditing] = useState(false);
  const [noteText, setNoteText] = useState(passed?.notes || '');
  const [savingNotes, setSavingNotes] = useState(false);
  const [busy, setBusy] = useState('');

  const refresh = useCallback(() => {
    if (!appointmentId) return;
    fetchAppointmentDetails(role, appointmentId)
      .then((a) => {
        setAppointment(a);
        setNoteText(a.notes || '');
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [role, appointmentId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const confirmAction = (titleKey: string, messageKey: string, submitKey: string, action: () => Promise<void>, flag: string) => {
    Alert.alert(t(titleKey), t(messageKey), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t(submitKey),
        style: flag === 'delete' ? 'destructive' : 'default',
        onPress: async () => {
          setBusy(flag);
          try {
            await action();
            if (flag === 'delete') {
              navigation.goBack();
            } else {
              refresh();
            }
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed. Please try again.'));
          } finally {
            setBusy('');
          }
        },
      },
    ]);
  };

  const handleSaveNotes = async () => {
    if (!appointmentId) return;
    setSavingNotes(true);
    try {
      await addAppointmentNotes(role, appointmentId, noteText);
      setNotesEditing(false);
      refresh();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to save'));
    } finally {
      setSavingNotes(false);
    }
  };

  const handleQuickNote = (label: string) => {
    setNoteText((prev) => (prev ? `${prev}\n${label}: ` : `${label}: `));
    setNotesEditing(true);
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const rowDir = (isRTL ? 'row-reverse' : 'row') as 'row' | 'row-reverse';
  const isUpcoming = appointment?.status === 'upcoming' || !appointment?.status;

  const formatTime = (time?: string) => {
    if (!time) return '';
    const [h, m] = time.split(':').map(Number);
    const period = h >= 12 ? t('PM') : t('AM');
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  const fmtDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(isRTL ? 'ar' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    } catch {
      return dateStr;
    }
  };

  const infoCard = (icon: React.ReactNode, label: string, value: string) => (
    <View style={[styles.infoCard, { backgroundColor: colors.statusBg }]}>
      <View style={styles.infoIcon}>{icon}</View>
      <View style={styles.infoTextWrap}>
        <Text style={[styles.infoLabel, { color: colors.textMuted, textAlign: align }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.ink, textAlign: align }]}>{value}</Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.textMuted }}>{t('Loading...')}</Text>
      </View>
    );
  }

  if (!appointment) {
    return (
      <View style={[styles.container, styles.center, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.danger }}>{t('Failed to load appointment details.')}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} hitSlop={8}>
          <ArrowLeft size={22} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.ink, textAlign: align }]} numberOfLines={1}>
          {t('Appointment Details')}
        </Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={[styles.accent, { backgroundColor: appointment.color || '#3B82F6' }]} />
            <View style={styles.cardBody}>
              <View style={[styles.titleRow, { flexDirection: rowDir }]}>
                <View style={styles.titleWrap}>
                  <Text style={[styles.title, { color: colors.ink, textAlign: align }]}>{appointment.title}</Text>
                  {!!appointment.description && (
                    <Text style={[styles.desc, { color: colors.textMuted, textAlign: align }]}>{appointment.description}</Text>
                  )}
                </View>
                <Badge label={t(appointment.status || 'upcoming')} variant={statusVariant[appointment.status || 'upcoming'] || 'default'} size="sm" />
              </View>

              <View style={styles.infoGrid}>
                {infoCard(<Calendar size={18} color={colors.primary} />, t('Date'), fmtDate(appointment.date))}
                {infoCard(
                  <Clock size={18} color={colors.primary} />,
                  t('Time'),
                  [formatTime(appointment.start_time), formatTime(appointment.end_time)].filter(Boolean).join(' - ') || '--',
                )}
                {!!appointment.location && infoCard(<MapPin size={18} color={colors.primary} />, t('Location'), appointment.location)}
                {!!appointment.user?.name && infoCard(<User size={18} color={colors.primary} />, t('Created by'), appointment.user.name)}
              </View>

              {!!appointment.attendee_list?.length && (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>
                    {t('Attendees')} ({appointment.attendee_list.length})
                  </Text>
                  <View style={[styles.attendees, { flexDirection: rowDir }]}>
                    {appointment.attendee_list.map((a) => (
                      <View key={a._id} style={[styles.attendee, { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: rowDir }]}>
                        {a.imageProfile ? (
                          <Image source={{ uri: a.imageProfile }} style={styles.attendeeImg} />
                        ) : (
                          <View style={[styles.attendeeImg, styles.attendeeInitial, { backgroundColor: colors.primaryLight }]}>
                            <Text style={[styles.attendeeInitialText, { color: colors.primary }]}>{(a.name || '?').charAt(0)}</Text>
                          </View>
                        )}
                        <Text style={[styles.attendeeName, { color: colors.ink }]} numberOfLines={1}>{a.name}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}

              {!!appointment.task && (
                <View style={[styles.linkedTask, { backgroundColor: colors.primaryLight, flexDirection: rowDir }]}>
                  <View style={styles.linkedTaskText}>
                    <Text style={[styles.linkedTaskLabel, { color: colors.primary }]}>{t('Linked Task')}</Text>
                    <Text style={[styles.linkedTaskTitle, { color: colors.ink, textAlign: align }]}>{appointment.task.title}</Text>
                    <Text style={[styles.linkedTaskMeta, { color: colors.textMuted, textAlign: align }]}>
                      {t('Status')}: {appointment.task.status} • {t('Priority')}: {appointment.task.priority}
                    </Text>
                  </View>
                </View>
              )}

              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Notes')}</Text>
                {notesEditing ? (
                  <View style={styles.notesEdit}>
                    <TextInput
                      style={[styles.notesInput, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
                      value={noteText}
                      onChangeText={setNoteText}
                      multiline
                      placeholder={t('Add your notes here...')}
                      placeholderTextColor={colors.textMuted}
                      editable={!savingNotes}
                    />
                    <View style={[styles.quickNotes, { flexDirection: rowDir }]}>
                      {QUICK_NOTES.map((qn) => (
                        <TouchableOpacity
                          key={qn.key}
                          style={[styles.quickNote, { backgroundColor: colors.statusBg, borderColor: colors.border }]}
                          onPress={() => handleQuickNote(qn.label)}
                        >
                          <Text style={{ color: colors.ink, fontSize: font.sizes.xs }}>{qn.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                    <View style={[styles.notesActions, { flexDirection: rowDir }]}>
                      <TouchableOpacity
                        style={[styles.saveNoteBtn, { backgroundColor: colors.primary }]}
                        onPress={handleSaveNotes}
                        disabled={savingNotes}
                      >
                        <Text style={styles.saveNoteText}>{t('Save')}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.cancelNoteBtn}
                        onPress={() => {
                          setNotesEditing(false);
                          setNoteText(appointment.notes || '');
                        }}
                      >
                        <Text style={{ color: colors.textMuted }}>{t('Cancel')}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <View>
                    {appointment.notes ? (
                      <Text style={[styles.notesText, { color: colors.ink, backgroundColor: colors.statusBg, textAlign: align }]}>
                        {appointment.notes}
                      </Text>
                    ) : (
                      <Text style={{ color: colors.textMuted, fontSize: font.sizes.sm, textAlign: align }}>{t('No notes yet')}</Text>
                    )}
                    <TouchableOpacity style={styles.addNoteBtn} onPress={() => setNotesEditing(true)}>
                      <Text style={{ color: colors.primary, fontSize: font.sizes.sm, fontWeight: font.weights.semibold }}>
                        {appointment.notes ? t('Edit') : t('Add Note')}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            </View>
          </View>

          <View style={[styles.actionsRow, { flexDirection: rowDir }]}>
            <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.primary }]} onPress={() => setEditVisible(true)}>
              <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('Edit')}</Text>
            </TouchableOpacity>
            {isUpcoming && (
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.success }]}
                onPress={() =>
                  confirmAction('Complete Appointment?', 'Are you sure you want to mark this appointment as completed?', 'Complete', () => completeAppointment(role, appointment._id), 'complete')
                }
              >
                <Text style={[styles.actionBtnText, { color: '#FFF' }]}>{t('Complete')}</Text>
              </TouchableOpacity>
            )}
          </View>

          {isUpcoming && (
            <TouchableOpacity
              style={[styles.cancelBtn, { borderColor: colors.danger }]}
              onPress={() =>
                confirmAction('Cancel Appointment?', 'Are you sure you want to cancel this appointment?', 'Yes, Cancel', () => cancelAppointment(role, appointment._id), 'cancel')
              }
            >
              <Text style={{ color: colors.danger, fontWeight: font.weights.semibold }}>{t('Cancel Appointment')}</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.deleteBtn, { borderColor: colors.danger }]}
            onPress={() =>
              confirmAction('Delete Appointment?', 'Are you sure you want to delete this appointment?', 'Delete', () => deleteAppointment(role, appointment._id), 'delete')
            }
          >
            <Text style={{ color: colors.danger, fontWeight: font.weights.semibold }}>{t('Delete Appointment')}</Text>
          </TouchableOpacity>

          {busy !== '' && (
            <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs, textAlign: 'center' }}>{t('Loading...')}</Text>
          )}
        </View>
      </ScrollView>

      <EditAppointmentModal
        visible={editVisible}
        appointment={appointment}
        onClose={() => setEditVisible(false)}
        onSaved={refresh}
        role={role}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  accent: { borderBottomLeftRadius: radii.lg, borderTopLeftRadius: radii.lg, width: 6 },
  actionBtn: { alignItems: 'center', borderRadius: radii.lg, flex: 1, height: 48, justifyContent: 'center' },
  actionBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  actionsRow: { gap: spacing.sm },
  addNoteBtn: { alignSelf: 'flex-start', marginTop: spacing.sm, padding: spacing.xs },
  attendee: { alignItems: 'center', borderRadius: radii.full, borderWidth: 1, flexDirection: 'row', gap: 6, padding: 4, paddingRight: spacing.sm },
  attendeeImg: { borderRadius: radii.full, height: 24, width: 24 },
  attendeeInitial: { alignItems: 'center', justifyContent: 'center' },
  attendeeInitialText: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  attendeeName: { fontSize: font.sizes.xs, maxWidth: 110 },
  attendees: { flexWrap: 'wrap', gap: spacing.xs },
  backBtn: { width: 40, padding: spacing.xs },
  cancelBtn: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, height: 48, justifyContent: 'center' },
  cancelNoteBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  card: { borderWidth: 1, borderRadius: radii.lg, flexDirection: 'row', overflow: 'hidden' },
  cardBody: { flex: 1, gap: spacing.md, padding: spacing.lg },
  center: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  container: { flex: 1 },
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.xxl },
  deleteBtn: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, height: 48, justifyContent: 'center' },
  desc: { fontSize: font.sizes.sm, marginTop: 2 },
  header: { alignItems: 'center', borderBottomWidth: 1, flexDirection: 'row', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  headerTitle: { flex: 1, fontSize: font.sizes.lg, fontWeight: font.weights.semibold },
  infoCard: { borderRadius: radii.lg, flex: 1, flexDirection: 'row', gap: spacing.sm, minWidth: 150, padding: spacing.sm },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  infoIcon: { paddingTop: 2 },
  infoLabel: { fontSize: font.sizes.xs },
  infoTextWrap: { flex: 1 },
  infoValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  linkedTask: { alignItems: 'flex-start', borderRadius: radii.lg, padding: spacing.md },
  linkedTaskLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.bold },
  linkedTaskMeta: { fontSize: font.sizes.xs, marginTop: 2 },
  linkedTaskText: { flex: 1 },
  linkedTaskTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold, marginTop: 2 },
  notesActions: { gap: spacing.sm, marginTop: spacing.sm },
  notesEdit: { gap: spacing.sm },
  notesInput: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, minHeight: 80, padding: spacing.md, textAlignVertical: 'top' },
  notesText: { borderRadius: radii.lg, fontSize: font.sizes.sm, padding: spacing.md },
  quickNote: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  quickNotes: { flexWrap: 'wrap', gap: spacing.xs },
  saveNoteBtn: { alignItems: 'center', borderRadius: radii.lg, minWidth: 80, paddingVertical: spacing.sm },
  saveNoteText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  titleRow: { alignItems: 'flex-start', justifyContent: 'space-between' },
  titleWrap: { flex: 1 },
});
