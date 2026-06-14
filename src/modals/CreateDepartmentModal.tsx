import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { MultiSelectDropdown } from '../components/SelectDropdown';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { createDepartment, updateDepartment, fetchPositions } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';
import type { Position } from '../types';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  department?: any | null;
};

export function CreateDepartmentModal({ visible, onClose, onSaved, department }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rate, setRate] = useState('0');
  const [positionsIds, setPositionsIds] = useState<string[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!department;

  useEffect(() => {
    if (visible) {
      fetchPositions().then(setPositions).catch(() => {});
      setName(department?.name || '');
      setDescription(department?.description || '');
      setRate(department?.rate != null ? String(department.rate) : '0');
      const ids = (department?.positions_ids || department?.positions || [])
        .map((p: any) => (typeof p === 'object' ? p._id : p))
        .filter(Boolean);
      setPositionsIds(ids);
    }
  }, [visible, department]);

  const togglePosition = (id: string) => {
    setPositionsIds(prev => (prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]));
  };

  const handleSave = async () => {
    if (!name.trim() || !description.trim()) {
      Alert.alert(t('Required'), t('Please fill all fields'));
      return;
    }
    const rateNum = Number(rate);
    if (isNaN(rateNum) || rateNum < 0 || rateNum > 1) {
      Alert.alert(t('Required'), t('Enter rate (0 - 1)'));
      return;
    }
    setLoading(true);
    try {
      const payload: any = {
        name: name.trim(),
        description: description.trim(),
        rate: rateNum,
        positions_ids: positionsIds,
      };
      if (isEdit && department) await updateDepartment(department._id, payload);
      else await createDepartment(payload);
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
    <Modal visible={visible} onClose={onClose} title={isEdit ? t('Edit Department') : t('Create a Department')} size="md">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Department Name')}</Text>
          <TextInput style={inputStyle} placeholder={t('Enter department name')} placeholderTextColor={colors.textMuted} value={name} onChangeText={setName} />
        </View>

        <View style={styles.field}>
          <MultiSelectDropdown
            label={t('Positions')}
            options={positions.map((p: any) => ({ label: p.title || p.name, value: p._id }))}
            value={positionsIds}
            onChange={setPositionsIds}
            placeholder={t('Select positions...')}
          />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Rate')} (0 - 1)</Text>
          <TextInput style={inputStyle} placeholder={t('Enter rate (0 - 1)')} placeholderTextColor={colors.textMuted} value={rate} onChangeText={setRate} keyboardType="numeric" />
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
            numberOfLines={4}
          />
        </View>

        <Button label={t('Save')} onPress={handleSave} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  chip: { borderRadius: radii.full, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 8 },
  chipText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  hint: { color: '#9CA3AF', fontSize: font.sizes.xs },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { height: 90, textAlignVertical: 'top' },
});
