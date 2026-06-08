import { StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Screen } from '../components/Screen';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

export function ProfileScreen() {
  const { logout, user } = useAuth();
  const { colors } = useTheme();

  return (
    <Screen>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatar}>
              {(user?.name || user?.email || 'A').slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <Text style={[styles.name, { color: colors.ink }]}>{user?.name || 'Anmat User'}</Text>
          <Text style={[styles.email, { color: colors.textMuted }]}>{user?.email}</Text>
          <View style={[styles.typeBadge, { backgroundColor: colors.primaryLight }]}>
            <Text style={[styles.typeText, { color: colors.primary }]}>{user?.type || '-'}</Text>
          </View>
        </View>

        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row label="نوع الحساب" value={user?.type || '-'} icon="👤" colors={colors} />
          <Row label="البريد الإلكتروني" value={user?.email || '-'} icon="✉" colors={colors} />
          <Row label="رقم المستخدم" value={user?._id?.slice(-8) || '-'} icon="🔢" colors={colors} />
          <Row label="الخادم" value={API_URL.replace('http://', '').replace('https://', '')} icon="🖥" colors={colors} last />
        </View>

        <Button label="تسجيل خروج" onPress={logout} variant="danger" />
      </View>
    </Screen>
  );
}

function Row({ label, value, icon, colors, last }: { label: string; value: string; icon?: string; colors: ReturnType<typeof useTheme>['colors']; last?: boolean }) {
  return (
    <View style={[styles.row, !last && { borderBottomColor: colors.border, borderBottomWidth: 1 }]}>
      <View style={styles.rowLeft}>
        {icon ? <Text style={styles.rowIcon}>{icon}</Text> : null}
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      </View>
      <Text style={[styles.rowValue, { color: colors.ink }]} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: font.weights.extrabold,
    textAlign: 'center',
  },
  avatarWrap: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 72,
    justifyContent: 'center',
    width: 72,
  },
  container: {
    gap: spacing.lg,
  },
  email: {
    fontSize: font.sizes.sm,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  name: {
    fontSize: font.sizes.xl,
    fontWeight: font.weights.bold,
  },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    overflow: 'hidden',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  rowIcon: {
    fontSize: 16,
    marginRight: spacing.sm,
  },
  rowLabel: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
  },
  rowLeft: {
    alignItems: 'center',
    flexDirection: 'row',
  },
  rowValue: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
    maxWidth: '60%',
    textAlign: 'right',
  },
  typeBadge: {
    borderRadius: radii.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  typeText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
});
