import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, Check, Edit3, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { Appointment } from '../../services/appointments';
import { REMINDER_OPTIONS } from './agendaShared';

type Props = {
  reminder: Appointment;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
  onEdit?: (reminder: Appointment) => void;
};

export function ReminderCard({ reminder, onComplete, onDelete, onEdit }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const done = reminder.status === 'completed';
  const firstType = reminder.reminder_types?.[0];
  const typeLabel = firstType ? REMINDER_OPTIONS.find((o) => o.value === firstType)?.key : null;

  const formatTime = (timeStr?: string) => {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':').map(Number);
    const period = h >= 12 ? t('PM') : t('AM');
    const display = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${display}:${String(m || 0).padStart(2, '0')} ${period}`;
  };

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: done ? colors.border : '#FCD34D' }]}>
      <Bell size={15} color={done ? colors.textMuted : '#F59E0B'} />
      <View style={styles.info}>
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
        <View style={[styles.meta, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          {!!reminder.start_time && (
            <Text style={[styles.metaText, { color: '#B45309' }]}>{formatTime(reminder.start_time)}</Text>
          )}
          {typeLabel && (
            <Text style={[styles.metaText, { color: colors.textMuted }]}>{t(typeLabel)}</Text>
          )}
        </View>
      </View>

      <View style={[styles.actions, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        {!done && onComplete && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onComplete(reminder._id)}>
            <Check size={15} color="#059669" />
          </TouchableOpacity>
        )}
        {onEdit && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onEdit(reminder)}>
            <Edit3 size={15} color="#3B82F6" />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity style={styles.actionBtn} onPress={() => onDelete(reminder._id)}>
            <Trash2 size={15} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  actionBtn: { padding: spacing.xs },
  actions: { gap: 2 },
  card: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, padding: spacing.sm },
  info: { flex: 1, gap: 2 },
  meta: { alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
  metaText: { fontSize: font.sizes.xs },
  title: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  titleDone: { textDecorationLine: 'line-through' },
});
