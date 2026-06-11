import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Check, Trash2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { DailyTask } from '../../services/appointments';
import { PRIORITY_COLORS } from './agendaShared';

type Props = {
  task: DailyTask;
  onComplete?: (id: string) => void;
  onDelete?: (id: string) => void;
};

export function DailyTaskCard({ task, onComplete, onDelete }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const isCompleted = task.status === 'completed';
  const dotColor = PRIORITY_COLORS[task.priority || 'medium'] || colors.primary;

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <TouchableOpacity
        style={[styles.checkbox, { borderColor: isCompleted ? colors.success : colors.border, backgroundColor: isCompleted ? colors.success : 'transparent' }]}
        onPress={() => !isCompleted && onComplete?.(task._id)}
        disabled={isCompleted}
      >
        {isCompleted && <Check size={12} color="#FFF" />}
      </TouchableOpacity>

      <View style={styles.info}>
        <Text
          style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }, isCompleted && styles.completed]}
          numberOfLines={1}
        >
          {task.title}
        </Text>
        {!!task.description && (
          <Text style={[styles.desc, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {task.description}
          </Text>
        )}
      </View>

      <View style={[styles.dot, { backgroundColor: dotColor }]} />

      {onDelete && (
        <TouchableOpacity style={styles.delBtn} onPress={() => onDelete(task._id)}>
          <Trash2 size={15} color={colors.danger} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  checkbox: { alignItems: 'center', borderRadius: radii.sm, borderWidth: 1.5, height: 20, justifyContent: 'center', width: 20 },
  completed: { textDecorationLine: 'line-through' },
  delBtn: { padding: spacing.xs },
  desc: { fontSize: font.sizes.xs },
  dot: { borderRadius: 4, height: 8, width: 8 },
  info: { flex: 1, gap: 2 },
  title: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
