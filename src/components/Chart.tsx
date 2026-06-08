import React from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type DataPoint = { x: number; y: number };

type Props = {
  data: DataPoint[];
  color?: string;
  height?: number;
  showGrid?: boolean;
  labelFormatter?: (value: number) => string;
};

const { width } = Dimensions.get('window');

export function LineChartComponent({
  data,
  color,
  height = 200,
}: Props) {
  const { colors } = useTheme();
  const lineColor = color || colors.primary;

  if (!data.length) {
    return (
      <View style={styles.empty}>
        <Text style={[styles.emptyText, { color: colors.textMuted }]}>لا توجد بيانات للعرض</Text>
      </View>
    );
  }

  const yMax = Math.max(...data.map((d) => d.y)) * 1.1;
  const yMin = Math.min(...data.map((d) => d.y)) * 0.9;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, height }]}>
      <Text style={[styles.label, { color: colors.textMuted }]}>أقصى قيمة: {Math.round(yMax)}</Text>
      <Text style={[styles.label, { color: colors.textMuted }]}>أقل قيمة: {Math.round(yMin)}</Text>
      <View style={[styles.chartPlaceholder, { backgroundColor: colors.background }]}>
        <Text style={[styles.placeholderText, { color: colors.textMuted }]}>رسم بياني - يحتاج react-native-svg-charts</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  chartPlaceholder: { alignItems: 'center', borderRadius: radii.md, flex: 1, justifyContent: 'center' },
  container: { borderRadius: radii.xl, padding: spacing.md },
  empty: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: font.sizes.sm },
  label: { fontSize: font.sizes.xs, marginBottom: spacing.xs },
  placeholderText: { fontSize: font.sizes.sm },
});
