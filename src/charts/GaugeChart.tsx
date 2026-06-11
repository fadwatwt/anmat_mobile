import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, spacing } from '../theme';

type FooterItem = { text: string; color?: string };

type Props = {
  percentage?: number;
  label?: string;
  primaryColor?: string;
  secondaryColor?: string;
  footerData?: FooterItem[];
  size?: number;
};

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
  const a = ((angleDeg - 180) * Math.PI) / 180;
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
}

/** Half-circle gauge arc (180deg) from left to right. */
function arcPath(cx: number, cy: number, r: number, startPct: number, endPct: number) {
  const start = polarToCartesian(cx, cy, r, startPct * 180);
  const end = polarToCartesian(cx, cy, r, endPct * 180);
  const largeArc = endPct - startPct > 0.5 ? 1 : 0;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
}

/** Mobile equivalent of web GaugeChart — semicircular progress gauge. */
export function GaugeChart({
  percentage = 0,
  label = 'DELAY',
  primaryColor = '#F59E0B',
  secondaryColor,
  footerData = [],
  size = 200,
}: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const pct = Math.max(0, Math.min(100, percentage));
  const strokeWidth = 20;
  const r = (size - strokeWidth) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const height = size / 2 + strokeWidth;
  const track = secondaryColor || colors.borderLight;

  return (
    <View style={styles.wrapper}>
      <View style={{ width: size, height, alignItems: 'center', justifyContent: 'flex-start' }}>
        <Svg width={size} height={height}>
          <G>
            <Path d={arcPath(cx, cy, r, 0, 1)} stroke={track} strokeWidth={strokeWidth} strokeLinecap="round" fill="none" />
            {pct > 0 && (
              <Path
                d={arcPath(cx, cy, r, 0, pct / 100)}
                stroke={primaryColor}
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                fill="none"
              />
            )}
          </G>
        </Svg>
        <View style={styles.centerLabel}>
          <Text style={[styles.pctText, { color: colors.tableTitle }]}>{pct}%</Text>
          <Text style={[styles.labelText, { color: colors.textMuted }]}>{label}</Text>
        </View>
      </View>

      {footerData.length > 0 && (
        <View style={styles.footer}>
          {footerData.map((item, i) => (
            <View key={i} style={[styles.footerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={[styles.dot, { backgroundColor: item.color || primaryColor }]} />
              <Text style={[styles.footerText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{item.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  centerLabel: { alignItems: 'center', bottom: 4, position: 'absolute' },
  dot: { borderRadius: 4, height: 8, width: 8 },
  footer: { gap: spacing.sm, marginTop: spacing.md, width: '100%' },
  footerRow: { alignItems: 'center', gap: spacing.sm },
  footerText: { flex: 1, fontSize: font.sizes.sm },
  labelText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, letterSpacing: 1 },
  pctText: { fontSize: 32, fontWeight: font.weights.bold },
  wrapper: { alignItems: 'center', width: '100%' },
});
