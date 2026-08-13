import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Lock, ArrowLeft, UserCog } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { font, radii, spacing } from '../theme';

export default function ResetPasswordScreen() {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [notice, setNotice] = useState('');

  const align = isRTL ? ('right' as const) : ('left' as const);

  function handleSubmit() {
    if (!password || password.length < 8) {
      setNotice(t('Password must be at least 8 characters'));
      return;
    }
    if (password !== confirmPassword) {
      setNotice(t('Passwords do not match'));
      return;
    }
    // The backend does not expose a password-reset endpoint yet; surface a
    // clear message instead of failing silently (matches the web page, which
    // currently has no functional reset either).
    setNotice(
      t('Password reset is not available yet. Please contact your administrator to reset your password.'),
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={[styles.logoOuter, { backgroundColor: colors.statusBg }]}>
              <View style={[styles.logoInner, { backgroundColor: colors.surface }]}>
                <UserCog size={28} color={colors.cellPrimary} />
              </View>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.cellPrimary }]}>
              {t('Reset Password')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.cellSecondary }]}>
              {t('Enter your new password')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('New Password')}
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.statusBorder }]}>
              <Lock size={18} color={colors.cellSecondary} />
              <TextInput
                secureTextEntry
                onChangeText={setPassword}
                placeholder="*"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.ink, textAlign: align }]}
                value={password}
              />
            </View>

            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Confirm New Password')}
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.statusBorder }]}>
              <Lock size={18} color={colors.cellSecondary} />
              <TextInput
                secureTextEntry
                onChangeText={setConfirmPassword}
                placeholder="*"
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.ink, textAlign: align }]}
                value={confirmPassword}
              />
            </View>

            {notice ? (
              <View style={[styles.noticeWrap, { backgroundColor: colors.infoBg }]}>
                <Text style={[styles.noticeText, { color: colors.infoText, textAlign: align }]}>{notice}</Text>
              </View>
            ) : null}

            <Button label={t('Reset')} onPress={handleSubmit} size="lg" />

            <TouchableOpacity
              style={[styles.backLink, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => navigation.navigate('Login')}
            >
              <ArrowLeft size={16} color={colors.primary} />
              <Text style={[styles.backLinkText, { color: colors.primary }]}>{t('Return to login')}</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backLink: {
    alignItems: 'center',
    alignSelf: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  backLinkText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
  },
  form: {
    gap: spacing.sm,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: 'transparent',
    flex: 1,
    fontSize: font.sizes.base,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  inputWrap: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  keyboard: {
    flex: 1,
  },
  label: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
  },
  logoInner: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 48,
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    width: 48,
  },
  logoOuter: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 80,
    justifyContent: 'center',
    width: 80,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  noticeText: {
    fontSize: font.sizes.sm,
  },
  noticeWrap: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  safe: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xl,
  },
  subtitle: {
    fontSize: font.sizes.sm,
    textAlign: 'center',
  },
  title: {
    fontSize: font.sizes.xl,
    fontWeight: font.weights.bold,
    textAlign: 'center',
  },
});
