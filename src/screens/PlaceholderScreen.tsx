import { StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  title: string;
  icon?: string;
};

export default function PlaceholderScreen({ title, icon }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();

  return (
    <View style={[styles.container]}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={styles.icon}>{icon || '🚧'}</Text>
        <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>هذه الصفحة قيد التطوير</Text>
        <Text style={[styles.userType, { color: colors.textMuted }]}>نوع المستخدم: {user?.type}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', borderWidth: 1, borderRadius: radii.xxl, gap: spacing.md, padding: spacing.xl },
  container: { alignItems: 'center', flex: 1, justifyContent: 'center', padding: spacing.md },
  icon: { fontSize: 48 },
  subtitle: { fontSize: font.sizes.sm, textAlign: 'center' },
  title: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  userType: { fontSize: font.sizes.xs },
});
