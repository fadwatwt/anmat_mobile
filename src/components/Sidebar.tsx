import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, X } from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';
import { menuItems, MenuItemType } from '../config/menuItems';

type Props = {
  currentRoute: string;
  onNavigate: (route: string) => void;
  onClose: () => void;
};

export function Sidebar({ currentRoute, onNavigate, onClose }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const userType = user?.type as 'Admin' | 'Subscriber' | 'Employee';
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const toggleExpand = (route: string) => {
    setExpandedItems((prev) => ({ ...prev, [route]: !prev[route] }));
  };

  const isItemVisible = (item: MenuItemType) => {
    return item.allowedTo.includes(userType);
  };

  const filteredItems = menuItems.filter(isItemVisible);

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]} edges={['top', 'right']}>
      <View style={[styles.logoSection, { borderBottomColor: colors.border }]}>
        <View style={styles.logoRow}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <View style={styles.logoInfo}>
            <Text style={[styles.logoTitle, { color: colors.ink }]} numberOfLines={1}>
              Employees Management
            </Text>
            <Text style={[styles.logoSubtitle, { color: colors.textMuted }]} numberOfLines={1}>
              Employees & HR Management
            </Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <X size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        <View style={styles.menuList}>
          {filteredItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentRoute === item.route;
            const isExpanded = expandedItems[item.route] || false;
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = item.children?.some(
              (child) => currentRoute === child.route,
            );

            return (
              <View key={item.route}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    if (hasChildren) {
                      toggleExpand(item.route);
                    } else {
                      onNavigate(item.route);
                      onClose();
                    }
                  }}
                >
                  <View
                    style={[
                      styles.activeIndicator,
                      { backgroundColor: 'transparent' },
                      (isActive || isChildActive) && { backgroundColor: colors.primary },
                    ]}
                  />
                  <View
                    style={[
                      styles.menuItemContent,
                      { backgroundColor: 'transparent' },
                      (isActive || isChildActive) && { backgroundColor: colors.primaryLight },
                    ]}
                  >
                    <Icon
                      size={22}
                      color={isActive ? colors.primary : colors.textMuted}
                      strokeWidth={isActive ? 2.5 : 2}
                    />
                    <Text
                      style={[
                        styles.menuItemText,
                        { color: colors.textMuted },
                        isActive && { color: colors.primary, fontWeight: font.weights.semibold },
                      ]}
                      numberOfLines={1}
                    >
                      {item.title}
                    </Text>
                    {hasChildren && (
                      <ChevronDown
                        size={16}
                        color={colors.textMuted}
                        style={{ transform: [{ rotate: isExpanded ? '180deg' : '0deg' }] }}
                      />
                    )}
                  </View>
                </TouchableOpacity>

                {hasChildren && isExpanded && (
                  <View style={[styles.childrenContainer, { backgroundColor: colors.primaryLight }]}>
                    <View style={styles.childrenInner}>
                      {item.children!.map((child) => {
                        const isChildItemActive = currentRoute === child.route;
                        return (
                          <TouchableOpacity
                            key={child.route}
                            style={[
                              styles.childItem,
                              isChildItemActive && { backgroundColor: colors.surface },
                            ]}
                            onPress={() => {
                              onNavigate(child.route);
                              onClose();
                            }}
                          >
                            <Text
                              style={[
                                styles.childText,
                                { color: colors.textMuted },
                                isChildItemActive && { color: colors.primary, fontWeight: font.weights.semibold },
                              ]}
                              numberOfLines={1}
                            >
                              {child.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  activeIndicator: {
    borderRadius: radii.md,
    height: 24,
    width: 3,
  },
  childItem: {
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  childText: {
    fontSize: font.sizes.sm,
  },
  childrenContainer: {
    borderRadius: radii.lg,
    marginLeft: spacing.lg + spacing.md,
    marginRight: spacing.md,
    marginBottom: spacing.xs,
    padding: spacing.sm,
  },
  childrenInner: {
    gap: 2,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  logoCircle: {
    alignItems: 'center',
    borderRadius: radii.full,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  logoInfo: {
    flex: 1,
    gap: 2,
  },
  logoRow: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  logoSection: {
    borderBottomWidth: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
  },
  logoSubtitle: {
    fontSize: font.sizes.xs,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: font.weights.extrabold,
  },
  logoTitle: {
    fontSize: font.sizes.sm,
    fontWeight: font.weights.semibold,
  },
  menuList: {
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  menuScroll: {
    flex: 1,
  },
  menuItem: {
    flexDirection: 'row',
    gap: 4,
  },
  menuItemContent: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  menuItemText: {
    flex: 1,
    fontSize: font.sizes.sm,
  },
  safe: {
    flex: 1,
    width: 280,
  },
});
