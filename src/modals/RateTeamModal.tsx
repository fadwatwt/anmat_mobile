import React, { useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Star } from 'lucide-react-native';
import { Modal } from '../components/Modal';
import { Button } from '../components/Button';
import { useTheme } from '../context/ThemeContext';
import { rateTeam, Team } from '../services/hr';
import { extractErrorMessage } from '../lib/http';
import { font, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  onSaved: () => void;
  team?: Team | null;
};

export function RateTeamModal({ visible, onClose, onSaved, team }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setScore(team?.score || 0);
  }, [visible, team]);

  const handleSave = async () => {
    if (!team) return;
    setLoading(true);
    try {
      await rateTeam(team._id, score);
      onSaved();
      onClose();
    } catch (e) {
      Alert.alert(t('Error'), extractErrorMessage(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} onClose={onClose} title={`${team?.name || t('Team')} — ${t('Rate')}`} size="md">
      <View style={styles.body}>
        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setScore(n)} activeOpacity={0.7} hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}>
              <Star
                size={36}
                color={n <= score ? '#F59E0B' : colors.border}
                fill={n <= score ? '#F59E0B' : 'transparent'}
              />
            </TouchableOpacity>
          ))}
        </View>
        <Text style={[styles.scoreText, { color: colors.textMuted }]}>{score} / 5</Text>
        <Button label={t('Submit')} onPress={handleSave} loading={loading} />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.lg, alignItems: 'center', paddingVertical: spacing.sm },
  stars: { flexDirection: 'row', gap: spacing.sm },
  scoreText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
});
