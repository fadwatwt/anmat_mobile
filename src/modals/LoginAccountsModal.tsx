import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, XCircle } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown, SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { checkTwitterAccounts, TweetAccountCheckResult, TwitterAccount } from '../services/socialMedia';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  accounts: TwitterAccount[];
  onChecked: () => void;
};

const USER_AGENTS = [
  { label: 'Web Browser', value: 'web' },
  { label: 'Mobile Device', value: 'mobile' },
];

export function LoginAccountsModal({ visible, onClose, accounts, onChecked }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [selected, setSelected] = useState<string[]>([]);
  const [userAgent, setUserAgent] = useState('web');
  const [results, setResults] = useState<TweetAccountCheckResult[] | null>(null);
  const [checking, setChecking] = useState(false);

  const options = accounts.map((a) => ({ label: a.AccountDataInfo1?.FullName || a.name, value: a.name }));

  useEffect(() => {
    if (!visible) return;
    setSelected([]);
    setUserAgent('web');
    setResults(null);
  }, [visible]);

  const handleSubmit = async () => {
    if (selected.length === 0) {
      Alert.alert(t('Required'), t('Please select at least one account'));
      return;
    }
    setChecking(true);
    try {
      const outcome = await checkTwitterAccounts(selected, userAgent);
      setResults(outcome);
      const failed = outcome.filter((r) => !r.status).length;
      const succeeded = outcome.length - failed;
      if (failed === 0) {
        Alert.alert(t('Success'), t('Login checks completed successfully for {{count}} account(s)', { count: succeeded }));
      } else if (succeeded === 0) {
        Alert.alert(t('Error'), t('Login checks failed for all selected accounts'));
      } else {
        Alert.alert(t('Warning'), t('Succeeded: {{succeeded}}, Failed: {{failed}}', { succeeded, failed }));
      }
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to run login verification'));
    } finally {
      setChecking(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={t('Login Twitter Account(s)')} size="md">
      <View style={styles.form}>
        <MultiSelectDropdown
          label={t('Select Account(s) to Login')}
          options={options}
          value={selected}
          onChange={setSelected}
          placeholder={t('Select Accounts')}
        />

        <SelectDropdown
          label={t('User Agent Type')}
          required
          options={USER_AGENTS}
          value={userAgent}
          onChange={setUserAgent}
          translateLabels
        />

        {results && (
          <View style={[styles.results, { backgroundColor: colors.statusBg, borderColor: colors.border }]}>
            <Text style={[styles.resultsTitle, { color: colors.ink, textAlign: align }]}>{t('Verification Outcomes')}</Text>
            <ScrollView style={styles.resultsList} nestedScrollEnabled showsVerticalScrollIndicator={false}>
              {results.map((r, i) => (
                <View key={i} style={[styles.resultRow, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Text style={[styles.resultUser, { color: colors.ink, flex: 1, textAlign: align }]} numberOfLines={1}>@{r.user}</Text>
                  {r.status ? <CheckCircle2 size={16} color="#059669" /> : <XCircle size={16} color="#DC2626" />}
                  <Text style={[styles.resultStatus, { color: r.status ? '#059669' : colors.danger }]}>
                    {r.status ? t('Login Success') : r.message || t('Failed')}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        <Button
          label={checking ? t('Logging in...') : t('Apply')}
          onPress={handleSubmit}
          loading={checking}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.md },
  resultRow: { alignItems: 'center', borderBottomWidth: 1, gap: spacing.sm, paddingVertical: spacing.sm },
  resultStatus: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  resultUser: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  results: { borderRadius: radii.lg, borderWidth: 1, padding: spacing.md },
  resultsList: { maxHeight: 180 },
  resultsTitle: { borderBottomWidth: 1, fontSize: font.sizes.sm, fontWeight: font.weights.semibold, paddingBottom: spacing.sm, marginBottom: spacing.xs },
});
