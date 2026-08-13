import { useState } from 'react';
import {
  Image,
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
import { Mail, Lock, Eye, EyeOff, Check } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import type { RootStackParamList } from '../navigation/types';
import { font, radii, spacing } from '../theme';

export default function LoginScreen() {
  const { login } = useAuth();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [secureEntry, setSecureEntry] = useState(true);

  const align = isRTL ? ('right' as const) : ('left' as const);

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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.logoSection}>
            <View style={[styles.logoOuter, { backgroundColor: colors.statusBg }]}>
              <View style={[styles.logoInner, { backgroundColor: colors.surface }]}>
                <Image
                  source={require('../../assets/logo.png')}
                  style={styles.logoImg}
                  resizeMode="contain"
                />
              </View>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.cellPrimary }]}>
              {t('Sign in to your account')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.cellSecondary }]}>
              {t('Enter your credentials to sign in')}
            </Text>
          </View>

          <View style={styles.form}>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.statusBorder }]}>
              <Mail size={18} color={colors.cellSecondary} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                onChangeText={setEmail}
                placeholder={t('Enter your email')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.ink, textAlign: align }]}
                textContentType="emailAddress"
                value={email}
                editable={!loading}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.statusBorder }]}>
              <Lock size={18} color={colors.cellSecondary} />
              <TextInput
                onChangeText={setPassword}
                placeholder={t('Password')}
                placeholderTextColor={colors.textMuted}
                secureTextEntry={secureEntry}
                style={[styles.input, { color: colors.ink, textAlign: align }]}
                textContentType="password"
                value={password}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setSecureEntry(!secureEntry)} style={styles.eyeBtn}>
                {secureEntry ? (
                  <Eye size={18} color={colors.cellSecondary} />
                ) : (
                  <EyeOff size={18} color={colors.cellSecondary} />
                )}
              </TouchableOpacity>
            </View>

            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <TouchableOpacity
                style={[styles.rememberRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => setRememberMe(!rememberMe)}
                disabled={loading}
              >
                <View
                  style={[
                    styles.checkbox,
                    { borderColor: rememberMe ? colors.primary : colors.border, backgroundColor: rememberMe ? colors.primary : 'transparent' },
                  ]}
                >
                  {rememberMe && <Check size={12} color="#FFF" />}
                </View>
                <Text style={[styles.rememberText, { color: colors.cellPrimary }]}>{t('Remember Me')}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.navigate('ForgotPassword')} disabled={loading}>
                <Text style={[styles.link, { color: colors.primary }]}>{t('Forgot Password?')}</Text>
              </TouchableOpacity>
            </View>

            {error ? (
              <View style={[styles.errorWrap, { backgroundColor: colors.dangerBg }]}>
                <Text style={[styles.errorText, { color: colors.dangerText }]}>{error}</Text>
              </View>
            ) : null}

            <Button label={t('Login')} loading={loading} onPress={handleLogin} size="lg" />

            <TouchableOpacity
              style={styles.adminLink}
              onPress={() => navigation.navigate('AdminSignIn')}
              disabled={loading}
            >
              <Text style={[styles.adminLinkText, { color: colors.cellSecondary }]}>
                {t('Admin Sign In')}
              </Text>
            </TouchableOpacity>

            <View style={[styles.registerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.registerPrompt, { color: colors.cellSecondary }]}>
                {t('Not have an account?')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Registration')} disabled={loading}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>{t('Register')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  adminLink: {
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  adminLinkText: {
    fontSize: font.sizes.sm,
    textDecorationLine: 'underline',
  },
  checkbox: {
    alignItems: 'center',
    borderRadius: 4,
    borderWidth: 2,
    height: 18,
    justifyContent: 'center',
    width: 18,
  },
  errorText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
    textAlign: 'center',
  },
  errorWrap: {
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  eyeBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  form: {
    gap: spacing.md,
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
  link: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.medium,
    textDecorationLine: 'underline',
  },
  logoImg: {
    height: 34,
    width: 34,
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
  rememberRow: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  rememberText: {
    fontSize: font.sizes.sm,
  },
  registerLink: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
  },
  registerPrompt: {
    fontSize: font.sizes.sm,
  },
  registerRow: {
    alignItems: 'center',
    gap: spacing.xs,
    justifyContent: 'center',
  },
  row: {
    alignItems: 'center',
    justifyContent: 'space-between',
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
