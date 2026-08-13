import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { saveProjectAsTemplate, Project } from '../services/projects';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  project: Project | null;
  onClose: () => void;
  onSaved: () => void;
};

export function SaveAsTemplateModal({ visible, project, onClose, onSaved }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [estimatedDuration, setEstimatedDuration] = useState('1');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible && project) {
      setName(project.name || project.title || '');
      setDescription(project.description || '');
      setCategory('');
      setEstimatedDuration('1');
      setError('');
    }
  }, [visible, project]);

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const inputStyle = [
    styles.input,
    { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align },
  ];

  const handleSubmit = async () => {
    if (!project) return;
    if (!name.trim()) { setError(t('Required')); return; }
    if (!category.trim()) { setError(t('Required')); return; }
    setSaving(true);
    setError('');
    try {
      const rawDept = project.department_id as any;
      const departmentId = rawDept?._id || rawDept || undefined;
      await saveProjectAsTemplate(project._id, {
        name: name.trim(),
        description: description.trim() || undefined,
        category: category.trim(),
        estimated_duration: Number(estimatedDuration) || 1,
        department_id: departmentId,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(extractErrorMessage(e) || t('Failed to save template'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={t('Save as Template')} size="sm">
      <View style={styles.form}>
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Template Name')}</Text>
          <TextInput style={inputStyle} value={name} onChangeText={setName} placeholder={t('Enter template name')} placeholderTextColor={colors.textMuted} editable={!saving} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Description')}</Text>
          <TextInput style={[inputStyle, styles.multiline]} value={description} onChangeText={setDescription} placeholder={t('Enter template description')} placeholderTextColor={colors.textMuted} multiline editable={!saving} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Category')}</Text>
          <TextInput style={inputStyle} value={category} onChangeText={setCategory} placeholder={t('Enter category')} placeholderTextColor={colors.textMuted} editable={!saving} />
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Estimated Duration (Days)')}</Text>
          <TextInput style={inputStyle} value={estimatedDuration} onChangeText={setEstimatedDuration} keyboardType="numeric" placeholder={t('Enter estimated duration')} placeholderTextColor={colors.textMuted} editable={!saving} />
        </View>

        {error ? (
          <View style={[styles.notice, { backgroundColor: colors.dangerBg || '#FEE2E5' }]}>
            <Text style={[styles.noticeText, { color: colors.dangerText || '#C9372C', textAlign: align }]}>{error}</Text>
          </View>
        ) : null}

        <Button label={t('Save')} onPress={handleSubmit} loading={saving} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  field: { gap: spacing.xs },
  form: { gap: spacing.md },
  input: {
    borderRadius: radii.lg,
    borderWidth: 1,
    fontSize: font.sizes.sm,
    minHeight: 44,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  multiline: { minHeight: 64, textAlignVertical: 'top' },
  notice: { borderRadius: radii.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
  noticeText: { fontSize: font.sizes.sm },
});
