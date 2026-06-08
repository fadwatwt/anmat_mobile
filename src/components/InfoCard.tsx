import { StyleSheet, Text, View } from 'react-native';
import { SvgProps } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  title: string;
  value: string;
  icon?: React.FC<SvgProps>;
  tone?: 'default' | 'soft' | 'warning' | 'danger' | 'info';
};

export function InfoCard({ title, value, icon: Icon, tone = 'default' }: Props) {
  const { colors } = useTheme();

  const toneStyles = {
    danger: { bg: colors.dangerBg, border: '#FECDD3', text: colors.danger },
    default: { bg: colors.surface, border: colors.border, text: colors.primary },
    info: { bg: colors.infoBg, border: colors.softBorder, text: colors.info },
    soft: { bg: colors.soft, border: colors.softBorder, text: colors.primary },
    warning: { bg: colors.warningBg, border: '#F4D49B', text: colors.warning },
  };

  const t = toneStyles[tone];

  return (
    <View style={[styles.card, { backgroundColor: t.bg, borderColor: t.border }]}>
      <View style={styles.top}>
        <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
        {Icon ? (
          <View style={[styles.iconWrap, { backgroundColor: t.text + '18' }]}>
            <Icon width={18} height={18} color={t.text} />
          </View>
        ) : null}
      </View>
      <Text style={[styles.value, { color: t.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    flex: 1,
    gap: spacing.sm,
    minHeight: 100,
    padding: spacing.md,
  },
  iconWrap: {
    alignItems: 'center',
    borderRadius: radii.lg,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  title: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
  },
  top: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  value: {
    fontSize: font.sizes.xl,
    fontWeight: font.weights.bold,
  },
});
