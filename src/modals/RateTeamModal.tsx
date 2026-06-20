import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { rateTeam, Team } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  team?: Team | null;
};

type Ratings = { timeDelivery: number; quality: number; communication: number };

const CATEGORIES: { key: keyof Ratings; labelKey: string }[] = [
  { key: 'timeDelivery', labelKey: 'Time Delivery' },
  { key: 'quality', labelKey: 'Quality' },
  { key: 'communication', labelKey: 'Communication' },
];

function StarRow({ value, onChange, color, border }: { value: number; onChange: (n: number) => void; color: string; border: string }) {
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((n) => (
        <TouchableOpacity key={n} onPress={() => onChange(n)} activeOpacity={0.7} hitSlop={{ top: 6, bottom: 6, left: 3, right: 3 }}>
          <Star size={28} color={n <= value ? color : border} fill={n <= value ? color : 'transparent'} />
        </TouchableOpacity>
      ))}
    </View>
  );
}

export function RateTeamModal({ visible, onClose, onSaved, team }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [ratings, setRatings] = useState<Ratings>({ timeDelivery: 0, quality: 0, communication: 0 });
  const [comments, setComments] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      setRatings({ timeDelivery: 0, quality: 0, communication: 0 });
      setComments('');
    }
  }, [visible, team]);

  // Average of the filled criteria, rounded to one decimal (matches the web).
  const filled = [ratings.timeDelivery, ratings.quality, ratings.communication].filter((v) => v > 0);
  const average = filled.length ? Math.round((filled.reduce((a, b) => a + b, 0) / filled.length) * 10) / 10 : 0;

  const setOne = (key: keyof Ratings, n: number) => setRatings((prev) => ({ ...prev, [key]: n }));

  const handleSave = async () => {
    if (!team) return;
    if (average === 0) {
      Alert.alert(t('Required'), t('Please add at least one rating'));
      return;
    }
    setLoading(true);
    try {
      await rateTeam(team._id, average);
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
    <Modal visible={visible} onClose={onClose} title={`${team?.name || t('Team')} — ${t('Rate')}`} size="md">
      <View style={styles.body}>
        {CATEGORIES.map((cat) => (
          <View key={cat.key} style={[styles.criterion, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.criterionLabel, { color: colors.ink, textAlign: align }]}>{t(cat.labelKey)}</Text>
            <StarRow value={ratings[cat.key]} onChange={(n) => setOne(cat.key, n)} color="#F59E0B" border={colors.border} />
          </View>
        ))}

        <View style={[styles.avgRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.avgLabel, { color: colors.textMuted }]}>{t('Average Score')}</Text>
          <Text style={[styles.avgValue, { color: colors.ink }]}>{average} / 5</Text>
        </View>

        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.textMuted, textAlign: align }]}>{t('Comment')}</Text>
          <TextInput
            style={[styles.input, { color: colors.ink, backgroundColor: colors.statusBg, borderColor: colors.border, textAlign: align }]}
            placeholder={t('Write your comments here')}
            placeholderTextColor={colors.textMuted}
            value={comments}
            onChangeText={setComments}
            multiline
            numberOfLines={3}
          />
        </View>

        <Button label={t('Submit')} onPress={handleSave} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.md, paddingVertical: spacing.xs },
  criterion: { alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  criterionLabel: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, flex: 1 },
  stars: { flexDirection: 'row', gap: spacing.xs },
  avgRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, paddingTop: spacing.md },
  avgLabel: { fontSize: font.sizes.sm },
  avgValue: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  field: { gap: spacing.xs },
  label: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  input: { borderRadius: radii.lg, borderWidth: 1, fontSize: font.sizes.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, minHeight: 70, textAlignVertical: 'top' },
});
