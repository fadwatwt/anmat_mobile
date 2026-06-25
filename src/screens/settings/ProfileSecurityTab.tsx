import { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { User, Lock, Check, Eye, EyeOff } from 'lucide-react-native';
import { SelectDropdown } from '../../components/SelectDropdown';
import { useTheme } from '../../context/ThemeContext';
import { useLocale } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { font, radii, spacing } from '../../theme';
import {
  fetchMe,
  updateProfile,
  updateEmployeeDetail,
  changePassword,
} from '../../services/profile';

const COUNTRIES = [
  { label: 'Egypt', value: 'Egypt' },
  { label: 'Saudi Arabia', value: 'Saudi Arabia' },
  { label: 'UAE', value: 'UAE' },
  { label: 'Jordan', value: 'Jordan' },
];

const CITIES: Record<string, { label: string; value: string }[]> = {
  Egypt: [
    { label: 'Cairo', value: 'Cairo' },
    { label: 'Alexandria', value: 'Alexandria' },
    { label: 'Giza', value: 'Giza' },
  ],
  'Saudi Arabia': [
    { label: 'Riyadh', value: 'Riyadh' },
    { label: 'Jeddah', value: 'Jeddah' },
    { label: 'Dammam', value: 'Dammam' },
  ],
  default: [
    { label: 'Dubai', value: 'Dubai' },
    { label: 'Amman', value: 'Amman' },
  ],
};

function strengthColor(len: boolean, upper: boolean, num: boolean) {
  if (len && upper && num) return '#38C793';
  if (len && upper) return '#F17B2C';
  return '#DF1C41';
}

export default function ProfileSecurityTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user, refreshUser } = useAuth();
  const { isRTL } = useLocale();

  const [activeSection, setActiveSection] = useState<'profile' | 'password'>('profile');
  const isEmployee = user?.type === 'Employee';
  const isAdmin = user?.type === 'Admin';

  // Profile form
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [pCountry, setPCountry] = useState('');
  const [pCity, setPCity] = useState('');
  const [dob, setDob] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);

  // Password form
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwdLoading, setPwdLoading] = useState(false);

  const pwdLen = newPwd.length >= 8;
  const pwdUpper = /[A-Z]/.test(newPwd);
  const pwdNum = /\d/.test(newPwd);
  const pwdColor = strengthColor(pwdLen, pwdUpper, pwdNum);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const cityOptions = CITIES[pCountry] || CITIES.default;

  const handleSaveProfile = async () => {
    if (!name.trim()) {
      Alert.alert(t('Error'), t('Name is required'));
      return;
    }
    setProfileLoading(true);
    try {
      await updateProfile({ name: name.trim(), phone: phone.trim() }, isAdmin);
      if (isEmployee) {
        await updateEmployeeDetail({
          country: pCountry,
          city: pCity,
          date_of_birth: dob,
        });
      }
      await refreshUser();
      Alert.alert(t('Success'), t('Profile updated successfully'));
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update profile'));
    } finally {
      setProfileLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPwd || !newPwd || !confirmPwd) {
      Alert.alert(t('Error'), t('All fields are required'));
      return;
    }
    if (newPwd !== confirmPwd) {
      Alert.alert(t('Error'), t('Passwords must match'));
      return;
    }
    if (!pwdLen || !pwdUpper || !pwdNum) {
      Alert.alert(t('Error'), t('Password must be at least 8 characters with 1 uppercase and 1 number'));
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword(
        {
          old_password: currentPwd,
          new_password: newPwd,
          new_password_confirmation: confirmPwd,
        },
        isAdmin,
      );
      Alert.alert(t('Success'), t('Password updated successfully'));
      setCurrentPwd('');
      setNewPwd('');
      setConfirmPwd('');
    } catch (e: any) {
      Alert.alert(t('Error'), e?.response?.data?.message || t('Failed to update password'));
    } finally {
      setPwdLoading(false);
    }
  };

  const PwdInput = ({
    label,
    value,
    onChange,
    show,
    toggleShow,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    show: boolean;
    toggleShow: () => void;
  }) => (
    <View>
      <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t(label)}</Text>
      <View style={[styles.pwdInputWrap, { borderColor: colors.border, backgroundColor: colors.background }]}>
        <TextInput
          style={[styles.pwdInput, { color: colors.ink, textAlign: align }]}
          value={value}
          onChangeText={onChange}
          secureTextEntry={!show}
          placeholderTextColor={colors.textMuted}
        />
        <TouchableOpacity onPress={toggleShow} style={styles.eyeBtn}>
          {show ? <EyeOff size={18} color={colors.textMuted} /> : <Eye size={18} color={colors.textMuted} />}
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Section Toggle */}
      <View style={[styles.sectionToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'profile' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('profile')}
        >
          <User size={16} color={activeSection === 'profile' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sectionBtnText, { color: activeSection === 'profile' ? colors.primary : colors.textMuted }]}>
            {t('Personal Information')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sectionBtn, activeSection === 'password' && { backgroundColor: colors.primary + '15' }]}
          onPress={() => setActiveSection('password')}
        >
          <Lock size={16} color={activeSection === 'password' ? colors.primary : colors.textMuted} />
          <Text style={[styles.sectionBtnText, { color: activeSection === 'password' ? colors.primary : colors.textMuted }]}>
            {t('Change Password')}
          </Text>
        </TouchableOpacity>
      </View>

      {activeSection === 'profile' ? (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Personal Information')}</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Update your personal details')}</Text>

          <View style={styles.fieldGroup}>
            <View>
              <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t('Name')}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, textAlign: align }]}
                value={name}
                onChangeText={setName}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t('Phone')}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, textAlign: align }]}
                value={phone}
                onChangeText={setPhone}
                placeholderTextColor={colors.textMuted}
              />
            </View>

            <View>
              <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t('Email')}</Text>
              <TextInput
                style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.textMuted, textAlign: align }]}
                value={user?.email || ''}
                editable={false}
              />
            </View>

            {isEmployee && (
              <>
                <SelectDropdown label={t('Country')} options={COUNTRIES} value={pCountry} onChange={(v) => { setPCountry(v); setPCity(''); }} translateLabels />
                {pCountry ? (
                  <SelectDropdown label={t('City')} options={cityOptions} value={pCity} onChange={setPCity} translateLabels />
                ) : null}
                <View>
                  <Text style={[styles.fieldLabel, { color: colors.textMuted, textAlign: align }]}>{t('Date of Birth')}</Text>
                  <TextInput
                    style={[styles.input, { borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, textAlign: align }]}
                    value={dob}
                    onChangeText={setDob}
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor={colors.textMuted}
                  />
                </View>
              </>
            )}
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveProfile}
            disabled={profileLoading}
          >
            <Text style={styles.saveBtnText}>{profileLoading ? t('Saving...') : t('Apply Changes')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[styles.panel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Change Password')}</Text>
          <Text style={[styles.sectionDesc, { color: colors.textMuted, textAlign: align }]}>{t('Update password for enhanced account security.')}</Text>

          <View style={styles.fieldGroup}>
            <PwdInput label="Current Password" value={currentPwd} onChange={setCurrentPwd} show={showCurrent} toggleShow={() => setShowCurrent(!showCurrent)} />
            <PwdInput label="New Password" value={newPwd} onChange={setNewPwd} show={showNew} toggleShow={() => setShowNew(!showNew)} />
            <PwdInput label="Confirm New Password" value={confirmPwd} onChange={setConfirmPwd} show={showConfirm} toggleShow={() => setShowConfirm(!showConfirm)} />
          </View>

          {newPwd ? (
            <View style={styles.strengthWrap}>
              <View style={styles.strengthBar}>
                {[pwdLen, pwdUpper, pwdNum].map((v, i) => (
                  <View
                    key={i}
                    style={[
                      styles.strengthSeg,
                      { backgroundColor: v ? pwdColor : colors.border },
                    ]}
                  />
                ))}
              </View>
              <Text style={[styles.strengthText, { color: colors.textMuted, textAlign: align }]}>{t('Weak password. Must contain at least:')}</Text>
              {[
                { label: t('At least 1 uppercase letter'), ok: pwdUpper },
                { label: t('At least 1 number'), ok: pwdNum },
                { label: t('At least 8 characters'), ok: pwdLen },
              ].map((item, i) => (
                <View key={i} style={[styles.requirementRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                  <Check size={14} color={item.ok ? '#38C793' : colors.textMuted} />
                  <Text style={[styles.requirementText, { color: item.ok ? '#38C793' : colors.textMuted, textAlign: align }]}>{item.label}</Text>
                </View>
              ))}
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleChangePassword}
            disabled={pwdLoading}
          >
            <Text style={styles.saveBtnText}>{pwdLoading ? t('Saving...') : t('Apply Changes')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { gap: spacing.md, padding: spacing.md, paddingBottom: 60 },
  sectionToggle: {
    flexDirection: 'row',
    borderRadius: radii.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  sectionBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    paddingVertical: spacing.sm + 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionBtnText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
  panel: {
    borderWidth: 1,
    borderRadius: radii.xxl,
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.bold },
  sectionDesc: { fontSize: font.sizes.xs, marginTop: -spacing.sm },
  fieldGroup: { gap: spacing.md },
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
  pwdInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radii.lg,
    height: 44,
  },
  pwdInput: { flex: 1, paddingHorizontal: spacing.md, fontSize: font.sizes.sm },
  eyeBtn: { paddingHorizontal: spacing.sm },
  strengthWrap: { gap: spacing.xs },
  strengthBar: { flexDirection: 'row', gap: 4, height: 4 },
  strengthSeg: { flex: 1, borderRadius: 2 },
  strengthText: { fontSize: font.sizes.xs, marginTop: spacing.xs },
  requirementRow: { alignItems: 'center', gap: spacing.xs },
  requirementText: { fontSize: font.sizes.xs },
});
