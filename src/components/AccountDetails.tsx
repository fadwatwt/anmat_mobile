import { Image, StyleSheet, Text, View } from 'react-native';
import { useLocale } from '../context/LanguageContext';
import { font, radii } from '../theme';

type Props = {
  name?: string;
  role?: string;
  imageUrl?: string;
};

export function AccountDetails({ name, role, imageUrl }: Props) {
  const { isRTL } = useLocale();
  const avatarUrl = imageUrl || `https://ui-avatars.com/api/?name=${name || 'User'}&background=random`;
  return (
    <View style={[styles.row, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
      <Image source={{ uri: avatarUrl }} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={[styles.name, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{name || 'Unknown'}</Text>
        <Text style={[styles.role, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{role || '—'}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 36, height: 36, borderRadius: radii.full, backgroundColor: '#E5E7EB' },
  info: { gap: 1 },
  name: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold, color: '#111827' },
  role: { fontSize: font.sizes.xs, color: '#6B7280' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
});
