import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';

type Props = {
  title: string;
  children: React.ReactNode;
  minHeight?: number;
};

/** Mobile equivalent of web AnalyticsCard — surface card with bold title + body. */
export function AnalyticsCard({ title, children, minHeight = 0 }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }, minHeight ? { minHeight } : null]}>
      <Text style={[styles.title, { color: colors.tableTitle, textAlign: isRTL ? 'right' : 'left' }]}>
        {t(title)}
      </Text>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { flex: 1, gap: spacing.sm },
  card: {
    borderRadius: radii.xxl,
    borderWidth: 1,
    gap: spacing.md,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 2,
  },
  title: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
});
