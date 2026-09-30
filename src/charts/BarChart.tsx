import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Path, Line, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { font } from '../theme';

type BarItem = {
  key: string;
  value: number;
  label: string;
  color?: string;
};

type Props = {
  data: BarItem[];
  height?: number;
  barSize?: number;
  barRadius?: number;
  color?: string;
  yAxisLabel?: string;
  yDomain?: [number, number];
  showGrid?: boolean;
  gridCount?: number;
};

const defaultColor = '#375DFB';

/**
 * Build an SVG path for a rectangle with only the top two corners rounded.
 * A8: matches web `radius={[4, 4, 0, 0]}` (recharts top-only rounded bars).
 */
function topRoundedRect(x: number, y: number, w: number, h: number, rx: number): string {
  if (h <= 0) return '';
  const r = Math.min(rx, w / 2, h / 2);
  // Clockwise from top-left arc start:
  // (x+r, y) → right → arc top-right → down → left bottom (square) → up → arc top-left → close
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

export function BarChart({
  data,
  height = 200,
  barSize = 24,
  barRadius = 6,
  color = defaultColor,
  yAxisLabel,
  yDomain,
  showGrid = true,
  gridCount = 4,
}: Props) {
  const { colors } = useTheme();

  const values = data.map((d) => d.value);
  const minValue = yDomain?.[0] ?? 0;
  const maxValue = yDomain?.[1] ?? Math.max(...values, 1);
  const range = maxValue - minValue;

  const padding = { top: 10, right: 10, bottom: 56, left: yAxisLabel ? 40 : 30 };
  const chartWidth = data.length * (barSize + 12) + padding.left + padding.right;
  const chartHeight = height;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const plotWidth = chartWidth - padding.left - padding.right;

  const scaleY = (v: number) => padding.top + plotHeight - ((v - minValue) / range) * plotHeight;

  const gridLines = Array.from({ length: gridCount + 1 }, (_, i) => {
    const value = minValue + (range / gridCount) * i;
    const y = scaleY(value);
    return { value: Math.round(value * 10) / 10, y };
  });

  return (
    <View style={styles.wrapper}>
      <Svg width={chartWidth} height={chartHeight}>
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

        {data.map((d, i) => {
          const rawBarH = range > 0 ? ((d.value - minValue) / range) * plotHeight : 0;
          const barH = Math.max(rawBarH, 0);
          const x = padding.left + i * (barSize + 12) + (plotWidth - data.length * (barSize + 12)) / 2;
          const y = padding.top + plotHeight - barH;
          // X labels are rotated -45° so adjacent labels never overlap,
          // even with long or Arabic names in narrow slots.
          const labelX = x + barSize / 2 + 3;
          const labelY = chartHeight - 10;
          return (
            <G key={d.key}>
              <Path
                d={topRoundedRect(x, y, barSize, barH, barRadius)}
                fill={d.color ?? color}
              />
              <SvgText
                x={labelX}
                y={labelY}
                fill={colors.textMuted}
                fontSize={10}
                textAnchor="end"
                transform={`rotate(-45 ${labelX} ${labelY})`}
              >
                {d.label}
              </SvgText>
            </G>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
});
