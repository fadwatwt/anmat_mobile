import { StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  title: string;
  message: string;
  icon?: string;
};

export function EmptyState({ title, message, icon }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
      <Text style={[styles.message, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.xxl,
    gap: spacing.sm,
    padding: spacing.xl,
  },
  icon: {
    fontSize: 40,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: font.sizes.sm,
    textAlign: 'center',
  },
  title: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.bold,
  },
});
