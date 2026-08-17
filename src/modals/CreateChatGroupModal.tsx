import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { fetchDepartmentProfile } from '../services/hr';
import { createChat } from '../services/conversations';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';
import type { RootStackParamList } from '../navigation/types';

type Props = {
  visible: boolean;
  onClose: () => void;
  entity: { _id: string; name: string; members_ids?: any[] } | null;
};

export function CreateChatGroupModal({ visible, onClose, entity }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [groupName, setGroupName] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [description, setDescription] = useState('');
  const [members, setMembers] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const isTeam = !!entity?.members_ids;

  useEffect(() => {
    if (visible && entity) {
      setGroupName(`${entity.name} Group`);
      setSelectedMembers([]);
      setDescription('');
      if (isTeam) {
        setMembers(
          (entity.members_ids || []).map((m: any) => ({
            id: m._id || m.user?._id,
            name: m.name || m.user?.name || t('Unknown Employee'),
          })),
        );
      } else {
        setLoading(true);
        fetchDepartmentProfile(entity._id)
          .then((profile) => {
            setMembers(
              (profile.employees || [])
                .map((emp: any) => ({
                  id: emp.user?._id || emp._id,
                  name: emp.user?.name || t('Unknown Employee'),
                }))
                .filter((m: any) => m.id),
            );
          })
          .catch(() => setMembers([]))
          .finally(() => setLoading(false));
      }
    }
  }, [visible, entity, isTeam, t]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }];

  const handleCreate = async () => {
    if (!entity) return;
    if (!groupName.trim()) {
      Alert.alert(t('Required'), t('Please enter a group name'));
      return;
    }
    if (selectedMembers.length === 0) {
      Alert.alert(t('Required'), t('Please select at least one member'));
      return;
    }
    setSaving(true);
    try {
      await createChat({
        title: groupName.trim(),
        participants_ids: selectedMembers,
        is_group: true,
        model_type: isTeam ? 'Team' : 'Department',
        model_id: entity._id,
        description: description.trim() || undefined,
      });
      onClose();
      Alert.alert(t('Success'), t('Chat group created successfully'), [
        { text: t('OK'), onPress: () => navigation.navigate('Conversations') },
      ]);
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e) || t('Failed to create group chat. Please try again.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Create Chat Group')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Group Name')}</Text>
          <TextInput style={inputStyle} placeholder={t('Enter group name')} placeholderTextColor={colors.textMuted} value={groupName} onChangeText={setGroupName} />
        </View>

        <View style={styles.field}>
          <MultiSelectDropdown
            label={t('Add Members')}
            options={members.map((m) => ({ label: m.name, value: m.id }))}
            value={selectedMembers}
            onChange={setSelectedMembers}
            placeholder={loading ? t('Loading employees...') : t('Select members')}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Description')}</Text>
          <TextInput
            style={[...inputStyle, styles.multiline]}
            placeholder={t('Enter group description...')}
            placeholderTextColor={colors.textMuted}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <Button label={t('Create Group')} onPress={handleCreate} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { height: 80, textAlignVertical: 'top' },
});
