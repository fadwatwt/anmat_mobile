import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Plus, Trash2 } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  createMoneyReceivingMethod,
  updateMoneyReceivingMethod,
  fetchMoneyReceivingMethods,
  MoneyReceivingMethod,
  MONEY_RECEIVING_TYPES,
} from '../services/moneyReceiving';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type AttributeEntry = { key: string; value: string; is_secret: boolean };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  method?: MoneyReceivingMethod | null;
};

export function MoneyReceivingModal({ visible, onClose, onSaved, method }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const isEdit = !!method;
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [attributes, setAttributes] = useState<AttributeEntry[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    if (method) {
      setTitle(method.title || '');
      setType(method.type || '');
      setIsDefault(method.is_default ?? false);
      setAttributes(
        (method.attributes || []).map((a) => ({
          key: a.key || '',
          value: a.value || '',
          is_secret: !!a.is_secret,
        })),
      );
    } else {
      setTitle('');
      setType('');
      setIsDefault(false);
      setAttributes([]);
    }
  }, [visible, method]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  const updateAttr = (i: number, key: keyof AttributeEntry, val: string | boolean) =>
    setAttributes((prev) => prev.map((a, idx) => (idx === i ? { ...a, [key]: val } : a)));
  const addAttr = () => setAttributes((prev) => [...prev, { key: '', value: '', is_secret: false }]);
  const removeAttr = (i: number) => setAttributes((prev) => prev.filter((_, idx) => idx !== i));

  const handleSave = async () => {
    if (!title.trim()) { Alert.alert(t('Required'), t('Method name is required.')); return; }
    if (!type) { Alert.alert(t('Required'), t('Method type is required.')); return; }

    const payload = {
      title: title.trim(),
      type,
      is_active: method?.is_active ?? true,
      is_default: isDefault,
      sort_order: method?.sort_order ?? 0,
      attributes: attributes
        .filter((a) => a.key?.trim())
        .map(({ key, value, is_secret }) => ({ key: key.trim(), value: value || '', is_secret: Boolean(is_secret) })),
    };

    setSaving(true);
    try {
      if (isEdit && method) await updateMoneyReceivingMethod(method._id, payload);
      else await createMoneyReceivingMethod(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={isEdit ? t('Edit Money Receiving Method') : t('Add Money Receiving Method')}
      size="full"
    >
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Money Receiving Method Name')} *</Text>
          <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} placeholder={t('Online Payment')} value={title} onChangeText={setTitle} />
        </View>

        <SelectDropdown
          options={MONEY_RECEIVING_TYPES.map((m) => ({ label: t(m.label), value: m.value }))}
          value={type}
          onChange={setType}
          label={t('Type')}
          required
          placeholder={t('Select method type')}
          translateLabels
        />

        <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.label, { color: colors.ink }]}>{t('Set this receiving method as default')}</Text>
            <Text style={[styles.hint, { color: colors.textMuted, textAlign: align }]}>
              {t('It will save your payment method as the default option.')}
            </Text>
          </View>
          <Switch value={isDefault} onValueChange={setIsDefault} trackColor={{ true: colors.primary }} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('Form Fields')}</Text>
          {attributes.map((a, i) => (
            <View key={i} style={[styles.card, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
              <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.label, { color: colors.ink }]}>{t('Attribute')} {i + 1}</Text>
                <TouchableOpacity onPress={() => removeAttr(i)}>
                  <Trash2 size={16} color={colors.danger ?? '#EF4444'} />
                </TouchableOpacity>
              </View>
              <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <View style={{ flex: 1 }}>
                  <Field label={t('Key')} align={align} colors={colors}>
                    <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} value={a.key} onChangeText={(v) => updateAttr(i, 'key', v)} />
                  </Field>
                </View>
                <View style={{ flex: 1 }}>
                  <Field label={t('Value')} align={align} colors={colors}>
                    <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} value={a.value} onChangeText={(v) => updateAttr(i, 'value', v)} />
                  </Field>
                </View>
              </View>
              <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.label, { color: colors.ink }]}>{t('Secret')}</Text>
                <Switch value={a.is_secret} onValueChange={(v) => updateAttr(i, 'is_secret', v)} trackColor={{ true: colors.primary }} />
              </View>
            </View>
          ))}

          <TouchableOpacity onPress={addAttr} style={[styles.addBtn, { borderColor: colors.primary }]}>
            <Plus size={14} color={colors.primary} />
            <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('Add Attribute')}</Text>
          </TouchableOpacity>
        </View>

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
  addBtn: {
    alignItems: 'center',
    borderRadius: radii.lg,
    borderStyle: 'dashed',
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'center',
    marginTop: spacing.xs,
    paddingVertical: spacing.sm,
  },
  addBtnText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.xxl },
  hint: { fontSize: font.sizes.xs, marginTop: 2 },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  row: { gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  switchRow: { alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
});
