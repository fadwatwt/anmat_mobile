import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { font, spacing } from '../theme';

type Props = {
  title: string;
  value: number;
  onChange: (value: number) => void;
  maxStars?: number;
};

const starPath = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function Star({ filled, size, color, emptyColor }: { filled: boolean; size: number; color: string; emptyColor: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={starPath} fill={filled ? color : emptyColor} stroke={filled ? color : '#D1D5DB'} strokeWidth={0.5} />
    </Svg>
  );
}

export function StarRatingInput({ title, value, onChange, maxStars = 5 }: Props) {
  const { colors } = useTheme();
  const starColor = '#F59E0B';
  const emptyColor = '#E5E7EB';

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
      <View style={styles.stars}>
        {Array.from({ length: maxStars }).map((_, i) => (
          <Pressable key={i} onPress={() => onChange(i + 1)} hitSlop={8}>
            <Star filled={i < value} size={28} color={starColor} emptyColor={emptyColor} />
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.xs },
  stars: { flexDirection: 'row', gap: 2 },
  title: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
