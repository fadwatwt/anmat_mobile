import React, { useMemo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { Appointment } from '../../services/appointments';

type Props = {
  year: number;
  month: number; // 1-12
  appointments: Appointment[];
  selectedDate: string | null;
  onSelectDate: (iso: string) => void;
  onChangeMonth: (year: number, month: number) => void;
};

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function MonthlyCalendar({ year, month, appointments, selectedDate, onSelectDate, onChangeMonth }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const todayISO = new Date().toISOString().slice(0, 10);

  const daysWithAppts = useMemo(() => {
    const set = new Set<string>();
    appointments.forEach((a) => { if (a.date) set.add(a.date.slice(0, 10)); });
    return set;
  }, [appointments]);

  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const iso = (day: number) => `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  const prevMonth = () => (month === 1 ? onChangeMonth(year - 1, 12) : onChangeMonth(year, month - 1));
  const nextMonth = () => (month === 12 ? onChangeMonth(year + 1, 1) : onChangeMonth(year, month + 1));

  const monthName = new Date(year, month - 1, 1).toLocaleDateString(isRTL ? 'ar' : 'en', { month: 'long', year: 'numeric' });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={[styles.header, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <TouchableOpacity onPress={isRTL ? nextMonth : prevMonth} style={styles.navBtn}>
          <ChevronLeft size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.monthLabel, { color: colors.ink }]}>{monthName}</Text>
        <TouchableOpacity onPress={isRTL ? prevMonth : nextMonth} style={styles.navBtn}>
          <ChevronRight size={20} color={colors.ink} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((d) => (
          <Text key={d} style={[styles.weekday, { color: colors.textMuted }]}>{t(d)}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={`e-${i}`} style={styles.cell} />;
          const dateISO = iso(day);
          const isSelected = selectedDate === dateISO;
          const isToday = dateISO === todayISO;
          const hasAppt = daysWithAppts.has(dateISO);
          return (
            <TouchableOpacity
              key={dateISO}
              style={[styles.cell, isSelected && { backgroundColor: colors.primary, borderRadius: radii.md }]}
              onPress={() => onSelectDate(dateISO)}
            >
              <Text
                style={[
                  styles.dayText,
                  { color: isSelected ? '#FFF' : colors.ink },
                  isToday && !isSelected && { color: colors.primary, fontWeight: font.weights.bold },
                ]}
              >
                {day}
              </Text>
              {hasAppt && <View style={[styles.apptDot, { backgroundColor: isSelected ? '#FFF' : colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  apptDot: { borderRadius: 2, bottom: 4, height: 4, position: 'absolute', width: 4 },
  card: {
    borderRadius: radii.xxl, borderWidth: 1, gap: spacing.md, padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  cell: { alignItems: 'center', aspectRatio: 1, justifyContent: 'center', position: 'relative', width: `${100 / 7}%` },
  dayText: { fontSize: font.sizes.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  header: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' },
  monthLabel: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  navBtn: { padding: spacing.xs },
  weekday: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, textAlign: 'center', width: `${100 / 7}%` },
  weekRow: { flexDirection: 'row' },
});
