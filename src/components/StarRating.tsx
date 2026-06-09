import { StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

type Props = {
  rating?: number;
  maxStars?: number;
  size?: number;
  color?: string;
  emptyColor?: string;
};

const starPath = 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z';

function Star({ filled, size, color, emptyColor }: { filled: boolean; size: number; color: string; emptyColor: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d={starPath} fill={filled ? color : emptyColor} stroke={filled ? color : '#D1D5DB'} strokeWidth={0.5} />
    </Svg>
  );
}

export function StarRating({ rating = 0, maxStars = 5, size = 14, color = '#F59E0B', emptyColor = '#E5E7EB' }: Props) {
  return (
    <View style={styles.row}>
      {Array.from({ length: maxStars }).map((_, i) => (
        <Star key={i} filled={i < Math.round(rating)} size={size} color={color} emptyColor={emptyColor} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 1 },
});
