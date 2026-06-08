import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Bar = {
  name: string;
  rate: number;
};

type Props = {
  data: Bar[];
  title?: string;
};

export function BarChart({ data, title }: Props) {
  const { colors } = useTheme();
  const maxRate = Math.max(...data.map((d) => d.rate), 1);

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      {title && <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>}
      <View style={styles.chart}>
        {data.map((bar, i) => (
          <View key={i} style={styles.barCol}>
            <View style={styles.barTrack}>
              <View
                style={[
                  styles.barFill,
                  {
                    backgroundColor: colors.primary,
                    height: `${(bar.rate / maxRate) * 100}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.barLabel, { color: colors.textMuted }]} numberOfLines={1}>
              {bar.name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barCol: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.xs,
  },
  barFill: {
    borderRadius: radii.sm,
    bottom: 0,
    left: 0,
    minHeight: 4,
    position: 'absolute',
    right: 0,
  },
  barLabel: {
    fontSize: font.sizes.xs,
    textAlign: 'center',
  },
  barTrack: {
    backgroundColor: '#E5E7EB',
    borderRadius: radii.sm,
    flex: 1,
    position: 'relative',
    width: '60%',
  },
  chart: {
    alignItems: 'flex-end',
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    height: 180,
    justifyContent: 'center',
  },
  container: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    gap: spacing.md,
    padding: spacing.md,
  },
  title: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
  },
});
