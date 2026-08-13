import { useState } from 'react';
import {
  Alert,
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { KeyRound, ArrowLeft, MailCheck } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { http, extractErrorMessage } from '../lib/http';
import { ApiResponse } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { font, radii, spacing } from '../theme';

export default function VerificationScreen() {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'Verification'>>();
  const email = route.params?.email ?? '';
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const align = isRTL ? ('right' as const) : ('left' as const);

  async function handleVerify() {
    if (!token.trim()) {
      setError(t('Verification Code') + ' - ' + t('This field is required'));
      return;
    }
    setLoading(true);
    setError('');
    try {
      await http.post<ApiResponse<null>>('/api/user/auth/verify-email', { token: token.trim() });
      navigation.replace('CompleteRegistration', { email, token: token.trim() });
    } catch (verifyError) {
      setError(extractErrorMessage(verifyError));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setError('');
    try {
      await http.post<ApiResponse<null>>('/api/user/auth/request-verification', {});
      Alert.alert(t('Success'), t('Verification code has been resent'));
    } catch (resendError) {
      setError(extractErrorMessage(resendError));
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
                <MailCheck size={28} color={colors.cellPrimary} />
              </View>
            </View>
          </View>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.cellPrimary }]}>
              {t('Registering Account Link Sent')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.cellSecondary }]}>
              {t('We have sent you a link to your email for verifying and complete registering, please check your email and continue.')}
            </Text>
            {email ? (
              <Text style={[styles.emailText, { color: colors.primary }]}>{email}</Text>
            ) : null}
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Verification Code')}
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.statusBorder }]}>
              <KeyRound size={18} color={colors.cellSecondary} />
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                onChangeText={setToken}
                placeholder={t('Enter verification code sent to your email')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.ink, textAlign: align }]}
                value={token}
                editable={!loading}
              />
            </View>

            {error ? (
              <View style={[styles.noticeWrap, { backgroundColor: colors.dangerBg }]}>
                <Text style={[styles.noticeText, { color: colors.dangerText, textAlign: align }]}>{error}</Text>
              </View>
            ) : null}

            <Button label={t('Verify Email')} onPress={handleVerify} loading={loading} size="lg" />

            <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={loading}>
              <Text style={[styles.resendText, { color: colors.primary }]}>{t('Resend Code')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.backLink, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
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
  emailText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
    marginTop: spacing.sm,
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
  resendBtn: {
    alignSelf: 'center',
    paddingVertical: spacing.xs,
  },
  resendText: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
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
