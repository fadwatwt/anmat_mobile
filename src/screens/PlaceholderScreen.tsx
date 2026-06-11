import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';

type Props = {
  titleKey?: string;
  title?: string;
  icon?: string;
};

export default function PlaceholderScreen({ titleKey, title, icon }: Props) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const displayTitle = titleKey ? t(titleKey) : title || '';

  return (
    <View style={[styles.container]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.icon}>{icon || '🚧'}</Text>
        <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{displayTitle}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('This page is under development')}</Text>
        <Text style={[styles.userType, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('User type: ')}{user?.type}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderWidth: 1, borderRadius: radii.xxl, gap: spacing.md, padding: spacing.xl },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.md },
  icon: { fontSize: 48 },
  subtitle: { fontSize: font.sizes.sm, textAlign: 'center' },
  title: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  userType: { fontSize: font.sizes.xs },
});
