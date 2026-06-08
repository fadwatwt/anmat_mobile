import React from 'react';
import { Dimensions, Modal as RNModal, Pressable, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const sizeStyles: Record<string, { maxWidth: number; maxHeight: number }> = {
  full: { maxWidth: SCREEN_WIDTH * 0.95, maxHeight: SCREEN_HEIGHT * 0.9 },
  lg: { maxWidth: 500, maxHeight: SCREEN_HEIGHT * 0.8 },
  md: { maxWidth: 400, maxHeight: SCREEN_HEIGHT * 0.7 },
  sm: { maxWidth: 320, maxHeight: SCREEN_HEIGHT * 0.5 },
};

export function Modal({ visible, onClose, title, children, size = 'md' }: Props) {
  const { colors } = useTheme();
  if (!visible) return null;

  const sizeStyle = sizeStyles[size] || sizeStyles.md;

  return (
    <RNModal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={[styles.container, { backgroundColor: colors.surface }, sizeStyle]}>
          {title && (
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Text style={[styles.title, { color: colors.ink }]}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          )}
          <View style={styles.content}>{children}</View>
        </View>
      </Pressable>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  closeBtn: {
    padding: spacing.xs,
  },
  container: {
    borderRadius: radii.xxl,
    margin: spacing.md,
    maxHeight: '90%',
  },
  content: {
    flex: 1,
    maxHeight: '100%',
    padding: spacing.md,
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.bold,
  },
});
