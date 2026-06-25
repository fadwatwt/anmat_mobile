import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Bell, Settings2 } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchUserPreferences,
  updateUserPreferences,
} from '../../services/settings';

type ToggleItem = {
  key: string;
  label: string;
  description: string;
};

const PREF_OPTIONS: ToggleItem[] = [
  { key: 'newsUpdates', label: 'News and Updates', description: 'Stay informed about the latest news, updates.' },
  { key: 'remindersEvents', label: 'Reminders and Events', description: 'Get reminders for upcoming events, deadlines.' },
  { key: 'leaveAttendance', label: 'Leave and Attendance', description: 'Updates on approved leaves, attendance records' },
  { key: 'deadlineNotification', label: 'Deadline Notification', description: 'Receive timely reminders before deadlines' },
];

const METHOD_OPTIONS: ToggleItem[] = [
  { key: 'email', label: 'Email Notifications', description: 'Receive notifications via email' },
  { key: 'push', label: 'Push Notifications', description: 'Get real-time updates and alerts directly on your device' },
];

export default function NotificationsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'preferences' | 'methods'>('preferences');

  const [prefs, setPrefs] = useState({
    newsUpdates: true,
    remindersEvents: true,
    leaveAttendance: false,
    deadlineNotification: true,
  });
  const [methods, setMethods] = useState({ email: true, push: true });

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchUserPreferences();
          if (data.notifications) {
            setPrefs((prev) => ({ ...prev, ...data.notifications! }));
          }
          if (data.notification_methods) {
            setMethods((prev) => ({ ...prev, ...data.notification_methods! }));
          }
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
      await updateUserPreferences({
        notifications: prefs,
        notification_methods: methods,
      });
      Alert.alert(t('Success'), t('Notification preferences updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update notification preferences'));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const renderToggleItem = (item: ToggleItem, isOn: boolean, onToggle: () => void) => (
    <View key={item.key} style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
      <View style={[styles.toggleTextWrap, { alignItems: isRTL ? 'flex-end' : 'flex-start' }]}>
        <Text style={[styles.toggleLabel, { color: colors.ink, textAlign: align }]}>{t(item.label)}</Text>
        <Text style={[styles.toggleDesc, { color: colors.textMuted, textAlign: align }]}>{t(item.description)}</Text>
      </View>
      <Switch
        value={isOn}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '60' }}
        thumbColor={isOn ? colors.primary : '#f4f3f4'}
      />
    </View>
  );

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
          style={[styles.sectionBtn, activeSection === 'preferences' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('preferences')}
        >
          <Bell size={16} color={activeSection === 'preferences' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sectionBtnText, { color: activeSection === 'preferences' ? colors.primary : colors.textMuted }]}>
            {t('Preferences')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'methods' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('methods')}
        >
          <Settings2 size={16} color={activeSection === 'methods' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sectionBtnText, { color: activeSection === 'methods' ? colors.primary : colors.textMuted }]}>
            {t('Methods')}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {activeSection === 'preferences' ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Notification Preferences')}</Text>
            <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Choose what notifications you want to receive')}</Text>
            {PREF_OPTIONS.map((item) =>
              renderToggleItem(item, prefs[item.key as keyof typeof prefs], () =>
                setPrefs((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] })),
              ),
            )}
          </>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Notification Methods')}</Text>
            <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Choose how you want to receive notifications')}</Text>
            {METHOD_OPTIONS.map((item) =>
              renderToggleItem(item, methods[item.key as keyof typeof methods], () =>
                setMethods((prev) => ({ ...prev, [item.key]: !prev[item.key as keyof typeof prev] })),
              ),
            )}
          </>
        )}

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
  sectionToggle: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBtnText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  sectionDesc: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  toggleTextWrap: { flex: 1, gap: 2, marginEnd: spacing.sm },
  toggleLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  toggleDesc: { fontSize: font.sizes.xs },
  saveBtn: {
    borderRadius: radii.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});
