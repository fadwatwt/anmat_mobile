import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Slice = {
  title: string;
  value: number;
  color: string;
};

type Props = {
  data: Slice[];
  total: number;
  centerTitle: string;
};

export function DoughnutChart({ data, total, centerTitle }: Props) {
  const { colors } = useTheme();

  const totalValue = data.reduce((s, d) => s + d.value, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={styles.chartRow}>
        <View style={styles.donut}>
          <View style={[styles.donutOuter, { borderColor: colors.border }]}>
            {data.map((slice, i) => {
              const pct = totalValue > 0 ? (slice.value / totalValue) * 100 : 0;
              const size = 120;
              const borderW = 14;
              const dashArray = size * Math.PI;
              const dashOffset = dashArray - (dashArray * pct) / 100;
              return (
                <View key={i} style={[styles.donutRing, { borderColor: slice.color, width: size, height: size, borderRadius: size / 2, borderWidth: borderW }]} />
              );
            })}
          </View>
          <View style={[styles.donutCenter, { backgroundColor: colors.surface }]}>
            <Text style={[styles.centerValue, { color: colors.ink }]}>{total}</Text>
            <Text style={[styles.centerLabel, { color: colors.textMuted }]}>{centerTitle}</Text>
          </View>
        </View>

        <View style={styles.legend}>
          {data.map((slice, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: slice.color }]} />
              <View style={styles.legendTextWrap}>
                <Text style={[styles.legendTitle, { color: colors.ink }]} numberOfLines={1}>{slice.title}</Text>
                <Text style={[styles.legendValue, { color: colors.textMuted }]}>{slice.value}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  container: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
  },
  donut: {
    alignItems: 'center',
    height: 120,
    justifyContent: 'center',
    width: 120,
  },
  donutCenter: {
    alignItems: 'center',
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    position: 'absolute',
    width: 80,
  },
  centerValue: {
    fontSize: font.sizes.xl,
    fontWeight: font.weights.bold,
  },
  centerLabel: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.medium,
  },
  donutOuter: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 65,
    height: 130,
    justifyContent: 'center',
    width: 130,
  },
  donutRing: {
    borderColor: '#375DFB',
    position: 'absolute',
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  legend: {
    flex: 1,
    gap: spacing.sm,
    marginLeft: spacing.lg,
  },
  legendItem: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  legendTextWrap: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  legendTitle: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
  },
  legendValue: {
    fontSize: font.sizes.sm,
  },
});
