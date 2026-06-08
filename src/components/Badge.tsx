import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { font, radii } from '../theme';

type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

type Props = {
  label: string;
  variant?: BadgeVariant;
  size?: 'sm' | 'md';
};

export function Badge({ label, size = 'sm', variant = 'default' }: Props) {
  const { colors } = useTheme();

  const variantStyles: Record<BadgeVariant, { bg: string; text: string; border: string }> = {
    danger: { bg: colors.dangerBg, border: '#FECDD3', text: colors.dangerText },
    default: { bg: colors.background, border: colors.border, text: colors.textMuted },
    info: { bg: colors.infoBg, border: colors.softBorder, text: colors.infoText },
    success: { bg: colors.successBg, border: '#B9F0D5', text: colors.successText },
    warning: { bg: colors.warningBg, border: '#F4D49B', text: colors.warningText },
  };

  const style = variantStyles[variant];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: style.bg, borderColor: style.border },
        size === 'md' && styles.md,
      ]}
    >
      <Text style={[styles.text, { color: style.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  text: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
    writingDirection: 'rtl',
  },
});
