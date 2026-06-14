import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Plus, Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  createTokenPackage,
  updateTokenPackage,
  TokenPackage,
} from '../services/plans';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  pkg?: TokenPackage | null;
};

export function CreateTokenPackageModal({ visible, onClose, onSaved, pkg }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priceCents, setPriceCents] = useState('');
  const [priceLabel, setPriceLabel] = useState('');
  const [tokens, setTokens] = useState('');
  const [sortOrder, setSortOrder] = useState('0');
  const [features, setFeatures] = useState<string[]>(['']);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);

  const isEdit = !!pkg;

  useEffect(() => {
    if (visible) {
      if (pkg) {
        setName(pkg.name || '');
        setDescription(pkg.description || '');
        setPriceCents(pkg.price_cents != null ? String(pkg.price_cents) : '');
        setPriceLabel(pkg.price_label || '');
        setTokens(pkg.tokens != null ? String(pkg.tokens) : '');
        setSortOrder(pkg.sort_order != null ? String(pkg.sort_order) : '0');
        setFeatures(pkg.features?.length ? pkg.features : ['']);
        setIsActive(pkg.is_active ?? true);
      } else {
        setName(''); setDescription(''); setPriceCents(''); setPriceLabel('');
        setTokens(''); setSortOrder('0'); setFeatures(['']); setIsActive(true);
      }
    }
  }, [visible, pkg]);

  const handlePriceCentsChange = (val: string) => {
    setPriceCents(val);
    const cents = parseInt(val, 10);
    if (!isNaN(cents)) setPriceLabel(`$${(cents / 100).toFixed(2)}`);
  };

  const addFeature = () => setFeatures((prev) => [...prev, '']);
  const removeFeature = (i: number) => setFeatures((prev) => prev.filter((_, idx) => idx !== i));
  const updateFeature = (i: number, val: string) =>
    setFeatures((prev) => prev.map((f, idx) => (idx === i ? val : f)));

  const handleSave = async () => {
    if (!name.trim() || !priceCents || !tokens) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    const pc = parseInt(priceCents, 10);
    const tk = parseInt(tokens, 10);
    if (isNaN(pc) || pc < 1 || isNaN(tk) || tk < 1) {
      Alert.alert(t('Error'), t('Invalid number'));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || undefined,
        price_cents: pc,
        price_label: priceLabel || `$${(pc / 100).toFixed(2)}`,
        tokens: tk,
        sort_order: parseInt(sortOrder, 10) || 0,
        features: features.map((f) => f.trim()).filter(Boolean),
        is_active: isActive,
      };
      if (isEdit && pkg) await updateTokenPackage(pkg._id, payload);
      else await createTokenPackage(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
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
      title={isEdit ? t('Edit Token Package') : t('Add Token Package')}
      size="lg"
    >
      <View style={styles.form}>
            {/* Name */}
            <Field label={t('Package Name')} align={align} colors={colors}>
              <TextInput
                style={inputStyle}
                placeholderTextColor={colors.textMuted}
                placeholder={t('Enter name')}
                value={name}
                onChangeText={setName}
              />
            </Field>

            {/* Description */}
            <Field label={t('Description')} align={align} colors={colors}>
              <TextInput
                style={[inputStyle, styles.multiline]}
                placeholderTextColor={colors.textMuted}
                placeholder={t('Optional')}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={2}
              />
            </Field>

            {/* Price (cents) + label */}
            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Field label={t('Price (cents)')} align={align} colors={colors}>
                  <TextInput
                    style={inputStyle}
                    placeholderTextColor={colors.textMuted}
                    placeholder="500"
                    value={priceCents}
                    onChangeText={handlePriceCentsChange}
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t('Price Label')} align={align} colors={colors}>
                  <TextInput
                    style={inputStyle}
                    placeholderTextColor={colors.textMuted}
                    placeholder="$5.00"
                    value={priceLabel}
                    onChangeText={setPriceLabel}
                  />
                </Field>
              </View>
            </View>

            {/* Tokens + Sort Order */}
            <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Field label={t('Tokens')} align={align} colors={colors}>
                  <TextInput
                    style={inputStyle}
                    placeholderTextColor={colors.textMuted}
                    placeholder="1000"
                    value={tokens}
                    onChangeText={setTokens}
                    keyboardType="numeric"
                  />
                </Field>
              </View>
              <View style={{ flex: 1 }}>
                <Field label={t('Sort Order')} align={align} colors={colors}>
                  <TextInput
                    style={inputStyle}
                    placeholderTextColor={colors.textMuted}
                    placeholder="0"
                    value={sortOrder}
                    onChangeText={setSortOrder}
                    keyboardType="numeric"
                  />
                </Field>
              </View>
            </View>

            {/* Features */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Features')}</Text>
              {features.map((f, i) => (
                <View key={i} style={[styles.featureRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <TextInput
                    style={[inputStyle, { flex: 1 }]}
                    placeholderTextColor={colors.textMuted}
                    placeholder={`${t('Feature')} ${i + 1}`}
                    value={f}
                    onChangeText={(v) => updateFeature(i, v)}
                  />
                  <TouchableOpacity onPress={() => removeFeature(i)} style={styles.removeBtn}>
                    <Trash2 size={16} color={colors.danger ?? '#EF4444'} />
                  </TouchableOpacity>
                </View>
              ))}
              <TouchableOpacity
                onPress={addFeature}
                style={[styles.addBtn, { borderColor: colors.primary }]}
              >
                <Plus size={14} color={colors.primary} />
                <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('Add Feature')}</Text>
              </TouchableOpacity>
            </View>

            {/* Active */}
            <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.label, { color: colors.ink }]}>{t('Active')}</Text>
              <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: colors.primary }} />
            </View>

            <Button label={t('Save')} onPress={handleSave} loading={loading} />
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
  featureRow: { alignItems: 'center', gap: spacing.xs, marginBottom: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.xl },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 56, paddingTop: spacing.sm, textAlignVertical: 'top' },
  removeBtn: { padding: spacing.xs },
  row: { gap: spacing.sm },
  switchRow: { alignItems: 'center', justifyContent: 'space-between' },
});
