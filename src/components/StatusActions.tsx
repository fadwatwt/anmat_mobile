import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';

export type ActionItem = {
  label: string;
  icon?: React.ReactNode;
  onPress: () => void;
  destructive?: boolean;
};

type Props = {
  actions: ActionItem[];
};

export function StatusActions({ actions }: Props) {
  const [visible, setVisible] = useState(false);
  const { isRTL } = useLocale();
  const { colors } = useTheme();

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.trigger}>
        <MoreHorizontal size={18} color={colors.textMuted} />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                onPress={() => { setVisible(false); action.onPress(); }}
              >
                {action.icon && <View style={styles.menuIcon}>{action.icon}</View>}
                <Text style={[styles.menuText, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }, action.destructive && { color: colors.danger }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    borderRadius: radii.xl,
    borderWidth: 1,
    minWidth: 180,
    paddingVertical: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  menuIcon: { width: 20, alignItems: 'center' },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
  },
  menuText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trigger: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xs,
  },
});
