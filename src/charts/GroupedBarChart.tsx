import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Line, Text as SvgText, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { font, spacing } from '../theme';

type Group = {
  key: string;
  label: string;
  bars: { key: string; value: number; color: string; label: string }[];
};

type Props = {
  groups: Group[];
  height?: number;
  barSize?: number;
  barRadius?: number;
  yAxisLabel?: string;
  showGrid?: boolean;
  gridCount?: number;
};

export function GroupedBarChart({
  groups,
  height = 200,
  barSize = 12,
  barRadius = 4,
  yAxisLabel,
  showGrid = true,
  gridCount = 4,
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
                <Rect
                  x={x}
                  y={y}
                  width={barSize}
                  height={Math.max(barH, 0)}
                  fill={bar.color}
                  rx={barRadius}
                  ry={barRadius}
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
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { alignItems: 'center' },
});
