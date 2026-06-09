import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

export function RequestsScreen() {
  const { user } = useAuth();
  const { colors } = useTheme();
  const isSubscriber = user?.type === 'Subscriber';

  return (
    <View style={styles.container}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.icon}>📝</Text>
        <Text style={[styles.title, { color: colors.ink }]}>الطلبات</Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          إدارة طلبات الموظفين (إجازة، سلفة، تأخير...)
        </Text>
        <Text style={[styles.comingSoon, { color: colors.ink }]}>قيد التطوير - سيتم إضافة:</Text>
        <View style={styles.features}>
          <Text style={[styles.feature, { color: colors.textMuted }]}>• عرض جميع الطلبات (إجازة، سلفة راتب، تأخير عمل)</Text>
          <Text style={[styles.feature, { color: colors.textMuted }]}>• مراجعة والموافقة/رفض الطلبات</Text>
          <Text style={[styles.feature, { color: colors.textMuted }]}>• فلترة حسب النوع/الحالة/الموظف</Text>
          <Text style={[styles.feature, { color: colors.textMuted }]}>• إضافة ملاحظات على الطلب</Text>
        </View>
        {isSubscriber && (
          <Text style={[styles.note, { color: colors.primary }]}>متاح للـ Subscriber فقط</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: spacing.md },
  card: { borderRadius: radii.xl, padding: spacing.xl, alignItems: 'center', gap: spacing.md },
  icon: { fontSize: 48 },
  title: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  description: { fontSize: font.sizes.base, textAlign: 'center' },
  comingSoon: { fontSize: font.sizes.base, fontWeight: font.weights.semibold, marginTop: spacing.md },
  features: { gap: spacing.xs, marginTop: spacing.sm },
  feature: { fontSize: font.sizes.sm, textAlign: 'center' },
  note: { fontSize: font.sizes.sm, marginTop: spacing.md },
});
