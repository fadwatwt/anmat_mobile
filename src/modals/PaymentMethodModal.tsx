import React, { useEffect, useState } from 'react';
import {
  Alert,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  PaymentMethod,
  paymentMethodAttr,
  createPaymentMethod,
  updatePaymentMethod,
} from '../services/paymentMethods';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

function detectCardBrand(number: string): string {
  const num = number.replace(/\s/g, '');
  if (/^4/.test(num)) return 'Visa';
  if (/^5[1-5]/.test(num) || /^2[2-7]/.test(num)) return 'Mastercard';
  if (/^3[47]/.test(num)) return 'Amex';
  if (/^6(?:011|5)/.test(num)) return 'Discover';
  return 'Card';
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  paymentMethod?: PaymentMethod | null;
};

export function PaymentMethodModal({ visible, onClose, onSaved, paymentMethod }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const isEdit = !!paymentMethod;

  const [nameOnCard, setNameOnCard] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      const expMonth = paymentMethodAttr(paymentMethod, 'exp_month');
      const expYear = paymentMethodAttr(paymentMethod, 'exp_year');
      setNameOnCard(paymentMethodAttr(paymentMethod, 'name'));
      setCardNumber('');
      setExpirationDate(expMonth && expYear ? `${expYear}-${String(expMonth).padStart(2, '0')}` : '');
      setCvv('');
      setIsDefault(!!paymentMethod?.is_default);
    }
  }, [visible, paymentMethod]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  const handleSave = async () => {
    if (!nameOnCard.trim()) {
      Alert.alert(t('Required'), t('Name on card is required'));
      return;
    }
    if (!isEdit) {
      const num = cardNumber.replace(/\s/g, '');
      if (!/^\d{13,19}$/.test(num)) {
        Alert.alert(t('Invalid card number'), t('Card number must be 13-19 digits'));
        return;
      }
      if (!/^\d{4}-\d{2}$/.test(expirationDate)) {
        Alert.alert(t('Invalid expiration date'), t('Use the format YYYY-MM'));
        return;
      }
    }
    setSaving(true);
    try {
      if (isEdit) {
        const attributes = [{ key: 'name', value: nameOnCard.trim() }];
        const num = cardNumber.replace(/\s/g, '');
        if (/^\d{13,19}$/.test(num)) {
          attributes.push(
            { key: 'last4', value: num.slice(-4) },
            { key: 'brand', value: detectCardBrand(num) },
          );
        }
        if (/^\d{4}-\d{2}$/.test(expirationDate)) {
          const [expYear, expMonth] = expirationDate.split('-');
          attributes.push(
            { key: 'exp_month', value: expMonth },
            { key: 'exp_year', value: expYear },
          );
        }
        await updatePaymentMethod(paymentMethod._id, attributes);
      } else {
        const num = cardNumber.replace(/\s/g, '');
        const [expYear, expMonth] = expirationDate.split('-');
        await createPaymentMethod({
          type: 'CARD',
          is_default: isDefault,
          attributes: [
            { key: 'name', value: nameOnCard.trim() },
            { key: 'last4', value: num.slice(-4) },
            { key: 'brand', value: detectCardBrand(num) },
            { key: 'exp_month', value: expMonth },
            { key: 'exp_year', value: expYear },
          ],
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

  return (
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Payment Method') : t('Add New Payment Method')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Name on Card')}</Text>
          <TextInput
            style={inputStyle}
            placeholder={t('Enter Name on Card...')}
            placeholderTextColor={colors.textMuted}
            value={nameOnCard}
            onChangeText={setNameOnCard}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>
            {isEdit ? t('Card Number') : `${t('Card Number')} *`}
          </Text>
          <TextInput
            style={inputStyle}
            placeholder={isEdit ? t('Optional - leave blank to keep') : t('Enter Card Number...')}
            placeholderTextColor={colors.textMuted}
            value={cardNumber}
            onChangeText={setCardNumber}
            keyboardType="number-pad"
            maxLength={19}
          />
        </View>

        <View style={styles.row}>
          <View style={[styles.field, styles.rowField]}>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>
              {isEdit ? t('Expiration Date') : `${t('Expiration Date')} *`}
            </Text>
            <TextInput
              style={inputStyle}
              placeholder="YYYY-MM"
              placeholderTextColor={colors.textMuted}
              value={expirationDate}
              onChangeText={setExpirationDate}
              maxLength={7}
            />
          </View>
          <View style={[styles.field, styles.rowField]}>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('CVV')}</Text>
            <TextInput
              style={inputStyle}
              placeholder={t('Enter CVV...')}
              placeholderTextColor={colors.textMuted}
              value={cvv}
              onChangeText={setCvv}
              keyboardType="number-pad"
              maxLength={4}
              secureTextEntry
            />
          </View>
        </View>

        {!isEdit && (
          <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Switch
              value={isDefault}
              onValueChange={setIsDefault}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor={isDefault ? '#FFF' : colors.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: colors.ink, textAlign: align }]}>{t('Save this method as default')}</Text>
              <Text style={[styles.switchHint, { color: colors.textMuted, textAlign: align }]}>
                {t('It will save your payment method as the default option.')}
              </Text>
            </View>
          </View>
        )}

        <Button label={saving ? t('Saving...') : t('Save')} onPress={handleSave} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.lg },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },
  switchHint: { fontSize: font.sizes.xs, marginTop: 2 },
  switchRow: { alignItems: 'center', gap: spacing.sm },
});
