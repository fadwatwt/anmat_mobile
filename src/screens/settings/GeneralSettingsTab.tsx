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
import { Sun, Moon, Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { SelectDropdown } from '../../components/SelectDropdown';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchOrganizationSettings,
  updateOrganizationSettings,
} from '../../services/settings';

const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'العربية', value: 'ar' },
];

const TIMEZONES = [
  { label: 'UTC (Coordinated Universal Time)', value: 'UTC' },
  { label: 'Riyadh (Arabia Standard Time)', value: 'Asia/Riyadh' },
  { label: 'Dubai (Gulf Standard Time)', value: 'Asia/Dubai' },
  { label: 'Cairo (Eastern European Time)', value: 'Africa/Cairo' },
  { label: 'Amman (Eastern European Time)', value: 'Asia/Amman' },
  { label: 'New York (Eastern Standard Time)', value: 'America/New_York' },
  { label: 'Los Angeles (Pacific Standard Time)', value: 'America/Los_Angeles' },
  { label: 'London (Greenwich Mean Time)', value: 'Europe/London' },
];

const TIME_FORMATS = [
  { label: '12-hour format (AM/PM)', value: '12hr' },
  { label: '24-hour format', value: '24h' },
];

const DATE_FORMATS = [
  { label: 'MM/DD/YYYY', value: 'mm-dd-yyyy' },
  { label: 'DD/MM/YYYY', value: 'dd-mm-yyyy' },
  { label: 'YYYY-MM-DD', value: 'yyyy-mm-dd' },
  { label: 'DD Month YYYY', value: 'dd-month-yyyy' },
  { label: 'Month DD, YYYY', value: 'month-dd-yyyy' },
];

export default function GeneralSettingsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { locale, setLocale } = useLocale();
  const { mode, setThemeMode } = useTheme();
  const { isRTL } = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'regional' | 'theme'>('regional');

  const [selectedLang, setSelectedLang] = useState(locale);
  const [timezone, setTimezone] = useState('UTC');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [dateFormat, setDateFormat] = useState('yyyy-mm-dd');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const org = await fetchOrganizationSettings();
          setTimezone(org.timezone || 'UTC');
          setTimeFormat(org.time_format || '24h');
          setDateFormat(org.date_format || 'yyyy-mm-dd');
        } catch {
          // use defaults
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const handleSaveRegional = async () => {
    setSaving(true);
    try {
      await updateOrganizationSettings({
        timezone,
        time_format: timeFormat,
        date_format: dateFormat,
      });
      if (selectedLang !== locale) {
        setLocale(selectedLang);
      }
      Alert.alert(t('Success'), t('Regional preferences updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update regional preferences'));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const themeOptions = [
    { key: 'light' as const, label: t('Light Mode'), icon: <Sun size={20} color={colors.ink} />, description: t('Pick a clean and classic light theme') },
    { key: 'dark' as const, label: t('Dark Mode'), icon: <Moon size={20} color={colors.ink} />, description: t('Pick a clean and classic dark theme') },
  ];

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Section Toggle */}
      <View style={[styles.sectionToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'regional' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('regional')}
        >
          <Text style={[styles.sectionBtnText, { color: activeSection === 'regional' ? colors.primary : colors.textMuted }]}>
            {t('Regional Preferences')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'theme' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('theme')}
        >
          <Text style={[styles.sectionBtnText, { color: activeSection === 'theme' ? colors.primary : colors.textMuted }]}>
            {t('Theme Options')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'regional' ? (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Regional Preferences')}</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Select your preferences for your region')}</Text>

          <View style={styles.fieldGroup}>
            <SelectDropdown
              label={t('Language')}
              options={LANGUAGES}
              value={selectedLang}
              onChange={(v) => setSelectedLang(v as 'en' | 'ar')}
            />
            {selectedLang !== locale && (
              <Text style={[styles.hint, { color: colors.warning, textAlign: align }]}>
                {t('Language will change immediately on save')}
              </Text>
            )}
            <SelectDropdown
              label={t('Timezone')}
              options={TIMEZONES}
              value={timezone}
              onChange={setTimezone}
              translateLabels
            />
            <SelectDropdown
              label={t('Time Format')}
              options={TIME_FORMATS}
              value={timeFormat}
              onChange={setTimeFormat}
              translateLabels
            />
            <SelectDropdown
              label={t('Date Format')}
              options={DATE_FORMATS}
              value={dateFormat}
              onChange={setDateFormat}
              translateLabels
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveRegional}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? t('Saving...') : t('Apply Changes')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Theme Options')}</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Select your preferences for your region')}</Text>

          <View style={styles.themeOptions}>
            {themeOptions.map((opt) => {
              const isActive = mode === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.themeCard,
                    { borderColor: colors.border, backgroundColor: colors.background },
                    isActive && { borderColor: colors.primary, backgroundColor: colors.primary + '10' },
                  ]}
                  onPress={() => setThemeMode(opt.key)}
                >
                  {opt.icon}
                  <View style={styles.themeTextWrap}>
                    <Text style={[styles.themeLabel, { color: colors.ink, textAlign: align }]}>{opt.label}</Text>
                    <Text style={[styles.themeDesc, { color: colors.textMuted, textAlign: align }]}>{opt.description}</Text>
                  </View>
                  {isActive && (
                    <View style={[styles.checkCircle, { backgroundColor: colors.primary }]}>
                      <Check size={14} color="#FFF" />
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 60 },
  sectionToggle: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionBtn: {
    flex: 1,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
  },
  sectionBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  sectionDesc: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  fieldGroup: { gap: spacing.md },
  hint: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  saveBtn: {
    borderRadius: radii.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  themeOptions: { gap: spacing.sm },
  themeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.xl,
    padding: spacing.md,
  },
  themeTextWrap: { flex: 1 },
  themeLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  themeDesc: { fontSize: font.sizes.xs },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
