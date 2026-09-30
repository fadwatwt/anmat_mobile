import React, { useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Trash2 } from 'lucide-react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { font, radii, spacing } from '../../theme';

type Props = {
  count: number;
  onConfirm: () => Promise<void> | void;
  permission?: string;
};

export function BulkDeleteButton({ count, onConfirm }: Props) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);

  if (!count || count <= 0) return null;

  const handlePress = () => {
    Alert.alert(t('Delete Selected'), t('Are you sure you want to delete {{count}} selected items?', { count }), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Yes, Delete'),
        style: 'destructive',
        onPress: async () => {
          setLoading(true);
          try {
            await onConfirm();
          } finally {
            setLoading(false);
          }
        },
      },
    ]);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={loading}
      style={[s.btn, { backgroundColor: colors.dangerBg, opacity: loading ? 0.6 : 1 }]}
    >
      <Trash2 size={14} color={colors.dangerText} />
      <Text style={[s.text, { color: colors.dangerText }]}>{t('Delete Selected ({{count}})', { count })}</Text>
    </Pressable>
  );
}

const s = StyleSheet.create({
  btn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, borderRadius: radii.md },
  text: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold },
});
