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
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  createSubscriptionPlan,
  updateSubscriptionPlan,
  fetchFeatureTypes,
  SubscriptionPlan,
  FeatureType,
} from '../services/plans';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type PricingEntry = {
  price: string;
  discount: string;
  interval_count: string;
  interval: 'day' | 'week' | 'month' | 'year';
  is_active: boolean;
};

type FeatureEntry = {
  feature_type_id: string;
  properties: { key: string; value: string }[];
};

const INTERVALS: Array<{ value: 'day' | 'week' | 'month' | 'year'; labelKey: string }> = [
  { value: 'day', labelKey: 'Day' },
  { value: 'week', labelKey: 'Week' },
  { value: 'month', labelKey: 'Month' },
  { value: 'year', labelKey: 'Year' },
];

const INTERVAL_DAYS: Record<string, number> = { day: 1, week: 7, month: 30, year: 365 };

function makePricing(): PricingEntry {
  return { price: '', discount: '0', interval_count: '1', interval: 'month', is_active: true };
}

function makeFeature(): FeatureEntry {
  return { feature_type_id: '', properties: [] };
}

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  plan?: SubscriptionPlan | null;
};

export function CreatePlanModal({ visible, onClose, onSaved, plan }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pricing, setPricing] = useState<PricingEntry[]>([makePricing()]);
  const [features, setFeatures] = useState<FeatureEntry[]>([]);
  const [trialDays, setTrialDays] = useState('');
  const [trialActive, setTrialActive] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [featureTypes, setFeatureTypes] = useState<FeatureType[]>([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!plan;

  useEffect(() => {
    if (visible) {
      fetchFeatureTypes().then(setFeatureTypes).catch(() => setFeatureTypes([]));
      if (plan) {
        setName(plan.name || '');
        setDescription(plan.description || '');
        const p = plan.pricing?.map((pr) => ({
          price: String(pr.price ?? ''),
          discount: String(pr.discount ?? 0),
          interval_count: String(pr.interval_count ?? 1),
          interval: (pr.interval ?? 'month') as PricingEntry['interval'],
          is_active: pr.is_active ?? true,
        })) || [makePricing()];
        setPricing(p);
        setFeatures(
          plan.features?.map((f) => ({
            feature_type_id: f.feature_type_id || '',
            properties: f.properties || [],
          })) || [],
        );
        setTrialDays(String(plan.trial?.trial_days ?? ''));
        setTrialActive(plan.trial?.is_active ?? false);
        setIsActive(plan.is_active ?? true);
      } else {
        setName(''); setDescription(''); setPricing([makePricing()]); setFeatures([]);
        setTrialDays(''); setTrialActive(false); setIsActive(true);
      }
    }
  }, [visible, plan]);

  // Pricing helpers
  const updatePricing = (i: number, key: keyof PricingEntry, val: string | boolean) =>
    setPricing((prev) => prev.map((p, idx) => (idx === i ? { ...p, [key]: val } : p)));
  const addPricing = () => setPricing((prev) => [...prev, makePricing()]);
  const removePricing = (i: number) => setPricing((prev) => prev.filter((_, idx) => idx !== i));

  // Feature helpers
  const addFeature = () => setFeatures((prev) => [...prev, makeFeature()]);
  const removeFeature = (i: number) => setFeatures((prev) => prev.filter((_, idx) => idx !== i));
  const updateFeatureType = (i: number, ftId: string) => {
    const ft = featureTypes.find((f) => f._id === ftId);
    const props = ft?.attributes_definitions?.map((a) => ({ key: a.key, value: '' })) || [];
    setFeatures((prev) =>
      prev.map((f, idx) => (idx === i ? { feature_type_id: ftId, properties: props } : f)),
    );
  };
  const updateProp = (fi: number, pi: number, val: string) =>
    setFeatures((prev) =>
      prev.map((f, idx) =>
        idx === fi
          ? { ...f, properties: f.properties.map((p, j) => (j === pi ? { ...p, value: val } : p)) }
          : f,
      ),
    );

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    for (const p of pricing) {
      if (!p.price || isNaN(Number(p.price))) {
        Alert.alert(t('Error'), t('Invalid price'));
        return;
      }
    }
    if (trialActive && (!trialDays || isNaN(Number(trialDays)) || Number(trialDays) < 1)) {
      Alert.alert(t('Error'), t('Enter valid trial days'));
      return;
    }

    setLoading(true);
    try {
      const pricingPayload = pricing.map((p) => {
        const count = parseInt(p.interval_count, 10) || 1;
        return {
          price: parseFloat(p.price),
          discount: parseFloat(p.discount) || 0,
          interval: p.interval,
          interval_count: count,
          days_number: count * INTERVAL_DAYS[p.interval],
          is_active: p.is_active,
        };
      });

      const featuresPayload = features
        .filter((f) => f.feature_type_id)
        .map((f) => ({ feature_type_id: f.feature_type_id, properties: f.properties }));

      const payload = {
        name: name.trim(),
        description: description.trim(),
        pricing: pricingPayload,
        features: featuresPayload,
        trial: { trial_days: trialActive ? parseInt(trialDays, 10) : 0, is_active: trialActive },
        is_active: isActive,
      };

      if (isEdit && plan) await updateSubscriptionPlan(plan._id, payload);
      else await createSubscriptionPlan(payload);
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
      title={isEdit ? t('Edit Plan') : t('Create Plan')}
      size="full"
    >
      <View style={styles.form}>
            {/* Edit warning */}
            {isEdit && (
              <View style={[styles.warning, { backgroundColor: '#FEF3C7', borderColor: '#F59E0B' }]}>
                <Text style={[styles.warningText, { color: '#92400E' }]}>
                  {t('Updating this plan will archive the current version. Existing subscribers keep their price until renewal.')}
                </Text>
              </View>
            )}

            {/* Name */}
            <Field label={t('Plan Name')} align={align} colors={colors}>
              <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} placeholder={t('Enter name')} value={name} onChangeText={setName} />
            </Field>

            {/* Description */}
            <Field label={t('Description')} align={align} colors={colors}>
              <TextInput
                style={[inputStyle, styles.multiline]}
                placeholderTextColor={colors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
              />
            </Field>

            {/* Pricing */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('Pricing')}</Text>
              {pricing.map((p, i) => (
                <View key={i} style={[styles.card, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                  <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.label, { color: colors.ink }]}>{t('Option')} {i + 1}</Text>
                    {pricing.length > 1 && (
                      <TouchableOpacity onPress={() => removePricing(i)}>
                        <Trash2 size={16} color={colors.danger ?? '#EF4444'} />
                      </TouchableOpacity>
                    )}
                  </View>

                  <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={{ flex: 1 }}>
                      <Field label={t('Price')} align={align} colors={colors}>
                        <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} placeholder="0.00" value={p.price} onChangeText={(v) => updatePricing(i, 'price', v)} keyboardType="decimal-pad" />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label={t('Discount %')} align={align} colors={colors}>
                        <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} placeholder="0" value={p.discount} onChangeText={(v) => updatePricing(i, 'discount', v)} keyboardType="numeric" />
                      </Field>
                    </View>
                  </View>

                  <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <View style={{ flex: 1 }}>
                      <Field label={t('Count')} align={align} colors={colors}>
                        <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} placeholder="1" value={p.interval_count} onChangeText={(v) => updatePricing(i, 'interval_count', v)} keyboardType="numeric" />
                      </Field>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Field label={t('Interval')} align={align} colors={colors}>
                        <SelectDropdown
                          options={INTERVALS.map(iv => ({ label: t(iv.labelKey), value: iv.value }))}
                          value={p.interval}
                          onChange={v => updatePricing(i, 'interval', v)}
                          placeholder={t('Select interval...')}
                        />
                      </Field>
                    </View>
                  </View>

                  <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                    <Text style={[styles.label, { color: colors.ink }]}>{t('Active')}</Text>
                    <Switch value={p.is_active} onValueChange={(v) => updatePricing(i, 'is_active', v)} trackColor={{ true: colors.primary }} />
                  </View>
                </View>
              ))}

              <TouchableOpacity onPress={addPricing} style={[styles.addBtn, { borderColor: colors.primary }]}>
                <Plus size={14} color={colors.primary} />
                <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('Add Pricing Option')}</Text>
              </TouchableOpacity>
            </View>

            {/* Features */}
            {featureTypes.length > 0 && (
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('Features')}</Text>
                {features.map((f, i) => {
                  const selectedFt = featureTypes.find((ft) => ft._id === f.feature_type_id);
                  return (
                    <View key={i} style={[styles.card, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                      <View style={[styles.cardHead, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.label, { color: colors.ink }]}>{t('Feature')} {i + 1}</Text>
                        <TouchableOpacity onPress={() => removeFeature(i)}>
                          <Trash2 size={16} color={colors.danger ?? '#EF4444'} />
                        </TouchableOpacity>
                      </View>

                      {/* Feature type selector */}
                      <Field label={t('Type')} align={align} colors={colors}>
                        <SelectDropdown
                          options={featureTypes.map(ft => ({ label: ft.title, value: ft._id }))}
                          value={f.feature_type_id}
                          onChange={v => updateFeatureType(i, v)}
                          placeholder={t('Select type...')}
                        />
                      </Field>

                      {/* Dynamic properties */}
                      {selectedFt && f.properties.map((prop, pi) => (
                        <Field key={pi} label={prop.key} align={align} colors={colors}>
                          <TextInput
                            style={inputStyle}
                            placeholderTextColor={colors.textMuted}
                            value={prop.value}
                            onChangeText={(v) => updateProp(i, pi, v)}
                            keyboardType={
                              selectedFt.attributes_definitions?.find((a) => a.key === prop.key)?.data_type === 'number'
                                ? 'numeric'
                                : 'default'
                            }
                          />
                        </Field>
                      ))}
                    </View>
                  );
                })}

                <TouchableOpacity onPress={addFeature} style={[styles.addBtn, { borderColor: colors.primary }]}>
                  <Plus size={14} color={colors.primary} />
                  <Text style={[styles.addBtnText, { color: colors.primary }]}>{t('Add Feature')}</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Trial */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('Free Trial')}</Text>
              <View style={[styles.switchRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.label, { color: colors.ink }]}>{t('Enable Free Trial')}</Text>
                <Switch value={trialActive} onValueChange={setTrialActive} trackColor={{ true: colors.primary }} />
              </View>
              {trialActive && (
                <Field label={t('Trial Days')} align={align} colors={colors}>
                  <TextInput
                    style={inputStyle}
                    placeholderTextColor={colors.textMuted}
                    placeholder="7"
                    value={trialDays}
                    onChangeText={setTrialDays}
                    keyboardType="numeric"
                  />
                </Field>
              )}
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
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, marginBottom: spacing.sm, padding: spacing.md },
  cardHead: { alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
  chip: {
    borderRadius: radii.full,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  chips: { flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.xxl },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 64, paddingTop: spacing.sm, textAlignVertical: 'top' },
  row: { gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  switchRow: { alignItems: 'center', justifyContent: 'space-between' },
  warning: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.sm },
  warningText: { fontSize: font.sizes.xs, lineHeight: 18 },
});
