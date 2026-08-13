import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MailCheck } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { font, radii, spacing } from '../theme';

export default function ForgotPasswordSentScreen() {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={styles.logoSection}>
          <View style={[styles.logoOuter, { backgroundColor: colors.statusBg }]}>
            <View style={[styles.logoInner, { backgroundColor: colors.surface }]}>
              <MailCheck size={32} color={colors.cellPrimary} />
            </View>
          </View>
        </View>

        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.cellPrimary }]}>
            {t('Reset Password Link Sent')}
          </Text>
          <Text style={[styles.subtitle, { color: colors.cellSecondary }]}>
            {t('We have sent you a reset link to your email, check your email and complete password resetting.')}
          </Text>
        </View>

        <Button
          label={t('Return')}
          onPress={() => navigation.navigate('Login')}
          size="lg"
        />

        <TouchableOpacity
          style={styles.resetLink}
          onPress={() => navigation.navigate('ResetPassword')}
        >
          <Text style={[styles.resetLinkText, { color: colors.primary }]}>
            {t('Reset Password')}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  logoInner: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 56,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 56,
  },
  logoOuter: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 88,
    justifyContent: 'center',
    width: 88,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  resetLink: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingVertical: spacing.xs,
  },
  resetLinkText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
  },
  safe: {
    flex: 1,
  },
  subtitle: {
    fontSize: font.sizes.sm,
    lineHeight: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: font.sizes.xl,
    fontWeight: font.weights.bold,
    textAlign: 'center',
  },
});
