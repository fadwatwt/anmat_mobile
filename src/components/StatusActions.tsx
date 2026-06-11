import { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MoreHorizontal } from 'lucide-react-native';
import { useLocale } from '../context/LanguageContext';
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

  return (
    <View>
      <TouchableOpacity onPress={() => setVisible(true)} style={styles.trigger}>
        <MoreHorizontal size={18} color="#6B7280" />
      </TouchableOpacity>

      <Modal visible={visible} transparent animationType="fade" onRequestClose={() => setVisible(false)}>
        <Pressable style={styles.overlay} onPress={() => setVisible(false)}>
          <View style={styles.menu}>
            {actions.map((action, i) => (
              <TouchableOpacity
                key={i}
                style={styles.menuItem}
                onPress={() => { setVisible(false); action.onPress(); }}
              >
                {action.icon && <View style={styles.menuIcon}>{action.icon}</View>}
                <Text style={[styles.menuText, action.destructive && { color: '#DF1C41' }, { textAlign: isRTL ? 'right' : 'left' }]}>
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
    backgroundColor: '#FFFFFF',
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: '#E5E7EB',
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
  menuText: { fontSize: font.sizes.sm, color: '#374151', fontWeight: font.weights.medium },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trigger: { padding: 4 },
});
