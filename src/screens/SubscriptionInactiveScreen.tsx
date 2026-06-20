import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Lock } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { font, spacing } from '../theme';

// Shown to employees whose organization's subscription has lapsed. They are
// fully blocked until the organization owner (subscriber) renews. Subscribers
// themselves are routed to the Plans screen instead (see RootNavigator).
export default function SubscriptionInactiveScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { logout } = useAuth();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.iconOuter, { backgroundColor: colors.statusBg }]}>
          <View style={[styles.iconInner, { backgroundColor: colors.surface }]}>
            <Lock size={28} color="#ef4444" />
          </View>
        </View>

        <Text style={[styles.title, { color: colors.cellPrimary }]}>
          {t('Subscription Inactive')}
        </Text>
        <Text style={[styles.message, { color: colors.cellSecondary }]}>
          {t(
            "Your organization's subscription has expired. Please contact your organization administrator to renew the subscription and restore access.",
          )}
        </Text>

        <View style={styles.actions}>
          <Button label={t('Sign Out')} onPress={logout} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: {
    alignItems: 'center',
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  iconOuter: {
    alignItems: 'center',
    borderRadius: 999,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  iconInner: {
    alignItems: 'center',
    borderRadius: 999,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  title: {
    fontSize: font.sizes.xl,
    fontWeight: '600',
    textAlign: 'center',
  },
  message: {
    fontSize: font.sizes.sm,
    lineHeight: 22,
    textAlign: 'center',
  },
  actions: {
    marginTop: spacing.md,
    width: '100%',
  },
});
