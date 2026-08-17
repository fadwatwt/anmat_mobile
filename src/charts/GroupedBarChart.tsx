import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { font, spacing } from '../theme';

type Bar = { key: string; value: number; color: string; label: string };
type Group = { key: string; label: string; bars: Bar[] };

type Props = {
  groups: Group[];
  height?: number;
  barSize?: number;
  barRadius?: number;
  yAxisLabel?: string;
  showGrid?: boolean;
  gridCount?: number;
  /** A7: optional legend items shown as dot+label below chart */
  legendItems?: { label: string; color: string }[];
};

/**
 * Build an SVG path for a rectangle with only the top two corners rounded.
 * A8: matches web `radius={[4, 4, 0, 0]}` (recharts top-only rounded bars).
 */
function topRoundedRect(x: number, y: number, w: number, h: number, rx: number): string {
  if (h <= 0) return '';
  const r = Math.min(rx, w / 2, h / 2);
  return [
    `M ${x + r},${y}`,
    `h ${w - 2 * r}`,
    `a ${r},${r} 0 0 1 ${r},${r}`,
    `v ${h - r}`,
    `h ${-w}`,
    `v ${-(h - r)}`,
    `a ${r},${r} 0 0 1 ${r},${-r}`,
    'z',
  ].join(' ');
}

export function GroupedBarChart({
  groups,
  height = 200,
  barSize = 12,
  barRadius = 4,
  yAxisLabel,
  showGrid = true,
  gridCount = 4,
  legendItems,
}: Props) {
  const { colors } = useTheme();
  const barCount = groups[0]?.bars.length ?? 1;
  const groupWidth = barCount * (barSize + 4) + 8;

  const allValues = groups.flatMap((g) => g.bars.map((b) => b.value));
  const maxValue = Math.max(...allValues, 1);
  const range = maxValue;

  const padding = { top: 10, right: 10, bottom: 30, left: yAxisLabel ? 40 : 30 };
  const plotHeight = height - padding.top - padding.bottom;
  const plotWidth = groups.length * groupWidth;
  const chartWidth = plotWidth + padding.left + padding.right;

  const scaleY = (v: number) => padding.top + plotHeight - (v / range) * plotHeight;

  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const value = (range / gridCount) * i;
    const y = scaleY(value);
    return { value: Math.round(value * 10) / 10, y };
  });

  // Auto-derive legend items from first group's bars if not provided
  const legend = legendItems ?? groups[0]?.bars.map((b) => ({ label: b.label, color: b.color })) ?? [];

  return (
    <View style={styles.wrapper}>
      <Svg width={chartWidth} height={height}>
        {showGrid &&
          gridLines.map((gl, i) => (
            <G key={i}>
              <Line
                x1={padding.left}
                y1={gl.y}
                x2={chartWidth - padding.right}
                y2={gl.y}
                stroke={colors.borderLight}
                strokeWidth={1}
              />
              <SvgText
                x={padding.left - 8}
                y={gl.y + 4}
                fill={colors.textMuted}
                fontSize={10}
                textAnchor="end"
              >
                {gl.value}
              </SvgText>
            </G>
          ))}

        {groups.map((group, gi) => {
          const groupX = padding.left + gi * groupWidth;
          return group.bars.map((bar, bi) => {
            const barH = (bar.value / range) * plotHeight;
            const x = groupX + 4 + bi * (barSize + 4);
            const y = scaleY(bar.value);
            return (
              <G key={`${group.key}-${bar.key}`}>
                {/* A8: top-only rounded corners */}
                <Path
                  d={topRoundedRect(x, y, barSize, Math.max(barH, 0), barRadius)}
                  fill={bar.color}
                />
              </G>
            );
          });
        })}

        {groups.map((group, gi) => {
          const groupX = padding.left + gi * groupWidth;
          return (
            <SvgText
              key={`label-${group.key}`}
              x={groupX + groupWidth / 2}
              y={height - 6}
              fill={colors.textMuted}
              fontSize={10}
              textAnchor="middle"
            >
              {group.label}
            </SvgText>
          );
        })}
      </Svg>

      {/* A7: footer dot + label legend (matches web <Legend iconType="circle" verticalAlign="bottom" />) */}
      {legend.length > 0 && (
        <View style={styles.legend}>
          {legend.map((item, i) => (
            <View key={i} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: item.color }]} />
              <Text style={[styles.legendLabel, { color: colors.textMuted }]}>{item.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
  // A7: footer legend row
  legend: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: spacing.md, marginTop: spacing.sm },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: font.sizes.xs },
});
