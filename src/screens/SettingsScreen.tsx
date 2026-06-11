import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/Button';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

const LANGUAGES = [
  { code: 'en' as const, label: 'English' },
  { code: 'ar' as const, label: 'العربية' },
];

export default function SettingsScreen() {
  const { logout, user } = useAuth();
  const { colors } = useTheme();
  const { locale, setLocale } = useLocale();
  const { t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState(locale);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{(user?.name || 'A').slice(0, 1).toUpperCase()}</Text>
        </View>
        <Text style={[styles.name, { color: colors.ink }]}>{user?.name || 'User'}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <SettingsRow label={t('Account Type')} value={user?.type || '-'} icon="👤" colors={colors} />
        <SettingsRow label={t('Email')} value={user?.email || '-'} icon="✉" colors={colors} />
        <SettingsRow label={t('User')} value={user?._id?.slice(-8) || '-'} icon="🔢" colors={colors} />
        <SettingsRow label={t('Server')} value={API_URL.replace('http://', '').replace('https://', '')} icon="🖥" colors={colors} last />
      </View>

      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={styles.languageSection}>
          <Text style={[styles.languageLabel, { color: colors.textMuted }]}>{t('Language')}</Text>
          <View style={styles.langOptions}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                onPress={() => setSelectedLang(lang.code)}
                style={[
                  styles.langOption,
                  { borderColor: colors.border },
                  selectedLang === lang.code && { backgroundColor: colors.primary, borderColor: colors.primary },
                ]}
              >
                <Text
                  style={[
                    styles.langOptionText,
                    { color: colors.ink },
                    selectedLang === lang.code && { color: '#FFF' },
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {selectedLang !== locale && (
            <Button
              label={t('Apply Changes')}
              onPress={() => setLocale(selectedLang)}
              size="sm"
            />
          )}
        </View>
      </View>

      <Button label={t('Logout')} onPress={logout} variant="danger" />
    </View>
  );
}

function SettingsRow({ label, value, icon, colors, last }: { label: string; value: string; icon?: string; colors: ReturnType<typeof useTheme>['colors']; last?: boolean }) {
  return (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={styles.rowLeft}>
        {icon ? <Text style={styles.rowIcon}>{icon}</Text> : null}
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, { color: colors.ink }]} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', borderRadius: radii.full, height: 72, justifyContent: 'center', width: 72 },
  avatarText: { color: '#FFF', fontSize: 32, fontWeight: font.weights.extrabold },
  container: { flex: 1, gap: spacing.lg, padding: spacing.md },
  email: { fontSize: font.sizes.sm },
  header: { alignItems: 'center', gap: spacing.sm },
  languageLabel: { fontSize: font.sizes.sm, marginBottom: spacing.sm },
  languageSection: { padding: spacing.md },
  langOption: {
    borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm, flex: 1, alignItems: 'center',
  },
  langOptionText: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  langOptions: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.sm },
  name: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  panel: { borderWidth: 1, borderRadius: radii.xxl, overflow: 'hidden' },
  row: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md },
  rowIcon: { fontSize: 16, marginRight: spacing.sm },
  rowLabel: { fontSize: font.sizes.sm },
  rowLeft: { alignItems: 'center', flexDirection: 'row' },
  rowValue: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold, maxWidth: '60%' },
});
