import React, { useEffect, useRef } from 'react';
import { Animated, DimensionValue, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { radii } from '../theme';

type Props = {
  width?: DimensionValue;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

/** Lightweight pulsing placeholder — no extra deps, theme-aware. */
export function Skeleton({ width = '100%', height = 16, borderRadius = radii.md, style }: Props) {
  const { colors } = useTheme();
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius, backgroundColor: colors.border, opacity },
        style,
      ]}
    />
  );
}

export function SummaryCardsSkeleton({ count = 4 }: { count?: number }) {
  const { colors } = useTheme();
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Animated.View
          key={i}
          style={{
            width: '48%',
            borderRadius: radii.xxl,
            borderWidth: 1,
            borderColor: colors.border,
            backgroundColor: colors.surface,
            padding: 12,
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Skeleton width={44} height={44} borderRadius={16} />
          <Skeleton width="55%" height={14} />
        </Animated.View>
      ))}
    </>
  );
}
