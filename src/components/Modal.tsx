import React from 'react';
import { Dimensions, Modal as RNModal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { X } from 'lucide-react-native';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

type Props = {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  /**
   * When true, children are rendered directly in a plain View (no outer ScrollView).
   * Use this when the children already manage their own scrolling/layout (e.g. multi-step forms
   * with a sticky footer that must stay pinned at the bottom).
   */
  noScroll?: boolean;
};

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const sizeMap: Record<string, { width: number; height: number }> = {
  full: { width: SCREEN_WIDTH * 0.95, height: SCREEN_HEIGHT * 0.9 },
  lg:   { width: SCREEN_WIDTH * 0.92, height: SCREEN_HEIGHT * 0.82 },
  md:   { width: SCREEN_WIDTH * 0.92, height: SCREEN_HEIGHT * 0.72 },
  sm:   { width: SCREEN_WIDTH * 0.85, height: SCREEN_HEIGHT * 0.45 },
};

export function Modal({ visible, onClose, title, children, size = 'md', noScroll = false }: Props) {
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  if (!visible) return null;

  const dims = sizeMap[size] ?? sizeMap.md;

  return (
    <RNModal visible={visible} animationType="fade" transparent>
      <Pressable style={styles.overlay} onPress={onClose}>
        {/* Inner Pressable stops tap propagation so tapping inside doesn't close the modal */}
        <Pressable style={[styles.container, { backgroundColor: colors.surface, ...dims }]}>
          {title && (
            <View style={[styles.header, { borderBottomColor: colors.border, flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
              <Text style={[styles.title, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{title}</Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <X size={20} color={colors.textMuted} />
              </Pressable>
            </View>
          )}

          {noScroll ? (
            <View style={styles.noScrollContent}>{children}</View>
          ) : (
            <ScrollView
              style={styles.scroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              nestedScrollEnabled
            >
              {children}
            </ScrollView>
          )}
        </Pressable>
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
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    borderBottomWidth: 1,
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  noScrollContent: {
    flex: 1,
  },
  overlay: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    flex: 1,
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    gap: spacing.md,
    padding: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: font.sizes.base,
    fontWeight: font.weights.bold,
  },
});
