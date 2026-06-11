import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '../components/Button';
import { API_URL } from '../config/api';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);

  async function handleLogin() {
    if (!email.trim() || !password) {
      setError(t('Enter email and password'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      await login(email, password);
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : t('Login failed'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboard}
      >
        <View style={styles.container}>
          <View style={styles.logoSection}>
            <View style={[styles.logoOuter, { backgroundColor: colors.background }]}>
              <View style={[styles.logoInner, { backgroundColor: colors.surface }]}>
                <Text style={[styles.logoText, { color: colors.primary }]}>A</Text>
              </View>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textCell }]}>{t('Sign In')}</Text>
            <Text style={[styles.subtitle, { color: colors.textMuted }]}>{t('Enter your details to access your account')}</Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.inputIcon}>✉</Text>
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder={t('Email')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}
                textContentType="emailAddress"
                value={email}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                onChangeText={setPassword}
                placeholder={t('Password')}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={secureEntry}
                style={[styles.input, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}
                textContentType="password"
                value={password}
              />
              <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)} style={styles.eyeBtn}>
                <Text style={[styles.eyeText, { color: colors.primary }]}>{secureEntry ? t('Show') : t('Hide')}</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={[styles.errorWrap, { backgroundColor: colors.dangerBg, borderColor: '#FECDD3' }]}>
                <Text style={[styles.errorText, { color: colors.dangerText }]}>⚠ {error}</Text>
              </View>
            ) : null}

            <Button label={t('Login')} loading={loading} onPress={handleLogin} size="lg" />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textMuted }]}>Anmat - {t('Organization Management System')}</Text>
            <Text style={[styles.footerApi, { color: colors.textMuted }]}>{API_URL}</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
    textAlign: 'center',
  },
  errorWrap: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  eyeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  eyeText: {
    fontSize: font.sizes.xs,
    fontWeight: font.weights.semibold,
  },
  footer: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  footerApi: {
    fontSize: font.sizes.xs,
  },
  footerText: {
    fontSize: font.sizes.sm,
  },
  form: {
    gap: spacing.md,
  },
  header: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  input: {
    backgroundColor: 'transparent',
    flex: 1,
    fontSize: font.sizes.base,
    minHeight: 48,
    paddingHorizontal: spacing.sm,
  },
  inputIcon: {
    fontSize: 16,
    paddingHorizontal: spacing.sm,
  },
  inputWrap: {
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    flexDirection: 'row',
  },
  keyboard: {
    flex: 1,
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
  },
  logoText: {
    fontSize: 28,
    fontWeight: font.weights.extrabold,
  },
  safe: {
    flex: 1,
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
