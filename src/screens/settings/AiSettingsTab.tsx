import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Sparkles } from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchFreeTokensLimit,
  updateFreeTokensLimit,
} from '../../services/settings';

export default function AiSettingsTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [limit, setLimit] = useState('5000');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setLoading(true);
        try {
          const data = await fetchFreeTokensLimit();
          setLimit(String(data.limit ?? 5000));
        } catch {
          // use default
        } finally {
          setLoading(false);
        }
      })();
    }, []),
  );

  const handleSave = async () => {
    const val = parseInt(limit, 10);
    if (isNaN(val) || val < 0) {
      Alert.alert(t('Error'), t('Please enter a valid number'));
      return;
    }
    setSaving(true);
    try {
      await updateFreeTokensLimit(val);
      Alert.alert(t('Success'), t('AI free tokens limit updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update AI limit'));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  if (loading) {
    return <ActivityIndicator color={colors.primary} size="large" style={{ marginTop: spacing.xxl }} />;
  }

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <View style={[styles.headerRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <Sparkles size={20} color={colors.primary} />
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('AI Assistant Settings')}</Text>
        </View>
        <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>
          {t('Configure the global monthly free tokens limit for all users.')}
        </Text>

        <View>
          <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t('Free Tokens Limit')}</Text>
          <TextInput
            style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, textAlign: align }]}
            value={limit}
            onChangeText={setLimit}
            keyboardType="number-pad"
            placeholder="e.g. 5000"
            placeholderTextColor={colors.textMuted}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.primary }]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveBtnText}>{saving ? t('Saving...') : t('Save Changes')}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 60 },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
    gap: spacing.md,
  },
  headerRow: { alignItems: 'center', gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold, flex: 1 },
  sectionDesc: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  fieldLabel: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    height: 44,
    fontSize: font.sizes.sm,
  },
  saveBtn: {
    borderRadius: radii.xl,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});
