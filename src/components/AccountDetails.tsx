import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii } from '../theme';

type Props = {
  name?: string;
  role?: string;
  imageUrl?: string;
};

export function AccountDetails({ name, role, imageUrl }: Props) {
  const { isRTL } = useLocale();
  const { colors } = useTheme();
  const avatarUrl = imageUrl || `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`;
  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Image source={{ uri: avatarUrl }} style={[styles.avatar, { backgroundColor: colors.statusBg }]} />
      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{name || 'Unknown'}</Text>
        <Text style={[styles.role, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{role || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 36, height: 36, borderRadius: radii.full },
  info: { gap: 1 },
  name: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
  role: { fontSize: font.sizes.xs },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
