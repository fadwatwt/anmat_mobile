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
import { Mail, Lock, User, Phone } from 'lucide-react-native';
import { Button } from '../components/Button';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { http, extractErrorMessage } from '../lib/http';
import { ApiResponse } from '../types';
import type { RootStackParamList } from '../navigation/types';
import { font, radii, spacing } from '../theme';

export default function CompleteRegistrationScreen() {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const route = useRoute<RouteProp<RootStackParamList, 'CompleteRegistration'>>();
  const email = route.params?.email ?? '';
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const align = isRTL ? ('right' as const) : ('left' as const);

  async function handleSubmit() {
    if (!name.trim()) {
      setError(t('Enter Full Name...'));
      return;
    }
    if (!password || password.length < 8) {
      setError(t('Password must be at least 8 characters'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match'));
      return;
    }

    setLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('email', email);
      formData.append('name', name.trim());
      if (phone.trim()) formData.append('phone', phone.trim());
      formData.append('password', password);
      formData.append('password_confirmation', confirmPassword);

      await http.post<ApiResponse<any>>('/api/user/auth/register/subscriber/account', formData);
      Alert.alert(t('Success'), t('Account registered successfully!'), [
        { text: t('OK'), onPress: () => navigation.navigate('Login') },
      ]);
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
              {t('Set up your account')}
            </Text>
            <Text style={[styles.subtitle, { color: colors.cellSecondary }]}>
              {t('Enter your details to complete registration')}
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Email Address')}
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.statusBg, borderColor: colors.statusBorder }]}>
              <Mail size={18} color={colors.cellSecondary} />
              <TextInput
                autoCapitalize="none"
                keyboardType="email-address"
                editable={false}
                style={[styles.input, { color: colors.textMuted, textAlign: align }]}
                value={email}
              />
            </View>

            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Full Name')} *
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.statusBorder }]}>
              <User size={18} color={colors.cellSecondary} />
              <TextInput
                onChangeText={setName}
                placeholder={t('Enter Full Name...')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.ink, textAlign: align }]}
                value={name}
                editable={!loading}
              />
            </View>

            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Phone Number (Optional)')}
            </Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.surface, borderColor: colors.statusBorder }]}>
              <Phone size={18} color={colors.cellSecondary} />
              <TextInput
                keyboardType="phone-pad"
                onChangeText={setPhone}
                placeholder={t('Enter Phone Number...')}
                placeholderTextColor={colors.textMuted}
                style={[styles.input, { color: colors.ink, textAlign: align }]}
                value={phone}
                editable={!loading}
              />
            </View>

            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Password')} *
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
                editable={!loading}
              />
            </View>

            <Text style={[styles.label, { color: colors.cellPrimary, textAlign: align }]}>
              {t('Confirm Password')} *
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
                editable={!loading}
              />
            </View>

            {error ? (
              <View style={[styles.noticeWrap, { backgroundColor: colors.dangerBg }]}>
                <Text style={[styles.noticeText, { color: colors.dangerText, textAlign: align }]}>{error}</Text>
              </View>
            ) : null}

            <Button label={t('Complete Registration')} onPress={handleSubmit} loading={loading} size="lg" />

            <TouchableOpacity
              style={[styles.backLink, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => navigation.navigate('Login')}
              disabled={loading}
            >
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
