import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { likeTweet, unlikeTweet, TwitterAccount } from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  accounts: TwitterAccount[];
};

export function LikeModal({ visible, onClose, accounts }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [tab, setTab] = useState('like');
  const [selected, setSelected] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const options = accounts.map((a) => ({ label: a.AccountDataInfo1?.FullName || a.name, value: a.name }));

  useEffect(() => {
    if (!visible) return;
    setSelected([]);
    setUrl('');
    setTab('like');
  }, [visible]);

  const handleSubmit = async () => {
    if (selected.length === 0 || !url.trim()) {
      Alert.alert(t('Required'), t('Please select accounts and provide a tweet URL'));
      return;
    }
    setSubmitting(true);
    try {
      if (tab === 'like') {
        await likeTweet(selected, url.trim());
        Alert.alert(t('Success'), t('Tweet liked from {{count}} account(s)', { count: selected.length }));
      } else {
        await unlikeTweet(selected, url.trim());
        Alert.alert(t('Success'), t('Tweet unliked from {{count}} account(s)', { count: selected.length }));
      }
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || (tab === 'like' ? t('Failed to like tweet') : t('Failed to unlike tweet')));
    } finally {
      setSubmitting(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={tab === 'like' ? t('Like') : t('Unlike')} size="md">
      <View style={styles.form}>
        <SegmentedControl
          options={[
            { label: t('Like'), value: 'like' },
            { label: t('Unlike'), value: 'unlike' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <MultiSelectDropdown
          label={t('Accounts')}
          required
          options={options}
          value={selected}
          onChange={setSelected}
          placeholder={t('Select Accounts')}
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Tweet URL')} *</Text>
          <TextInput
            style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
            placeholder={t('https://x.com/user/status/...')}
            placeholderTextColor={colors.textMuted}
            value={url}
            onChangeText={setUrl}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />
        </View>

        <Button
          label={submitting ? t('Submitting...') : t('Apply')}
          onPress={handleSubmit}
          loading={submitting}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
});
