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
import { Mail, User } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { http } from '../lib/http';
import { extractErrorMessage } from '../lib/http';
import { ApiResponse } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { font, radii, spacing } from '../theme';

export default function RegistrationScreen() {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const align = isRTL ? ('right' as const) : ('left' as const);

  async function handleSubmit() {
    if (!email.trim()) {
      setError(t('Enter your email'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await http.post<ApiResponse<{ verification_token?: string }>>(
        '/api/user/auth/register/subscriber/email',
        { email: email.trim() },
      );
      navigation.navigate('Verification', { email: email.trim() });
    } catch (submitError) {
      setError(extractErrorMessage(submitError));
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
                <User size={28} color={colors.cellPrimary} />
              </View>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.cellPrimary }]}>
              {t('Register Your Email')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.cellSecondary }]}>
              {t('Enter your email for registration.')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Email Address')}
            </Text>
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

            {error ? (
              <View style={[styles.noticeWrap, { backgroundColor: colors.dangerBg }]}>
                <Text style={[styles.noticeText, { color: colors.dangerText, textAlign: align }]}>{error}</Text>
              </View>
            ) : null}

            <Button label={t('Sign Up')} onPress={handleSubmit} loading={loading} size="lg" />

            <View style={[styles.registerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.registerPrompt, { color: colors.cellSecondary }]}>
                {t('Already have an account?')}
              </Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')} disabled={loading}>
                <Text style={[styles.registerLink, { color: colors.primary }]}>{t('Login')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
