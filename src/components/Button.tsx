import { ReactNode } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  label: string;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: ReactNode;
  onPress: () => void;
};

export function Button({
  icon,
  label,
  loading,
  onPress,
  size = 'md',
  variant = 'primary',
}: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const variantStyles = {
    danger: { bg: colors.dangerBg, border: '#FECDD3', text: colors.dangerText },
    ghost: { bg: 'transparent', border: 'transparent', text: colors.primary },
    primary: { bg: colors.primary, border: 'transparent', text: '#FFFFFF' },
    secondary: { bg: colors.danger, border: 'transparent', text: '#FFFFFF' },
  };

  const v = variantStyles[variant];
  const loaderColor = variant === 'ghost' || variant === 'danger' ? colors.primary : '#FFFFFF';

  return (
    <Pressable
      disabled={loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border },
        size === 'sm' && styles.sm,
        size === 'lg' && styles.lg,
        pressed && styles.pressed,
        loading && styles.disabled,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={loaderColor} />
      ) : (
        <View style={styles.content}>
          {icon}
          <Text style={[styles.label, { color: v.text, writingDirection: isRTL ? 'rtl' : 'ltr' }]}>{label}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
  },
  disabled: {
    opacity: 0.6,
  },
  label: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
  },
  lg: {
    minHeight: 52,
    paddingHorizontal: spacing.xl,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  sm: {
    minHeight: 36,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
});
