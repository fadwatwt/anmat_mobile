import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { EmployeePicker } from '../components/EmployeePicker';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createOrgSalaryTransaction, CreateSalaryPayload } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  /** Pre-fills employee when opened from EmployeeDetail */
  presetEmployeeId?: string;
};

export function AddSalaryModal({ visible, onClose, onSaved, presetEmployeeId }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [employeeId, setEmployeeId] = useState('');
  const [amount, setAmount] = useState('');
  const [bonus, setBonus] = useState('0');
  const [discount, setDiscount] = useState('0');
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setAmount(''); setBonus('0'); setDiscount('0'); setComment('');
    setEmployeeId(presetEmployeeId || '');
  }, [visible, presetEmployeeId]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  const handleSave = async () => {
    if (!employeeId) { Alert.alert(t('Required'), t('Please select an employee')); return; }
    const amountNum = parseFloat(amount);
    if (!amount || isNaN(amountNum) || amountNum < 0) {
      Alert.alert(t('Required'), t('Salary Amount') + ' ' + t('is required'));
      return;
    }

    const payload: CreateSalaryPayload = {
      employee_id: employeeId,
      amount: amountNum,
      bonus: parseFloat(bonus) || 0,
      discount: parseFloat(discount) || 0,
      comment: comment.trim() || undefined,
    };
    setSaving(true);
    try {
      await createOrgSalaryTransaction(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Add an employee salary transaction')} size="md">
      {!presetEmployeeId && (
        <EmployeePicker
          value={employeeId}
          onChange={(id) => setEmployeeId(id)}
          label={t('Employee')}
          required
        />
      )}

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Salary Amount')} *</Text>
        <TextInput style={inputStyle} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} value={amount} onChangeText={setAmount} />
      </View>

      <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { color: '#10B981', textAlign: align }]}>{t('Bonus Amount')}</Text>
          <TextInput style={inputStyle} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} value={bonus} onChangeText={setBonus} />
        </View>
        <View style={[styles.field, { flex: 1 }]}>
          <Text style={[styles.label, { color: '#EF4444', textAlign: align }]}>{t('Discount Amount')}</Text>
          <TextInput style={inputStyle} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.textMuted} value={discount} onChangeText={setDiscount} />
        </View>
      </View>

      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Comment')}</Text>
        <TextInput
          style={[inputStyle, styles.multiline]}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          placeholder={t('Comment')}
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
        />
      </View>

      <Button label={t('Save')} onPress={handleSave} loading={saving} />
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 80, paddingTop: spacing.sm },
  row: { gap: spacing.sm },
});
