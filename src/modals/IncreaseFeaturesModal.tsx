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
import { Plus, Trash2 } from 'lucide-react-native';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchFeatureTypes, FeatureType } from '../services/plans';
import {
  updateSubscriptionExtraFeatures,
  ExtraFeature,
  SubscriptionFeature,
} from '../services/subscribers';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  subscriptionId: string;
  currentExtraFeatures?: SubscriptionFeature[];
};

export function IncreaseFeaturesModal({ visible, onClose, onSaved, subscriptionId, currentExtraFeatures }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [featureTypes, setFeatureTypes] = useState<FeatureType[]>([]);
  const [applied, setApplied] = useState<ExtraFeature[]>([]);
  const [selectedFt, setSelectedFt] = useState('');
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    fetchFeatureTypes().then(setFeatureTypes).catch(() => setFeatureTypes([]));
    setSelectedFt(''); setValue('');
    // Normalise current extra features into editable shape.
    setApplied(
      (currentExtraFeatures || []).map((f) => ({
        feature_type_id: typeof f.feature_type_id === 'string' ? f.feature_type_id : f.feature_type_id?._id || '',
        properties: f.properties || [],
      })).filter((f) => f.feature_type_id),
    );
  }, [visible, currentExtraFeatures]);

  const ftTitle = (id: string) => featureTypes.find((ft) => ft._id === id)?.title || t('Feature');

  const addOverride = () => {
    const ft = featureTypes.find((f) => f._id === selectedFt);
    if (!ft || !value.trim()) {
      Alert.alert(t('Required'), t('Select a feature and enter a value'));
      return;
    }
    const key = ft.attributes_definitions?.[0]?.key || 'limit';
    const entry: ExtraFeature = { feature_type_id: ft._id, properties: [{ key, value: value.trim() }] };
    // Replace existing override for the same feature type, else append.
    setApplied((prev) => {
      const others = prev.filter((p) => p.feature_type_id !== ft._id);
      return [...others, entry];
    });
    setSelectedFt(''); setValue('');
  };

  const removeOverride = (id: string) =>
    setApplied((prev) => prev.filter((p) => p.feature_type_id !== id));

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSubscriptionExtraFeatures(subscriptionId, applied);
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
    <Modal visible={visible} onClose={onClose} title={t('Increase Features')} size="lg">
      <View style={styles.form}>
            {/* Feature type selector */}
            <View style={styles.field}>
              <SelectDropdown
                label={t('Feature Type')}
                options={featureTypes.map(ft => ({ label: ft.title, value: ft._id }))}
                value={selectedFt}
                onChange={setSelectedFt}
                placeholder={featureTypes.length === 0 ? t('Loading...') : t('Select feature type...')}
              />
            </View>

            {/* Value input + add */}
            <View style={[styles.addRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('New Limit/Value')}</Text>
                <TextInput
                  style={inputStyle}
                  placeholder="e.g. 50"
                  placeholderTextColor={colors.textMuted}
                  value={value}
                  onChangeText={setValue}
                  keyboardType="numeric"
                />
              </View>
              <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={addOverride}>
                <Plus size={18} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Applied overrides */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Applied Overrides')}</Text>
              {applied.length === 0 ? (
                <Text style={{ color: colors.textMuted, fontSize: font.sizes.xs }}>{t('No overrides yet')}</Text>
              ) : (
                applied.map((f) => (
                  <View
                    key={f.feature_type_id}
                    style={[styles.appliedRow, { backgroundColor: colors.statusBg, borderColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.appliedTitle, { color: colors.ink, textAlign: align }]}>{ftTitle(f.feature_type_id)}</Text>
                      <Text style={[styles.appliedProps, { color: colors.textMuted, textAlign: align }]}>
                        {f.properties.map((p) => `${p.key}: ${p.value}`).join(', ')}
                      </Text>
                    </View>
                    <TouchableOpacity onPress={() => removeOverride(f.feature_type_id)} style={styles.iconBtn}>
                      <Trash2 size={16} color={colors.danger ?? '#EF4444'} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>

            <Button label={t('Save')} onPress={handleSave} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  addBtn: { alignItems: 'center', alignSelf: 'flex-end', borderRadius: radii.lg, height: 40, justifyContent: 'center', width: 40 },
  addRow: { alignItems: 'flex-end', gap: spacing.sm },
  appliedProps: { fontSize: font.sizes.xs, marginTop: 2 },
  appliedRow: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, gap: spacing.xs, marginBottom: spacing.xs, padding: spacing.sm },
  appliedTitle: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  chip: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  chipText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  chips: { flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.lg },
  iconBtn: { padding: spacing.xs },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
});
