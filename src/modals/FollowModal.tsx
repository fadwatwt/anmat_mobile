import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { SegmentedControl } from '../components/SegmentedControl';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { followAccounts, unfollowAccounts, TwitterAccount } from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  accounts: TwitterAccount[];
};

const parseTargets = (raw: string): string[] =>
  raw
    .split(/[\s,;\n]+/)
    .map((s) => s.trim().replace(/^@/, ''))
    .filter(Boolean);

export function FollowModal({ visible, onClose, accounts }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [tab, setTab] = useState('follow');
  const [sourceAccounts, setSourceAccounts] = useState<string[]>([]);
  const [targets, setTargets] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const options = accounts.map((a) => ({ label: a.AccountDataInfo1?.FullName || a.name, value: a.name }));

  useEffect(() => {
    if (!visible) return;
    setSourceAccounts([]);
    setTargets('');
    setTab('follow');
  }, [visible]);

  const handleSubmit = async () => {
    const followList = parseTargets(targets);
    if (sourceAccounts.length === 0) {
      Alert.alert(t('Required'), t('Please select at least one source account'));
      return;
    }
    if (followList.length === 0) {
      Alert.alert(t('Required'), t('Please provide at least one username to follow'));
      return;
    }
    setSubmitting(true);
    try {
      if (tab === 'follow') {
        await followAccounts(sourceAccounts, followList);
        Alert.alert(t('Success'), t('Follow requests sent successfully'));
      } else {
        await unfollowAccounts(sourceAccounts, followList);
        Alert.alert(t('Success'), t('Unfollow requests sent successfully'));
      }
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || (tab === 'follow' ? t('Failed to send follow requests') : t('Failed to send unfollow requests')));
    } finally {
      setSubmitting(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={tab === 'follow' ? t('Follow') : t('Unfollow')} size="md">
      <View style={styles.form}>
        <SegmentedControl
          options={[
            { label: t('Follow'), value: 'follow' },
            { label: t('Unfollow'), value: 'unfollow' },
          ]}
          value={tab}
          onChange={setTab}
        />

        <MultiSelectDropdown
          label={t('Source accounts (who will follow)')}
          required
          options={options}
          value={sourceAccounts}
          onChange={setSourceAccounts}
          placeholder={t('Select Accounts')}
        />

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Accounts to follow')} *</Text>
          <TextInput
            style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
            placeholder={`${t('Paste usernames, one per line or comma-separated')}\n@example1\n@example2`}
            placeholderTextColor={colors.textMuted}
            value={targets}
            onChangeText={setTargets}
            multiline
          />
          <Text style={[styles.counter, { color: colors.textMuted, textAlign: align }]}>{t('Parsed')}: {parseTargets(targets).length}</Text>
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
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, minHeight: 80, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, textAlignVertical: 'top' },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
});
