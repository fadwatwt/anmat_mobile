import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import { Appointment } from '../../services/appointments';
import { CATEGORY_COLORS } from './agendaShared';

type Props = {
  appointments: Appointment[];
  onPressAppointment?: (a: Appointment) => void;
};

const START_HOUR = 7;
const END_HOUR = 20;

function parseHour(time?: string): number | null {
  if (!time) return null;
  const m = /^(\d{1,2}):(\d{2})/.exec(time);
  if (!m) return null;
  return parseInt(m[1], 10) + parseInt(m[2], 10) / 60;
}

export function HourlyTimeline({ appointments, onPressAppointment }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const now = new Date();
  const nowHour = now.getHours() + now.getMinutes() / 60;
  const showNow = nowHour >= START_HOUR && nowHour <= END_HOUR;

  const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

  const byHour = (h: number) =>
    appointments.filter((a) => {
      const ah = parseHour(a.start_time);
      return ah !== null && Math.floor(ah) === h;
    });

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t("Today's Schedule")}</Text>
      {appointments.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: 'center' }]}>{t('No appointments today')}</Text>
          <Text style={[styles.emptyHint, { color: colors.textMuted, textAlign: 'center' }]}>{t('Select a day to view details')}</Text>
        </View>
      ) : (
      <View style={styles.timeline}>
        {hours.map((h) => {
          const items = byHour(h);
          // Hide completely empty rows when there are appointments, to reduce noise —
          // but keep the now-row always visible as an anchor.
          const isNowRow = showNow && Math.floor(nowHour) === h;
          if (items.length === 0 && !isNowRow) return null;
          return (
            <View key={h} style={[styles.hourRow, { borderTopColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.hourLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                {String(h).padStart(2, '0')}:00
              </Text>
              <View style={styles.hourContent}>
                {isNowRow && <View style={[styles.nowLine, { backgroundColor: colors.danger }]} />}
                {items.map((a) => {
                  const color = CATEGORY_COLORS[a.category || 'other'] || colors.primary;
                  return (
                    <TouchableOpacity
                      key={a._id}
                      style={[styles.block, { backgroundColor: color + '1A', borderColor: color, borderLeftWidth: isRTL ? 0 : 3, borderRightWidth: isRTL ? 3 : 0 }]}
                      onPress={() => onPressAppointment?.(a)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.blockTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
                        {a.title}
                      </Text>
                      <Text style={[styles.blockTime, { color, textAlign: isRTL ? 'right' : 'left' }]}>
                        {a.start_time}{a.end_time ? ` - ${a.end_time}` : ''}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { borderRadius: radii.sm, marginVertical: 2, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  blockTime: { fontSize: 10, fontWeight: font.weights.semibold },
  blockTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  emptyWrap: { alignItems: 'center', gap: 4, paddingVertical: spacing.lg },
  emptyText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  emptyHint: { fontSize: font.sizes.xs, opacity: 0.7 },
  card: {
    borderRadius: radii.xxl, borderWidth: 1, gap: spacing.md, padding: spacing.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 2,
  },
  hourContent: { flex: 1, justifyContent: 'center', minHeight: 32, paddingVertical: 2 },
  hourLabel: { fontSize: font.sizes.xs, paddingTop: spacing.xs, width: 48 },
  hourRow: { borderTopWidth: 1, gap: spacing.sm, paddingVertical: 2 },
  nowLine: { borderRadius: 1, height: 2, position: 'absolute', top: '50%', width: '100%' },
  timeline: {},
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
});
