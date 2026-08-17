import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { G, Circle } from 'react-native-svg';
import { useTranslation } from 'react-i18next';
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

export function DonutChart({
  data,
  total: totalProp,
  size = 160,
  strokeWidth = 28,
  subtitle = '',
  centerLabel,
}: Props) {
  const { t } = useTranslation();
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
      {/* Chart ring */}
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

        {/* Center: subtitle (A5 — label context above total) then total value */}
        <View style={styles.centerLabel}>
          {subtitle ? (
            <Text style={[styles.subtitleText, { color: colors.textMuted }]}>
              {subtitle}
            </Text>
          ) : null}
          <Text style={[styles.totalText, { color: colors.ink }]}>
            {centerLabel ?? total}
          </Text>
        </View>
      </View>

      {/* Legend — A4: column layout (dot+label row, then bold value below) */}
      <View style={styles.legend}>
        {data.map((slice) => (
          <View key={slice.key} style={styles.legendItem}>
            <View style={styles.legendTopRow}>
              <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
              {/* A6 — translate label via i18n */}
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>
                {t(slice.label)}
              </Text>
            </View>
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
  // A5: subtitle (xs, muted) sits above the big number
  subtitleText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, letterSpacing: 1, textTransform: 'uppercase' },
  totalText: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold },
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, paddingHorizontal: spacing.sm },
  // A4: each legend item is a column — dot+label on top row, value below
  legendItem: { alignItems: 'center', gap: 2 },
  legendTopRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: font.sizes.xs },
  // A4: value is bolder and slightly larger than label
  legendValue: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});
