import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  options: { label: string; value: string }[];
  value: string;
  onChange: (value: string) => void;
};

export function SegmentedControl({ options, value, onChange }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  return (
    <View style={[styles.row, { backgroundColor: colors.statusBg, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            style={[styles.seg, active && { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.label, { color: active ? colors.primary : colors.textMuted }]}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  row: { borderRadius: radii.lg, flexDirection: 'row', gap: spacing.xs, padding: spacing.xs },
  seg: { alignItems: 'center', borderRadius: radii.md, borderWidth: 1, borderColor: 'transparent', flex: 1, justifyContent: 'center', paddingVertical: spacing.sm },
});
