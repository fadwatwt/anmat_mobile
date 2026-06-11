import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Clock, MapPin, Check, X } from 'lucide-react-native';
import { Badge } from '../Badge';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { Appointment } from '../../services/appointments';
import { CATEGORY_COLORS } from './agendaShared';

type Props = {
  appointment: Appointment;
  onComplete?: (id: string) => void;
  onCancel?: (id: string) => void;
  showCountdown?: boolean;
};

function statusVariant(s?: string): 'success' | 'warning' | 'danger' | 'info' | 'default' {
  if (s === 'completed') return 'success';
  if (s === 'cancelled') return 'danger';
  if (s === 'upcoming') return 'info';
  return 'default';
}

export function AppointmentCard({ appointment, onComplete, onCancel, showCountdown }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const catColor = CATEGORY_COLORS[appointment.category || 'other'] || colors.primary;
  const isUpcoming = appointment.status === 'upcoming' || !appointment.status;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.accent, { backgroundColor: catColor }]} />
      <View style={styles.body}>
        <View style={styles.headRow}>
          <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {appointment.title}
          </Text>
          <Badge label={t(appointment.status || 'upcoming')} variant={statusVariant(appointment.status)} size="sm" />
        </View>

        <View style={[styles.metaRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!!(appointment.start_time || appointment.date) && (
            <View style={styles.metaItem}>
              <Clock size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]}>
                {appointment.start_time || ''}{appointment.end_time ? ` - ${appointment.end_time}` : ''}
              </Text>
            </View>
          )}
          {!!appointment.location && (
            <View style={styles.metaItem}>
              <MapPin size={13} color={colors.textMuted} />
              <Text style={[styles.metaText, { color: colors.textMuted }]} numberOfLines={1}>{appointment.location}</Text>
            </View>
          )}
        </View>

        {showCountdown && typeof appointment.countdownDays === 'number' && (
          <Text style={[styles.countdown, { color: appointment.countdownDays < 0 ? colors.danger : colors.primary }]}>
            {appointment.countdownDays < 0 ? t('Overdue') : appointment.countdownDays === 0 ? t('Today') : `${appointment.countdownDays} ${t('days')}`}
          </Text>
        )}

        {isUpcoming && (onComplete || onCancel) && (
          <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            {onComplete && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.successBg }]} onPress={() => onComplete(appointment._id)}>
                <Check size={14} color={colors.successText} />
                <Text style={[styles.actionText, { color: colors.successText }]}>{t('Complete')}</Text>
              </TouchableOpacity>
            )}
            {onCancel && (
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.dangerBg }]} onPress={() => onCancel(appointment._id)}>
                <X size={14} color={colors.dangerText} />
                <Text style={[styles.actionText, { color: colors.dangerText }]}>{t('Cancel')}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  accent: { borderBottomLeftRadius: radii.lg, borderTopLeftRadius: radii.lg, width: 4 },
  actionBtn: { alignItems: 'center', borderRadius: radii.md, flexDirection: 'row', gap: 4, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  actionText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  actions: { gap: spacing.sm, marginTop: spacing.xs },
  body: { flex: 1, gap: spacing.xs, padding: spacing.md },
  card: { borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', overflow: 'hidden' },
  countdown: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  headRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  metaItem: { alignItems: 'center', flexDirection: 'row', gap: 4 },
  metaRow: { flexWrap: 'wrap', gap: spacing.md },
  metaText: { fontSize: font.sizes.xs },
  title: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
