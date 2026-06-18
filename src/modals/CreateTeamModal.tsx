import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown, MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createTeam, updateTeam, fetchDepartments, Team } from '../services/hr';
import { fetchEmployees } from '../services/employees';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Option = { label: string; value: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  team?: Team | null;
};

export function CreateTeamModal({ visible, onClose, onSaved, team }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [name, setName] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [leaderId, setLeaderId] = useState('');
  const [memberIds, setMemberIds] = useState<string[]>([]);
  const [deptOptions, setDeptOptions] = useState<Option[]>([]);
  const [empOptions, setEmpOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!team;

  useEffect(() => {
    if (!visible) return;
    setName(team?.name || '');
    setDepartmentId(team?.related_model_id || '');
    setLeaderId(team?.leader_id?._id || '');
    setMemberIds(Array.isArray(team?.members_ids) ? team!.members_ids!.map(m => m._id!).filter(Boolean) : []);
    (async () => {
      try {
        const [depts, emps] = await Promise.all([fetchDepartments(), fetchEmployees({ limit: 200 })]);
        setDeptOptions(depts.map(d => ({ label: d.name, value: d._id })));
        setEmpOptions(emps.map(e => ({ label: e.user?.name || '--', value: e.user?._id || e._id })));
      } catch { /* options stay empty */ }
    })();
  }, [visible, team]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    setLoading(true);
    try {
      const payload = {
        name: name.trim(),
        related_model_type: departmentId ? ('Department' as const) : undefined,
        related_model_id: departmentId || undefined,
        leader_id: leaderId || undefined,
        members_ids: memberIds,
      };
      if (isEdit && team) await updateTeam(team._id, payload);
      else await createTeam(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Team') : t('Create a Team')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Team Name')}</Text>
          <TextInput
            style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
            placeholder={t('Enter team name')}
            placeholderTextColor={colors.textMuted}
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Department')}</Text>
          <SelectDropdown options={deptOptions} value={departmentId} onChange={setDepartmentId} placeholder={t('Select Department')} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Team Leader')}</Text>
          <SelectDropdown options={empOptions} value={leaderId} onChange={setLeaderId} placeholder={t('Select Team Leader')} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Team Members')}</Text>
          <MultiSelectDropdown options={empOptions} value={memberIds} onChange={setMemberIds} placeholder={t('Select members')} />
        </View>
        <Button label={t('Save')} onPress={handleSave} loading={loading} />
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
