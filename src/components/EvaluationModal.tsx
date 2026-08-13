import { useEffect, useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { Modal } from './Modal';
import { StarRatingInput } from './StarRatingInput';
import { Button } from './Button';
import { SelectDropdown } from './SelectDropdown';
import { fetchOrganizationSettings, OrganizationSettings } from '../services/settings';
import { font, radii, spacing } from '../theme';

const DEFAULT_CATEGORIES = [
  { key: 'quality', titleKey: 'Quality of Deliverables' },
  { key: 'speed', titleKey: 'Adherence to Deadlines' },
  { key: 'communication', titleKey: 'Team Collaboration' },
];

type Props = {
  visible: boolean;
  onClose: () => void;
  onSubmit: (data: EvaluationData) => void;
  type?: 'task' | 'project' | 'employee';
  hasStages?: boolean;
  isSubmitting?: boolean;
};

export type EvaluationData = {
  evaluation_method: string;
  evaluation_rating?: number;
  overall_rating?: number;
  evaluation_criteria?: Record<string, number>;
  comment?: string;
};

export function EvaluationModal({ visible, onClose, onSubmit, type = 'task', hasStages = false, isSubmitting = false }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [evaluationMethod, setEvaluationMethod] = useState('MANUAL');
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (visible) {
      fetchOrganizationSettings().then((org: OrganizationSettings) => {
        if (org.rating_types && org.rating_types.length > 0) {
          setCategories(org.rating_types.map((item: any) => {
            if (typeof item === 'string') return { key: item.toLowerCase().replace(/\s+/g, '_'), titleKey: item };
            return { key: item._id || item.title.toLowerCase().replace(/\s+/g, '_'), titleKey: item.title };
          }));
        }
      }).catch(() => {});
    }
  }, [visible]);

  useEffect(() => {
    const initial: Record<string, number> = {};
    categories.forEach((cat) => { initial[cat.key] = 0; });
    setRatings(initial);
    setComment('');
    setEvaluationMethod('MANUAL');
  }, [categories, visible]);

  const handleSubmit = () => {
    const values = Object.values(ratings);
    const avgRating = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;

    if (type === 'task') {
      onSubmit({
        evaluation_method: 'MANUAL',
        evaluation_rating: avgRating,
        evaluation_criteria: ratings,
        comment,
      });
    } else {
      onSubmit({
        evaluation_method: 'MANUAL',
        overall_rating: avgRating,
        evaluation_criteria: ratings,
        comment,
      });
    }
  };

  const methodOptions = [{ value: 'MANUAL', label: t('Manual Evaluation') }];
  if (type === 'project') {
    methodOptions.push({ value: 'AUTO_FROM_TASKS', label: t('Auto (Average of internal tasks)') });
  } else if (type === 'task' && hasStages) {
    methodOptions.push({ value: 'AUTO_FROM_STAGES', label: t('Auto (Average of internal stages)') });
  } else if (type === 'employee') {
    methodOptions.push({ value: 'AUTO', label: t('Auto (Average of employee performance)') });
  }

  const allZero = Object.values(ratings).every(v => v === 0);

  const titleKey = type === 'employee' ? 'Evaluate Employee' : type === 'project' ? 'Evaluate Project' : 'Evaluate Task';

  return (
    <Modal visible={visible} onClose={onClose} title={t(titleKey)} size="md">
      {(type === 'project' || (type === 'task' && hasStages) || type === 'employee') && (
        <View style={s.methodRow}>
          <Text style={[s.label, { color: colors.ink }]}>{t('Evaluation Method')}</Text>
          <SelectDropdown
            value={evaluationMethod}
            onChange={(val) => {
              setEvaluationMethod(val);
              if (val !== 'MANUAL') {
                const reset: Record<string, number> = {};
                categories.forEach((cat) => { reset[cat.key] = 0; });
                setRatings(reset);
              }
            }}
            options={methodOptions}
          />
        </View>
      )}

      {evaluationMethod === 'MANUAL' && (
        <View style={[s.ratingsBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          {categories.map((cat) => (
            <StarRatingInput
              key={cat.key}
              title={t(cat.titleKey)}
              value={ratings[cat.key] || 0}
              onChange={(val) => setRatings(prev => ({ ...prev, [cat.key]: val }))}
            />
          ))}
        </View>
      )}

      <View style={s.commentBox}>
        <Text style={[s.label, { color: colors.ink }]}>{t('Add a Comment')} ({t('Optional')})</Text>
        <TextInput
          style={[s.textarea, { color: colors.ink, borderColor: colors.border, backgroundColor: colors.surface, textAlign: isRTL ? 'right' : 'left' }]}
          placeholder={t('Write your comments here...')}
          placeholderTextColor={colors.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
      </View>

      <Button
        label={t('Submit Evaluation')}
        onPress={handleSubmit}
        loading={isSubmitting}
      />
    </Modal>
  );
}

const s = StyleSheet.create({
  commentBox: { gap: spacing.xs },
  label: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  methodRow: { gap: spacing.xs },
  ratingsBox: { borderWidth: 1, borderRadius: radii.xl, padding: spacing.md, gap: spacing.sm },
  textarea: { borderWidth: 1, borderRadius: radii.lg, padding: spacing.sm, fontSize: font.sizes.sm, minHeight: 80 },
});
