import React, { useEffect, useState } from 'react';
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
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  createTwitterAccount,
  updateTwitterAccount,
  fetchAccountCategories,
  AccountCategory,
  TwitterAccount,
} from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  account?: TwitterAccount | null;
};

export function TwitterAccountModal({ visible, onClose, onSaved, account }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const isEdit = !!account;
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [location, setLocation] = useState('');
  const [secretKey, setSecretKey] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetchAccountCategories().then(setCategories).catch(() => setCategories([]));
    if (account) {
      setName(account.AccountDataInfo1?.FullName || account.name || '');
      setLocation(account.location || account.AccountBasicInfo?.Location || '');
      setSecretKey(account.AccountBasicInfo?.SecretKey || '');
      setDescription(account.Description || '');
      setCategoryId(account.Category?._id || '');
      setPassword(''); setEmail(''); setPhone('');
    } else {
      setName(''); setPassword(''); setEmail(''); setPhone('');
      setLocation(''); setSecretKey(''); setDescription(''); setCategoryId('');
    }
  }, [visible, account]);

  const handleSave = async () => {
    if (!isEdit && (!name.trim() || !password)) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    if (!isEdit && !categoryId) {
      Alert.alert(t('Required'), t('Please select a category'));
      return;
    }
    setSaving(true);
    try {
      if (isEdit && account) {
        await updateTwitterAccount(account._id, {
          name: name.trim() || undefined,
          location: location.trim() || undefined,
          Category: categoryId || undefined,
          description: description.trim() || undefined,
          SecretKey: secretKey.replace(/\s/g, '').toUpperCase() || undefined,
        });
      } else {
        await createTwitterAccount({
          name: name.trim(),
          password,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          location: location.trim() || undefined,
          Category: categoryId,
          Description: description.trim() || undefined,
          SecretKey: secretKey.replace(/\s/g, '').toUpperCase() || undefined,
        });
      }
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEdit ? t('Edit Twitter Account') : t('Add Twitter Account')}
      size="lg"
    >
      <View style={styles.form}>
            <Field label={isEdit ? t('Display Name') : t('Account Name')} align={align} colors={colors}>
              <TextInput style={inputStyle} autoCapitalize="none" placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
            </Field>

            {!isEdit && (
              <>
                <Field label={t('Account Password')} align={align} colors={colors}>
                  <TextInput style={inputStyle} secureTextEntry placeholderTextColor={colors.textMuted} value={password} onChangeText={setPassword} />
                </Field>
                <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <Field label={t('Email')} align={align} colors={colors}>
                      <TextInput style={inputStyle} autoCapitalize="none" keyboardType="email-address" placeholderTextColor={colors.textMuted} value={email} onChangeText={setEmail} />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label={t('Phone')} align={align} colors={colors}>
                      <TextInput style={inputStyle} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} value={phone} onChangeText={setPhone} />
                    </Field>
                  </View>
                </View>
              </>
            )}

            {/* Category selector */}
            <Field label={t('Category')} align={align} colors={colors}>
              <SelectDropdown
                options={categories.map(c => ({ label: c.name, value: c._id }))}
                value={categoryId}
                onChange={setCategoryId}
                placeholder={categories.length === 0 ? t('No categories') : t('Select category...')}
              />
            </Field>

            <Field label={t('Proxy/Location')} align={align} colors={colors}>
              <TextInput style={inputStyle} autoCapitalize="none" placeholder="ip:port" placeholderTextColor={colors.textMuted} value={location} onChangeText={setLocation} />
            </Field>

            <Field label={t('2FA Secret Key')} align={align} colors={colors}>
              <TextInput style={inputStyle} autoCapitalize="characters" placeholderTextColor={colors.textMuted} value={secretKey} onChangeText={setSecretKey} />
            </Field>

            <Field label={t('Description')} align={align} colors={colors}>
              <TextInput
                style={[inputStyle, styles.multiline]}
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
              />
            </Field>

            <Button label={t('Save')} onPress={handleSave} loading={saving} />
      </View>
    </Modal>
  );
}

function Field({
  label,
  align,
  colors,
  children,
}: {
  label: string;
  align: 'left' | 'right';
  colors: Record<string, string>;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  chips: { flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 64, paddingTop: spacing.sm, textAlignVertical: 'top' },
  row: { gap: spacing.sm },
});
