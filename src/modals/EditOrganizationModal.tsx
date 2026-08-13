import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Organization, updateOrganization } from '../services/organizations';
import { fetchSubscriberIndustries } from '../services/industries';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const COUNTRIES = ['Palestine', 'Jordan', 'Egypt', 'UAE', 'Saudi Arabia'];
const CITIES = ['Gaza', 'Ramallah', 'Jerusalem', 'Nablus', 'Hebron', 'Amman', 'Cairo', 'Dubai', 'Riyadh'];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  organization: Organization | null;
};

export function EditOrganizationModal({ visible, onClose, onSaved, organization }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [name, setName] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [industries, setIndustries] = useState<{ label: string; value: string }[]>([]);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setName(organization?.name || '');
      setIndustryId(organization?.industry?._id || organization?.industry_id || '');
      setEmail(organization?.email || '');
      setPhone(organization?.phone || '');
      setWebsite(organization?.website || '');
      setCountry(organization?.country || '');
      setCity(organization?.city || '');
      fetchSubscriberIndustries()
        .then(list => setIndustries(list.map(i => ({ label: i.name, value: i._id }))))
        .catch(() => setIndustries([]));
    }
  }, [visible, organization]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert(t('Required'), t('Name is required')); return; }
    if (!industryId) { Alert.alert(t('Required'), t('Industry is required')); return; }
    if (!email.trim()) { Alert.alert(t('Required'), t('Email is required')); return; }
    if (!phone.trim()) { Alert.alert(t('Required'), t('Phone is required')); return; }
    if (!country) { Alert.alert(t('Required'), t('Country is required')); return; }
    if (!city) { Alert.alert(t('Required'), t('City is required')); return; }
    setSaving(true);
    try {
      await updateOrganization({
        name: name.trim(),
        industry_id: industryId,
        email: email.trim(),
        phone: phone.trim(),
        website: website.trim(),
        country,
        city,
      });
      Alert.alert(t('Success'), t('Organization updated successfully!'));
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to update organization. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Edit Organization')} size="lg">
      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Name')} *</Text>
              <TextInput style={inputStyle} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
            </View>
            <View style={[styles.field, styles.rowField]}>
              <SelectDropdown
                label={t('Industry')}
                required
                options={industries}
                value={industryId}
                onChange={setIndustryId}
                placeholder={t('Select industry...')}
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Email')} *</Text>
              <TextInput style={inputStyle} value={email} onChangeText={setEmail} keyboardType="email-address" placeholderTextColor={colors.textMuted} />
            </View>
            <View style={[styles.field, styles.rowField]}>
              <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Phone')} *</Text>
              <TextInput style={inputStyle} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textMuted} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Website')}</Text>
            <TextInput style={inputStyle} value={website} onChangeText={setWebsite} keyboardType="url" placeholder="https://example.com" placeholderTextColor={colors.textMuted} />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, styles.rowField]}>
              <SelectDropdown
                label={t('Country')}
                required
                translateLabels
                options={COUNTRIES.map(c => ({ label: c, value: c }))}
                value={country}
                onChange={setCountry}
                placeholder={t('Select country...')}
              />
            </View>
            <View style={[styles.field, styles.rowField]}>
              <SelectDropdown
                label={t('City')}
                required
                translateLabels
                options={CITIES.map(c => ({ label: c, value: c }))}
                value={city}
                onChange={setCity}
                placeholder={t('Select city...')}
              />
            </View>
          </View>

          <Button label={t('Save Changes')} onPress={handleSave} loading={saving} />
        </View>
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md, paddingBottom: spacing.lg },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  row: { flexDirection: 'row', gap: spacing.sm },
  rowField: { flex: 1 },
});
