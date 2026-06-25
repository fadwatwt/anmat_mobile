import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Clock } from 'lucide-react-native';
import { SelectDropdown } from '../../components/SelectDropdown';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchAttendanceSettings,
  updateAttendanceSettings,
} from '../../services/settings';

const MINUTES_OPTIONS = [
  { label: '60 min', value: '60' },
  { label: '40 min', value: '40' },
  { label: '30 min', value: '30' },
  { label: '20 min', value: '20' },
  { label: '10 min', value: '10' },
];

const HOURS_OPTIONS = [
  { label: '8 hours', value: '8' },
  { label: '6 hours', value: '6' },
  { label: '4 hours', value: '4' },
  { label: '2 hours', value: '2' },
  { label: '1 hour', value: '1' },
];

export default function AttendanceSettingsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [minutesBeforeWarning, setMinutesBeforeWarning] = useState('30');
  const [dailyWorkingHours, setDailyWorkingHours] = useState('8');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchAttendanceSettings();
          setMinutesBeforeWarning(String(data.minutes_before_warning ?? 30));
          setDailyWorkingHours(String(data.daily_working_hours ?? 8));
        } catch {
          // use defaults
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateAttendanceSettings({
        minutes_before_warning: parseInt(minutesBeforeWarning, 10),
        daily_working_hours: parseInt(dailyWorkingHours, 10),
      });
      Alert.alert(t('Success'), t('Attendance settings updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update attendance settings'));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Clock size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Attendance Preferences')}</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>
          {t('Configure delay warnings and daily working hours.')}
        </Text>

        <View style={styles.fieldGroup}>
          <SelectDropdown
            label={t('Minutes before Warning Message Sent')}
            options={MINUTES_OPTIONS}
            value={minutesBeforeWarning}
            onChange={setMinutesBeforeWarning}
          />
          <SelectDropdown
            label={t('Number of daily working hours for each employee')}
            options={HOURS_OPTIONS}
            value={dailyWorkingHours}
            onChange={setDailyWorkingHours}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? t('Saving...') : t('Apply Changes')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 60 },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: { alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, flex: 1 },
  sectionDesc: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  fieldGroup: { gap: spacing.md },
  saveBtn: {
    borderRadius: radii.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});
