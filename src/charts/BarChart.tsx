import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { font, spacing } from '../theme';

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
  const isRtl = true;

  const values = data.map((d) => d.value);
  const minValue = yDomain?.[0] ?? 0;
  const maxValue = yDomain?.[1] ?? Math.max(...values, 1);
  const range = maxValue - minValue;

  const padding = { top: 10, right: 10, bottom: 30, left: yAxisLabel ? 40 : 30 };
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
          const barH = ((d.value - minValue) / range) * plotHeight;
          const x = padding.left + i * (barSize + 12) + (plotWidth - data.length * (barSize + 12)) / 2;
          const y = scaleY(d.value);
          return (
            <G key={d.key}>
              <Rect
                x={x}
                y={y}
                width={barSize}
                height={Math.max(barH, 0)}
                fill={d.color ?? color}
                rx={barRadius}
                ry={barRadius}
              />
              <SvgText
                x={x + barSize / 2}
                y={chartHeight - 6}
                fill={colors.textMuted}
                fontSize={10}
                textAnchor="middle"
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
