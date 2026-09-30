import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import {
  fetchPlanTranslations,
  createPlanTranslation,
  updatePlanTranslation,
  deletePlanTranslation,
  SubscriptionPlan,
  PlanFeatureTranslation,
} from '../services/plans';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  plan: SubscriptionPlan | null;
  onClose: () => void;
  onSaved: () => void;
};

const LOCALE_OPTIONS = [
  { label: 'العربية', value: 'ar' },
  { label: 'English', value: 'en' },
];

function makeFeatureTranslations(plan: SubscriptionPlan): PlanFeatureTranslation[] {
  return (
    plan.features?.map((f) => ({
      feature_type_id: f.plan_feature?._id || f.feature_type_id || '',
      title: '',
      details: '',
    })) || []
  );
}

export function PlanTranslationsModal({ visible, plan, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [locale, setLocale] = useState('ar');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [features, setFeatures] = useState<PlanFeatureTranslation[]>([]);
  const [existing, setExisting] = useState(false);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!plan) return;
    try {
      const translations = await fetchPlanTranslations(plan._id);
      const found = translations.find((tr) => tr.locale === locale);
      if (found) {
        setName(found.name || '');
        setDescription(found.description || '');
        setFeatures(
          found.feature_translations?.map((ft) => ({
            feature_type_id: ft.feature_type_id || '',
            title: ft.title || '',
            details: ft.details || '',
          })) || [],
        );
        setExisting(true);
      } else {
        setName('');
        setDescription('');
        setFeatures(makeFeatureTranslations(plan));
        setExisting(false);
      }
    } catch {
      setName('');
      setDescription('');
      setFeatures(makeFeatureTranslations(plan));
      setExisting(false);
    }
  }, [plan, locale]);

  useEffect(() => {
    if (visible) {
      setLocale('ar');
      if (plan) {
        setName('');
        setDescription('');
        setFeatures(makeFeatureTranslations(plan));
        setExisting(false);
      }
      load();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, plan]);

  const handleLocaleChange = (val: string) => {
    setLocale(val);
    setName('');
    setDescription('');
    setFeatures(plan ? makeFeatureTranslations(plan) : []);
    setExisting(false);
    if (plan) {
      fetchPlanTranslations(plan._id)
        .then((translations) => {
          const found = translations.find((tr) => tr.locale === val);
          if (found) {
            setName(found.name || '');
            setDescription(found.description || '');
            setFeatures(
              found.feature_translations?.map((ft) => ({
                feature_type_id: ft.feature_type_id || '',
                title: ft.title || '',
                details: ft.details || '',
              })) || [],
            );
            setExisting(true);
          }
        })
        .catch(() => {});
    }
  };

  const updateFeature = (i: number, field: 'title' | 'details', value: string) =>
    setFeatures((prev) => prev.map((f, idx) => (idx === i ? { ...f, [field]: value } : f)));

  const handleSave = async () => {
    if (!plan) return;
    const payload = {
      locale,
      name: name.trim(),
      description: description.trim(),
      feature_translations: features
        .filter((f) => f.feature_type_id)
        .map((f) => ({ feature_type_id: f.feature_type_id, title: f.title?.trim() || undefined, details: f.details?.trim() || undefined })),
    };
    setLoading(true);
    try {
      if (existing) {
        await updatePlanTranslation(plan._id, locale, {
          name: payload.name,
          description: payload.description,
          feature_translations: payload.feature_translations,
        });
      } else {
        await createPlanTranslation(plan._id, payload);
      }
      setExisting(true);
      onSaved();
      Alert.alert(t('Success'), existing ? t('Translation updated successfully!') : t('Translation created successfully!'));
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!plan) return;
    Alert.alert(t('Delete Translation'), t('Are you sure? This action cannot be undone.'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await deletePlanTranslation(plan._id, locale);
            setExisting(false);
            setName('');
            setDescription('');
            setFeatures(makeFeatureTranslations(plan));
            onSaved();
            Alert.alert(t('Success'), t('Translation deleted successfully!'));
          } catch (e) {
            Alert.alert(t('Error'), extractErrorMessage(e));
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
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
      title={`${t('Translations')} - ${plan?.name || ''}`}
      size="lg"
      noScroll
    >
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.form}>
        <SelectDropdown
          label={t('Language')}
          options={LOCALE_OPTIONS}
          value={locale}
          onChange={handleLocaleChange}
          required
        />

          <View>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Plan Name')}</Text>
            <TextInput
              style={inputStyle}
              placeholderTextColor={colors.textMuted}
              placeholder={t('Enter translated plan name')}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Description')}</Text>
            <TextInput
              style={[inputStyle, styles.textarea]}
              placeholderTextColor={colors.textMuted}
              placeholder={t('Enter translated description')}
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />
          </View>

          {features.length > 0 && (
            <View>
              <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Feature Translations')}</Text>
              {features.map((f, i) => (
                <View key={i} style={[styles.featureCard, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
                  <Text style={[styles.featureTitle, { color: colors.primary }]}>
                    {plan?.features?.[i]?.plan_feature?.title || `${t('Feature')} ${i + 1}`}
                  </Text>
                  <View>
                    <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Title')}</Text>
                    <TextInput
                      style={inputStyle}
                      placeholderTextColor={colors.textMuted}
                      placeholder={t('Translated title')}
                      value={f.title}
                      onChangeText={(v) => updateFeature(i, 'title', v)}
                    />
                  </View>
                  <View>
                    <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Details')}</Text>
                    <TextInput
                      style={[inputStyle, styles.textarea]}
                      placeholderTextColor={colors.textMuted}
                      placeholder={t('Translated details')}
                      value={f.details}
                      onChangeText={(v) => updateFeature(i, 'details', v)}
                      multiline
                      numberOfLines={2}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {existing && (
            <TouchableOpacity onPress={handleDelete} style={[styles.deleteRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]} disabled={loading}>
              <Trash2 size={16} color="#DF1C41" />
              <Text style={[styles.deleteText, { color: '#DF1C41' }]}>{t('Delete Translation')}</Text>
            </TouchableOpacity>
          )}
      </ScrollView>

      <View style={styles.footer}>
        <Button label={existing ? t('Update') : t('Create')} onPress={handleSave} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  deleteRow: { alignItems: 'center', gap: spacing.xs },
  deleteText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  featureCard: { borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  featureTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  footer: { padding: spacing.md },
  form: { gap: spacing.md, padding: spacing.md, paddingBottom: spacing.lg },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: spacing.xs },
  scroll: { flex: 1 },
  sectionTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.bold },
  textarea: { minHeight: 60, textAlignVertical: 'top' },
});
