import { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, Info, AlertTriangle } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchEmployees, fetchNotificationTypes, sendNotification } from '../services/employees';
import { font, radii, spacing } from '../theme';
import type { EmployeeDetailItem, NotificationType } from '../types';

const ICON_MAP: Record<string, React.ReactNode> = {
  RiErrorWarningLine: <AlertTriangle size={16} color="#EF4444" />,
  RiBellLine: <Bell size={16} color="#F59E0B" />,
  RiInformationLine: <Info size={16} color="#3B82F6" />,
};

const COLOR_MAP: Record<string, string> = {
  red: '#EF4444',
  yellow: '#F59E0B',
  blue: '#3B82F6',
};

type Props = {
  visible: boolean;
  onClose: () => void;
};

export function SendNotificationModal({ visible, onClose }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const { isRTL } = useLocale();
  const [types, setTypes] = useState<NotificationType[]>([]);
  const [employees, setEmployees] = useState<EmployeeDetailItem[]>([]);
  const [selectedType, setSelectedType] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (visible) {
      fetchNotificationTypes().then(setTypes).catch(() => {});
      fetchEmployees().then(setEmployees).catch(() => {});
      setSelectedType('');
      setTitle('');
      setMessage('');
      setSelectedEmployees([]);
    }
  }, [visible]);

  const handleSend = async () => {
    if (!selectedType) { Alert.alert(t('Error'), t('Please select a notification type')); return; }
    if (!title.trim()) { Alert.alert(t('Error'), t('Please enter a title')); return; }
    if (!message.trim()) { Alert.alert(t('Error'), t('Please enter a message')); return; }

    setSending(true);
    try {
      const hasAll = selectedEmployees.includes('all');
      await sendNotification({
        notification_type_id: selectedType,
        title: title.trim(),
        message: message.trim(),
        target: hasAll ? 'all_employees' : 'specific_employees',
        employee_ids: hasAll ? undefined : selectedEmployees,
      });
      onClose();
    } catch (e: any) {
      Alert.alert(t('Error'), e?.data?.message || t('Failed to send notification'));
    } finally {
      setSending(false);
    }
  };

  const typeOptions = types.map(t => ({
    id: t._id,
    name: t.name,
    icon: ICON_MAP[t.icon] || <Bell size={16} />,
    color: COLOR_MAP[t.color] || '#6B7280',
    description: t.description,
  }));

  return (
    <Modal visible={visible} onClose={onClose} title={t('Send Notification')} size="md">
      <View style={s.scroll}>
        <Text style={[s.label, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Notification Type')} <Text style={s.required}>*</Text></Text>
        <View style={s.typeRow}>
          {typeOptions.map(type => (
            <TouchableOpacity
              key={type.id}
              onPress={() => setSelectedType(type.id)}
              style={[s.typeChip, { borderColor: selectedType === type.id ? colors.primary : colors.border },
                selectedType === type.id && { backgroundColor: '#EEF2FF' }
              ]}
            >
              {type.icon}
              <Text style={[s.typeChipText, selectedType === type.id && { color: colors.primary, textAlign: isRTL ? 'right' : 'left' }]}>{type.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <MultiSelectDropdown
          label={t('Employees')}
          options={[
            { label: t('All Employees'), value: 'all' },
            ...employees.map(emp => ({
              label: emp.user?.name || t('Unknown'),
              value: emp.user_id,
            })),
          ]}
          value={selectedEmployees}
          onChange={selected => {
            const justAddedAll = selected.includes('all') && !selectedEmployees.includes('all');
            const removedAll = !selected.includes('all') && selectedEmployees.includes('all');
            if (justAddedAll) {
              setSelectedEmployees(['all']);
            } else if (removedAll || !selected.includes('all')) {
              setSelectedEmployees(selected.filter(s => s !== 'all'));
            } else {
              setSelectedEmployees(selected);
            }
          }}
          placeholder={t('Select employees...')}
        />

        <Text style={[s.label, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Title')} <Text style={s.required}>*</Text></Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder={t('Enter notification title...')}
          placeholderTextColor={colors.textMuted}
          style={[s.input, { backgroundColor: colors.background, borderColor: colors.border, color: colors.ink }]}
        />

        <Text style={[s.label, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Message')} <Text style={s.required}>*</Text></Text>
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder={t('Enter message...')}
          placeholderTextColor={colors.textMuted}
          multiline
          numberOfLines={4}
          style={[s.input, s.textArea, { backgroundColor: colors.background, borderColor: colors.border, color: colors.ink }]}
        />

        <TouchableOpacity onPress={handleSend} disabled={sending} style={[s.btn, { backgroundColor: colors.primary }, sending && s.btnDisabled]}>
          <Text style={[s.btnText, { textAlign: isRTL ? 'right' : 'left' }]}>{sending ? t('Sending...') : t('Send')}</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  scroll: { gap: spacing.md, paddingBottom: spacing.lg },
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  required: { color: '#EF4444' },
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: radii.xl,
    borderWidth: 2,
  },
  typeChipText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, color: '#374151' },
  input: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: font.sizes.sm },
  textArea: { minHeight: 100, textAlignVertical: 'top' },
  btn: { paddingVertical: 12, borderRadius: radii.lg, alignItems: 'center', marginTop: spacing.sm },
  btnDisabled: { opacity: 0.5 },
  btnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.bold },
});
