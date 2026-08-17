import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { File, Paths } from 'expo-file-system';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { replyToTweet, TwitterAccount } from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  accounts: TwitterAccount[];
};

export function ReplyModal({ visible, onClose, accounts }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [selected, setSelected] = useState<string[]>([]);
  const [url, setUrl] = useState('');
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const options = accounts.map((a) => ({ label: a.AccountDataInfo1?.FullName || a.name, value: a.name }));

  useEffect(() => {
    if (!visible) return;
    setSelected([]);
    setUrl('');
    setText('');
  }, [visible]);

  const handleSubmit = async () => {
    if (selected.length === 0 || !url.trim() || !text.trim()) {
      Alert.alert(t('Required'), t('Please fill all required fields'));
      return;
    }
    setSubmitting(true);
    try {
      const repliesPayload = selected.map(() => text.trim()).join('/');
      const file = new File(Paths.cache, 'replies.txt');
      if (file.exists) file.delete();
      file.create();
      file.write(repliesPayload);
      await replyToTweet(selected, url.trim(), { uri: file.uri, name: 'replies.txt', type: 'text/plain' });
      Alert.alert(t('Success'), t('Replied from {{count}} account(s)', { count: selected.length }));
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to send replies'));
    } finally {
      setSubmitting(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={t('Reply')} size="md">
      <View style={styles.form}>
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

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Reply text')} *</Text>
          <TextInput
            style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
            placeholder={t('Your reply...')}
            placeholderTextColor={colors.textMuted}
            value={text}
            onChangeText={setText}
            multiline
            maxLength={280}
          />
          <Text style={[styles.counter, { color: colors.textMuted, textAlign: align }]}>{text.length}/280</Text>
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
  counter: { fontSize: font.sizes.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
});
