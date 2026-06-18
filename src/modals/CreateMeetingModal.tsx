import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { SelectDropdown, MultiSelectDropdown } from '../components/SelectDropdown';
import { DateField } from '../components/DateField';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createMeeting, updateMeeting, fetchDepartments, Meeting } from '../services/hr';
import { fetchEmployees } from '../services/employees';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Option = { label: string; value: string };

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  meeting?: Meeting | null;
};

const pad = (n: number) => String(n).padStart(2, '0');
const toDatePart = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};
const toTimePart = (value?: string | null) => {
  if (!value) return '';
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? '' : `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const typeOptions: Option[] = [
  { label: 'Online', value: 'online' },
  { label: 'In Person', value: 'person' },
];

export function CreateMeetingModal({ visible, onClose, onSaved, meeting }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [topics, setTopics] = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [departmentIds, setDepartmentIds] = useState<string[]>([]);
  const [organizerIds, setOrganizerIds] = useState<string[]>([]);
  const [participantIds, setParticipantIds] = useState<string[]>([]);
  const [deptOptions, setDeptOptions] = useState<Option[]>([]);
  const [empOptions, setEmpOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!meeting;

  useEffect(() => {
    if (!visible) return;
    setTitle(meeting?.title || '');
    setType(meeting?.type || '');
    setTopics(meeting?.topics || '');
    setDescription(meeting?.description || '');
    setLink(meeting?.meeting_link || '');
    setDate(toDatePart(meeting?.scheduled_at));
    setTime(toTimePart(meeting?.scheduled_at));
    setDepartmentIds(meeting?.departments_ids?.map(d => d._id!).filter(Boolean) || []);
    setOrganizerIds(meeting?.organizers_ids?.map(o => o._id!).filter(Boolean) || []);
    setParticipantIds(meeting?.participants_ids?.map(p => p._id!).filter(Boolean) || []);
    (async () => {
      try {
        const [depts, emps] = await Promise.all([fetchDepartments(), fetchEmployees({ limit: 200 })]);
        setDeptOptions(depts.map(d => ({ label: d.name, value: d._id })));
        setEmpOptions(emps.map(e => ({ label: e.user?.name || '--', value: e.user?._id || e._id })));
      } catch { /* options stay empty */ }
    })();
  }, [visible, meeting]);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    // Combine the selected date + time into an ISO timestamp; fall back to now.
    let iso: string | undefined;
    if (date) {
      const parsed = new Date(`${date}T${time || '00:00'}`);
      if (!Number.isNaN(parsed.getTime())) iso = parsed.toISOString();
    }
    setLoading(true);
    try {
      const payload = {
        title: title.trim(),
        type: type || undefined,
        topics: topics.trim() || undefined,
        description: description.trim() || undefined,
        meeting_link: link.trim() || undefined,
        scheduled_at: iso || new Date().toISOString(),
        departments_ids: departmentIds,
        organizers_ids: organizerIds,
        participants_ids: participantIds,
      };
      if (isEdit && meeting) await updateMeeting(meeting._id, payload);
      else await createMeeting(payload);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  return (
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Meeting') : t('Create a Meeting')} size="lg">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Meeting Title')}</Text>
          <TextInput style={inputStyle} placeholder={t('Meeting Title')} placeholderTextColor={colors.textMuted} value={title} onChangeText={setTitle} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Type')}</Text>
          <SelectDropdown options={typeOptions} value={type} onChange={setType} placeholder={t('Select Type')} translateLabels />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Departments')}</Text>
          <MultiSelectDropdown options={deptOptions} value={departmentIds} onChange={setDepartmentIds} placeholder={t('Select Departments')} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Organizers')}</Text>
          <MultiSelectDropdown options={empOptions} value={organizerIds} onChange={setOrganizerIds} placeholder={t('Select Organizers')} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Participants')}</Text>
          <MultiSelectDropdown options={empOptions} value={participantIds} onChange={setParticipantIds} placeholder={t('Select Participants')} />
        </View>
        <View style={[styles.rowFields, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={styles.flex1}>
            <DateField mode="date" label={t('Date')} value={date} onChange={setDate} />
          </View>
          <View style={styles.flex1}>
            <DateField mode="time" label={t('Meeting Time')} value={time} onChange={setTime} />
          </View>
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Topics')}</Text>
          <TextInput style={inputStyle} placeholder={t('Topics')} placeholderTextColor={colors.textMuted} value={topics} onChangeText={setTopics} />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Meeting Link')}</Text>
          <TextInput style={inputStyle} placeholder="https://..." placeholderTextColor={colors.textMuted} value={link} onChangeText={setLink} autoCapitalize="none" />
        </View>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Description')}</Text>
          <TextInput
            style={[...inputStyle, styles.multiline]}
            placeholder={t('Enter Description')}
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>
        <Button label={t('Save')} onPress={handleSave} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  rowFields: { gap: spacing.md },
  flex1: { flex: 1 },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { height: 80, textAlignVertical: 'top' },
});
