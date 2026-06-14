import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Check } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { setSubscriberSocialQuota, SubscriberSocialQuota } from '../services/subscribers';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Mode = 'specific' | 'unlimited' | 'reset';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  subscriberId: string;
  currentQuota?: SubscriberSocialQuota | null;
};

export function SetSocialMediaQuotaModal({ visible, onClose, onSaved, subscriberId, currentQuota }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [mode, setMode] = useState<Mode>('specific');
  const [limit, setLimit] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setMode('specific');
      setLimit(currentQuota && !currentQuota.unlimited ? String(currentQuota.limit) : '');
    }
  }, [visible, currentQuota]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (mode === 'specific') {
        const n = parseInt(limit, 10);
        if (isNaN(n) || n < 0) {
          Alert.alert(t('Error'), t('Enter a valid non-negative number'));
          setSaving(false);
          return;
        }
        await setSubscriberSocialQuota(subscriberId, { limit: n });
      } else if (mode === 'unlimited') {
        await setSubscriberSocialQuota(subscriberId, { unlimited: true });
      } else {
        await setSubscriberSocialQuota(subscriberId, { reset: true });
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

  const options: Array<{ value: Mode; labelKey: string }> = [
    { value: 'specific', labelKey: 'Set a specific limit' },
    { value: 'unlimited', labelKey: 'Unlimited accounts' },
    { value: 'reset', labelKey: 'Reset to plan default' },
  ];

  return (
    <Modal visible={visible} onClose={onClose} title={t('Set Social Media Quota')} size="md">
      <View style={styles.form}>
        {/* Current quota */}
        {currentQuota && (
          <View style={[styles.infoBox, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
            <Text style={[styles.infoText, { color: colors.textMuted, textAlign: align }]}>
              {t('Current')}: {currentQuota.used} / {currentQuota.unlimited ? '∞' : currentQuota.limit}
              {currentQuota.source ? ` · ${t('Source')}: ${currentQuota.source}` : ''}
            </Text>
          </View>
        )}

        {/* Mode options */}
        {options.map((o) => {
          const sel = mode === o.value;
          return (
            <TouchableOpacity
              key={o.value}
              style={[styles.option, { borderColor: sel ? colors.primary : colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}
              onPress={() => setMode(o.value)}
            >
              <View style={[styles.radio, { borderColor: sel ? colors.primary : colors.border, backgroundColor: sel ? colors.primary : 'transparent' }]}>
                {sel && <Check size={12} color="#FFF" />}
              </View>
              <Text style={[styles.optionText, { color: colors.ink, textAlign: align }]}>{t(o.labelKey)}</Text>
            </TouchableOpacity>
          );
        })}

        {/* Limit input */}
        {mode === 'specific' && (
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Limit')}</Text>
            <TextInput
              style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
              placeholder="e.g. 5"
              placeholderTextColor={colors.textMuted}
              value={limit}
              onChangeText={setLimit}
              keyboardType="numeric"
            />
          </View>
        )}

        <Button label={t('Save')} onPress={handleSave} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  infoBox: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.sm },
  infoText: { fontSize: font.sizes.xs },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  option: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, gap: spacing.sm, padding: spacing.md },
  optionText: { flex: 1, fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  radio: { alignItems: 'center', borderRadius: radii.full, borderWidth: 1.5, height: 18, justifyContent: 'center', width: 18 },
});
