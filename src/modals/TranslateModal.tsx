import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  createPlanTranslation,
  updatePlanTranslation,
  deletePlanTranslation,
  fetchPlanTranslations,
  createIndustryTranslation,
  updateIndustryTranslation,
  deleteIndustryTranslation,
  fetchIndustryTranslations,
  createTokenPackageTranslation,
  updateTokenPackageTranslation,
  deleteTokenPackageTranslation,
  fetchTokenPackageTranslations,
  createFeatureTypeTranslation,
  updateFeatureTypeTranslation,
  deleteFeatureTypeTranslation,
  fetchFeatureTypeTranslations,
  PlanTranslation,
  IndustryTranslation,
  TokenPackageTranslation,
  FeatureTypeTranslation,
} from '../services/translations';
import { SubscriptionPlan, TokenPackage, FeatureType } from '../services/plans';
import { Industry } from '../services/industries';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const LOCALES = [
  { value: 'ar', label: 'العربية' },
  { value: 'en', label: 'English' },
];

type Kind = 'plan' | 'industry' | 'package' | 'featureType';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  kind: Kind;
  item: SubscriptionPlan | Industry | TokenPackage | FeatureType | null;
};

export function TranslateModal({ visible, onClose, onSaved, kind, item }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [locale, setLocale] = useState('ar');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<string[]>([]);
  const [featureTranslations, setFeatureTranslations] = useState<
    { feature_type_id?: string; title: string; details: string; properties?: { key: string; value: string }[] }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const id = item?._id || '';

  useEffect(() => {
    if (!visible || !id) return;
    setLocale('ar');
    setName('');
    setDescription('');
    setFeatures([]);
    setFeatureTranslations([]);
    setDeleting(false);

    const load = async () => {
      try {
        let existing: PlanTranslation | IndustryTranslation | TokenPackageTranslation | FeatureTypeTranslation | undefined;
        let list: unknown;
        if (kind === 'plan') list = await fetchPlanTranslations(id);
        else if (kind === 'industry') list = await fetchIndustryTranslations(id);
        else if (kind === 'featureType') list = await fetchFeatureTypeTranslations(id);
        else list = await fetchTokenPackageTranslations(id);
        existing = (Array.isArray(list) ? list : []).find((tr: any) => tr.locale === 'ar');

        const plan = item as SubscriptionPlan;
        const pkg = item as TokenPackage;

        if (kind === 'plan') {
          const et = existing as PlanTranslation | undefined;
          if (et) {
            setName(et.name || '');
            setDescription(et.description || '');
            setFeatureTranslations(
              (et.feature_translations || []).map((ft) => ({
                feature_type_id: ft.feature_type_id,
                title: ft.title || '',
                details: ft.details || '',
                properties: (ft.properties || []).map((p) => ({ key: p.key, value: p.value || '' })),
              })),
            );
          } else {
            setName('');
            setDescription('');
            setFeatureTranslations(
              (plan?.features || []).map((f) => ({
                feature_type_id: f.plan_feature?._id || f.feature_type_id,
                title: '',
                details: '',
                properties: (f.properties || []).map((p) => ({ key: p.key, value: '' })),
              })),
            );
          }
        } else if (kind === 'industry') {
          setName((existing as IndustryTranslation | undefined)?.name || '');
        } else if (kind === 'featureType') {
          const et = existing as FeatureTypeTranslation | undefined;
          if (et) {
            setName(et.title || '');
            setDescription(et.details || '');
          } else {
            setName('');
            setDescription('');
          }
        } else {
          const et = existing as TokenPackageTranslation | undefined;
          if (et) {
            setName(et.name || '');
            setDescription(et.description || '');
            setFeatures(et.features || []);
          } else {
            setName('');
            setDescription('');
            setFeatures((pkg?.features || []).map((f) => f || ''));
          }
        }
      } catch {
        // ignore — form starts empty
      }
    };
    load();
  }, [visible, id, kind, item]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    try {
      if (kind === 'plan') {
        const body = {
          name,
          description,
          feature_translations: featureTranslations,
        };
        const existing = await fetchPlanTranslations(id);
        const has = (existing || []).some((tr) => tr.locale === locale);
        if (has) await updatePlanTranslation(id, locale, body);
        else await createPlanTranslation(id, { locale, ...body });
      } else if (kind === 'industry') {
        const existing = await fetchIndustryTranslations(id);
        const has = (existing || []).some((tr) => tr.locale === locale);
        if (has) await updateIndustryTranslation(id, locale, { name });
        else await createIndustryTranslation(id, { locale, name });
      } else if (kind === 'featureType') {
        const body = { title: name, details: description };
        const existing = await fetchFeatureTypeTranslations(id);
        const has = (existing || []).some((tr) => tr.locale === locale);
        if (has) await updateFeatureTypeTranslation(id, locale, body);
        else await createFeatureTypeTranslation(id, { locale, ...body });
      } else {
        const body = { name, description, features: features.filter((f) => f && f.trim() !== '') };
        const existing = await fetchTokenPackageTranslations(id);
        const has = (existing || []).some((tr) => tr.locale === locale);
        if (has) await updateTokenPackageTranslation(id, locale, body);
        else await createTokenPackageTranslation(id, { locale, ...body });
      }
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    Alert.alert(t('Delete Translation'), t('Are you sure? This action cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            if (kind === 'plan') await deletePlanTranslation(id, locale);
            else if (kind === 'industry') await deleteIndustryTranslation(id, locale);
            else if (kind === 'featureType') await deleteFeatureTypeTranslation(id, locale);
            else await deleteTokenPackageTranslation(id, locale);
            onSaved();
            onClose();
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  };

  const existingTranslation =
    kind === 'plan'
      ? (item as SubscriptionPlan) && featureTranslations.length > 0
      : kind === 'package'
      ? !!(item as TokenPackage)?.features?.length && features.length > 0
      : kind === 'featureType'
      ? !!name
      : !!name;

  const updateFeatureTranslation = (index: number, field: 'title' | 'details', value: string) => {
    setFeatureTranslations((prev) => prev.map((ft, i) => (i === index ? { ...ft, [field]: value } : ft)));
  };

  const updateProperty = (featureIndex: number, propIndex: number, value: string) => {
    setFeatureTranslations((prev) =>
      prev.map((ft, i) =>
        i === featureIndex
          ? { ...ft, properties: (ft.properties || []).map((p, j) => (j === propIndex ? { ...p, value } : p)) }
          : ft,
      ),
    );
  };

  const loading = saving || deleting;

  return (
    <Modal
      visible={visible}
      onClose={onClose}
      title={`${t('Translations')} - ${(item as any)?.name || (item as any)?.title || ''}`}
      size="full"
    >
      <View style={styles.form}>
        <SelectDropdown
          options={LOCALES}
          value={locale}
          onChange={setLocale}
          label={t('Language')}
        />

        <Field label={kind === 'industry' ? t('Industry Name') : kind === 'package' ? t('Package Name') : kind === 'featureType' ? t('Feature Type Title') : t('Plan Name')} align={align} colors={colors}>
          <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        </Field>
        {kind !== 'industry' && kind !== 'featureType' && (
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
        )}

        {/* Feature Type details */}
        {kind === 'featureType' && (
          <Field label={t('Details')} align={align} colors={colors}>
            <TextInput
              style={[inputStyle, styles.multiline]}
              placeholderTextColor={colors.textMuted}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </Field>
        )}

        {/* Plan feature translations */}
        {kind === 'plan' && featureTranslations.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('Feature Translations')}</Text>
            {featureTranslations.map((ft, i) => (
              <View key={i} style={[styles.card, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                <Text style={[styles.featureTitle, { color: colors.primary }]}>
                  {ft.title || (item as SubscriptionPlan)?.features?.[i]?.plan_feature?.title || `${t('Feature')} ${i + 1}`}
                </Text>
                <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <View style={{ flex: 1 }}>
                    <Field label={t('Title')} align={align} colors={colors}>
                      <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} value={ft.title} onChangeText={(v) => updateFeatureTranslation(i, 'title', v)} />
                    </Field>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Field label={t('Details')} align={align} colors={colors}>
                      <TextInput style={inputStyle} placeholderTextColor={colors.textMuted} value={ft.details} onChangeText={(v) => updateFeatureTranslation(i, 'details', v)} />
                    </Field>
                  </View>
                </View>
                {ft.properties && ft.properties.length > 0 && (
                  <View style={styles.section}>
                    <Text style={[styles.valuesTitle, { color: colors.textMuted }]}>{t('Values')}</Text>
                    {ft.properties.map((prop, pi) => (
                      <View key={pi} style={[styles.propRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                        <Text style={[styles.propKey, { color: colors.textMuted, minWidth: 60 }]}>{t(prop.key)}:</Text>
                        <TextInput
                          style={[styles.propInput, { color: colors.ink, backgroundColor: colors.surface, borderColor: colors.border, flex: 1, textAlign: align }]}
                          placeholderTextColor={colors.textMuted}
                          value={prop.value}
                          onChangeText={(v) => updateProperty(i, pi, v)}
                        />
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        {/* Token package features */}
        {kind === 'package' && features.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.ink }]}>{t('Features')}</Text>
            {features.map((feature, i) => (
              <Field key={i} label={`${t('Feature')} ${i + 1}`} align={align} colors={colors}>
                <TextInput
                  style={inputStyle}
                  placeholderTextColor={colors.textMuted}
                  value={feature}
                  onChangeText={(v) => setFeatures((prev) => prev.map((f, j) => (j === i ? v : f)))}
                />
              </Field>
            ))}
          </View>
        )}

        <Button label={t('Save')} onPress={handleSave} loading={loading} />

        {existingTranslation && (
          <TouchableOpacity style={styles.deleteRow} onPress={handleDelete} disabled={loading}>
            <Trash2 size={16} color="#DF1C41" />
            <Text style={styles.deleteText}>{t('Delete Translation')}</Text>
          </TouchableOpacity>
        )}
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
  card: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  deleteRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, justifyContent: 'center', paddingVertical: spacing.sm },
  deleteText: { color: '#DF1C41', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  featureTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, marginBottom: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.xxl },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 64, paddingTop: spacing.sm, textAlignVertical: 'top' },
  propInput: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  propKey: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  propRow: { alignItems: 'center', gap: spacing.xs },
  row: { gap: spacing.sm },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  valuesTitle: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
});
