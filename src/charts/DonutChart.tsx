import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { spacing, font } from '../theme';

type Slice = {
  key: string;
  value: number;
  color: string;
  label: string;
};

type Props = {
  data: Slice[];
  total?: number;
  size?: number;
  strokeWidth?: number;
  subtitle?: string;
  centerLabel?: string;
};

const defaultColors = [
  '#375DFB', '#38C793', '#F17B2C', '#DF1C41', '#7E3AF2',
  '#FBBC05', '#0F9D58', '#4285F4', '#DB4437', '#673AB7',
];

export function DonutChart({
  data,
  total: totalProp,
  size = 160,
  strokeWidth = 28,
  subtitle = '',
  centerLabel,
}: Props) {
  const { colors } = useTheme();
  const total = totalProp ?? data.reduce((sum, s) => sum + s.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const half = size / 2;

  let offset = 0;
  const segments = data.map((slice) => {
    const segment = circumference * (slice.value / total);
    const dasharray = `${segment} ${circumference - segment}`;
    const dashoffset = -offset;
    offset += segment;
    return { ...slice, dasharray, dashoffset };
  });

  return (
    <View style={styles.wrapper}>
      <View style={[styles.chartContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          <G rotation="-90" origin={`${half}, ${half}`}>
            <Circle
              cx={half}
              cy={half}
              r={radius}
              stroke={colors.borderLight}
              strokeWidth={strokeWidth}
              fill="none"
            />
            {segments.map((s) => (
              <Circle
                key={s.key}
                cx={half}
                cy={half}
                r={radius}
                stroke={s.color}
                strokeWidth={strokeWidth}
                fill="none"
                strokeDasharray={s.dasharray}
                strokeDashoffset={s.dashoffset}
                strokeLinecap="butt"
              />
            ))}
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.totalText, { color: colors.ink }]}>
            {centerLabel ?? total}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitleText, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.legend}>
        {data.map((slice) => (
          <View key={slice.key} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
            <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
              {slice.label}
            </Text>
            <Text style={[styles.legendValue, { color: colors.ink }]}>
              {slice.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center', gap: spacing.md },
  chartContainer: { position: 'relative', justifyContent: 'center', alignItems: 'center' },
  centerLabel: { position: 'absolute', alignItems: 'center' },
  totalText: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold },
  subtitleText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginTop: -2 },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.sm, paddingHorizontal: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: font.sizes.xs },
  legendValue: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
});
