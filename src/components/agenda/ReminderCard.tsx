import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Edit3 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { Appointment } from '../../services/appointments';
import { REMINDER_OPTIONS, todayISO } from './agendaShared';

type Props = {
  reminder: Appointment;
  onComplete?: (id: string) => void;
  onEdit?: (reminder: Appointment) => void;
};

export function ReminderCard({ reminder, onComplete, onEdit }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const done = reminder.status === 'completed';
  // Overdue: date passed and still not completed/cancelled.
  const isOverdue =
    !done &&
    reminder.status !== 'cancelled' &&
    !!reminder.date &&
    reminder.date.slice(0, 10) < todayISO();
  const firstType = reminder.reminder_types?.[0];
  const typeLabel = firstType ? REMINDER_OPTIONS.find((o) => o.value === firstType)?.key : null;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? t('PM') : t('AM');
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  // Border semantics: gold = overdue (needs attention), muted = done,
  // normal border = upcoming. Gold no longer marks every pending item.
  const borderColor = done ? colors.border : isOverdue ? '#FCD34D' : colors.border;
  const bellColor = done ? colors.textMuted : isOverdue ? '#EF4444' : '#F59E0B';

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor }]}>
      <Bell size={18} color={bellColor} />
      <View style={styles.info}>
        <View style={[styles.titleRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Text
            style={[
              styles.title,
              { color: colors.ink, textAlign: isRTL ? 'right' : 'left' },
              done && styles.titleDone,
            ]}
            numberOfLines={1}
          >
            {reminder.title}
          </Text>
          {isOverdue && (
            <View style={styles.overdueBadge}>
              <Text style={styles.overdueText}>{t('Overdue')}</Text>
            </View>
          )}
        </View>
        <View style={[styles.meta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!!reminder.start_time && (
            <Text style={[styles.metaText, { color: isOverdue ? '#EF4444' : '#B45309' }]}>{formatTime(reminder.start_time)}</Text>
          )}
          {typeLabel && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{t(typeLabel)}</Text>
          )}
        </View>
      </View>

      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {!done && onComplete && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onComplete(reminder._id)}
            accessibilityLabel={t('Mark as Completed')}
            hitSlop={8}
          >
            <Check size={18} color="#059669" />
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => onEdit(reminder)}
            accessibilityLabel={t('Edit Reminder')}
            hitSlop={8}
          >
            <Edit3 size={18} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // 44px minimum touch target (a11y). hitSlop={8} adds extra margin outside.
  actionBtn: { alignItems: 'center', justifyContent: 'center', minHeight: 44, minWidth: 44 },
  actions: { gap: spacing.xs },
  card: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  info: { flex: 1, gap: 2 },
  meta: { alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  metaText: { fontSize: font.sizes.xs },
  overdueBadge: { backgroundColor: '#FEE2E2', borderRadius: radii.sm, paddingHorizontal: spacing.xs, paddingVertical: 2 },
  overdueText: { color: '#C9372C', fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  title: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  titleDone: { textDecorationLine: 'line-through' },
  titleRow: { alignItems: 'center', gap: spacing.xs },
});
