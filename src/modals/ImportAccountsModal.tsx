import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FileUp, X } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchAccountCategories, importTwitterAccounts, AccountCategory, LocalFile } from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onImported: () => void;
};

export function ImportAccountsModal({ visible, onClose, onImported }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [file, setFile] = useState<LocalFile | null>(null);
  const [category, setCategory] = useState('');
  const [categories, setCategories] = useState<AccountCategory[]>([]);
  const [catsLoading, setCatsLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setFile(null);
    setCategory('');
    setCatsLoading(true);
    fetchAccountCategories()
      .then(setCategories)
      .catch(() => setCategories([]))
      .finally(() => setCatsLoading(false));
  }, [visible]);

  const pickFile = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: '*/*', copyToCacheDirectory: true });
    if (result.canceled || result.assets.length === 0) return;
    const asset = result.assets[0];
    setFile({ uri: asset.uri, name: asset.name, type: asset.mimeType || 'text/csv' });
  };

  const handleSubmit = async () => {
    if (!file || !category) {
      Alert.alert(t('Required'), t('Please select a CSV file and a category.'));
      return;
    }
    setSaving(true);
    try {
      const result = await importTwitterAccounts(file, category);
      const insertedCount = result.insertedCount ?? 0;
      const failed = result.failed ?? 0;
      Alert.alert(
        t('Success'),
        failed
          ? t('Imported {{insertedCount}} accounts. {{failed}} failed.', { insertedCount, failed })
          : t('Imported {{insertedCount}} accounts successfully.', { insertedCount }),
      );
      onImported();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to import accounts.'));
    } finally {
      setSaving(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={t('Import Twitter Accounts')} size="md">
      <View style={styles.form}>
        <Text style={[styles.hint, { color: colors.textMuted, textAlign: align }]}>
          {t('Upload a CSV file with columns: Username, Password, Email, Phone, Cookies, Proxy, etc. The quota will be enforced before insertion.')}
        </Text>

        <SelectDropdown
          label={t('Category')}
          required
          value={category}
          options={categories.map((c) => ({ label: c.name, value: c._id }))}
          onChange={setCategory}
          placeholder={catsLoading ? t('Loading categories...') : t('Select category')}
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('CSV File')} *</Text>
          <TouchableOpacity
            style={[styles.picker, { backgroundColor: colors.statusBg, borderColor: colors.border }]}
            onPress={pickFile}
            activeOpacity={0.7}
          >
            <FileUp size={18} color={colors.primary} />
            <Text style={[styles.pickerText, { color: colors.ink, textAlign: align, flex: 1 }]}>
              {file ? file.name : t('Choose CSV file')}
            </Text>
          </TouchableOpacity>
          {file && (
            <View style={[styles.fileRow, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
              <Text style={[styles.fileName, { color: colors.ink, textAlign: align, flex: 1 }]} numberOfLines={1}>{file.name}</Text>
              <TouchableOpacity onPress={() => setFile(null)} hitSlop={8}>
                <X size={16} color={colors.danger} />
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Button
          label={saving ? t('Importing...') : t('Import')}
          onPress={handleSubmit}
          loading={saving}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  fileRow: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  fileName: { fontSize: font.sizes.sm },
  form: { gap: spacing.md },
  hint: { fontSize: font.sizes.xs },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  picker: { alignItems: 'center', borderRadius: radii.lg, borderWidth: 1, flexDirection: 'row', gap: spacing.sm, height: 44, paddingHorizontal: spacing.md },
  pickerText: { fontSize: font.sizes.sm },
});
