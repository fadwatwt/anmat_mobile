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
import { useTranslation } from 'react-i18next';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { font, radii, spacing } from '../theme';
import { menuItems, MenuItemType } from '../config/menuItems';

const routeToScreen: Record<string, string> = {
  Dashboard: 'DashboardMain',
  Subscriptions: 'Subscriptions',
  HR: 'HRMain',
  HR_Employees: 'HRMain',
  HR_Departments: 'HRDepartments',
  HR_Positions: 'HRPositions',
  HR_Meetings: 'HRMeetings',
  HR_Holidays: 'HRHolidays',
  HR_Teams: 'HRTeams',
  HR_EmployeeDetail: 'EmployeeDetail',
  HR_CreateEmployee: 'CreateEmployee',
  HR_EditEmployee: 'EditEmployee',
  Projects: 'ProjectsMain',
  Tasks: 'TasksMain',
  MyTasks: 'MyTasks',
  MyProjects: 'MyProjects',
  Attendance: 'Attendance',
  Salary: 'Salary',
  Leaves: 'Leaves',
  Requests: 'Requests',
  Agenda: 'Agenda',
  Analytics: 'Analytics',
  Conversations: 'Conversations',
  SocialMedia: 'SocialMedia',
  AI: 'AI',
  Subscribers: 'Subscribers',
  Plans: 'Plans',
  Roles: 'Roles',
  Permissions: 'Permissions',
  Industries: 'Industries',
  SystemAdmins: 'SystemAdmins',
  SupportTickets: 'SupportTickets',
  MoneyMethods: 'MoneyMethods',
  Settings: 'Settings',
};

type Props = {
  onClose: () => void;
};

export function Sidebar({ onClose }: Props) {
  const { user } = useAuth();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const userType = user?.type as 'Admin' | 'Subscriber' | 'Employee';
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

  const currentScreenName = useNavigationState(state => {
    const findRoute = (s: any): string => {
      if (!s || !s.routes) return '';
      const route = s.routes[s.index || 0];
      if (route.state) return findRoute(route.state);
      return route.name;
    };
    return findRoute(state);
  });

  const toggleExpand = (route: string) => {
    setExpandedItems((prev) => ({ ...prev, [route]: !prev[route] }));
  };

  const isItemVisible = (item: MenuItemType) => {
    return item.allowedTo.includes(userType);
  };

  const filteredItems = menuItems.filter(isItemVisible);

  const handleNavigate = (route: string) => {
    const screen = routeToScreen[route];
    if (screen) {
      navigation.navigate(screen);
    }
    onClose();
  };

  const isRouteActive = (route: string) => {
    const screen = routeToScreen[route];
    return screen === currentScreenName;
  };

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.surface }]} edges={['top']}>
      <View style={[styles.logoSection, { borderBottomColor: colors.border }]}>
        <View style={[styles.logoRow, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
          <View style={[styles.logoCircle, { backgroundColor: colors.primary }]}>
            <Text style={styles.logoText}>A</Text>
          </View>
          <View style={styles.logoInfo}>
            <Text style={[styles.logoTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {t('Employees Management')}
            </Text>
            <Text style={[styles.logoSubtitle, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
              {t('Employees & HR Management')}
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
            const isActive = isRouteActive(item.route);
            const isExpanded = expandedItems[item.route] || false;
            const hasChildren = item.children && item.children.length > 0;
            const isChildActive = item.children?.some(
              (child) => isRouteActive(child.route),
            );

            return (
              <View key={item.route}>
                <TouchableOpacity
                  style={[styles.menuItem, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}
                  onPress={() => {
                    if (hasChildren) {
                      toggleExpand(item.route);
                    } else {
                      handleNavigate(item.route);
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
                      { backgroundColor: 'transparent', flexDirection: isRTL ? 'row-reverse' : 'row' },
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
                        { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' },
                        isActive && { color: colors.primary, fontWeight: font.weights.semibold },
                      ]}
                      numberOfLines={1}
                    >
                      {t(item.titleKey)}
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
                  <View style={[styles.childrenContainer, { backgroundColor: colors.primaryLight }, isRTL ? { marginRight: spacing.lg + spacing.md, marginLeft: spacing.md } : { marginLeft: spacing.lg + spacing.md, marginRight: spacing.md }]}>
                    <View style={styles.childrenInner}>
                      {item.children!.map((child) => {
                        const isChildItemActive = isRouteActive(child.route);
                        return (
                          <TouchableOpacity
                            key={child.route}
                            style={[
                              styles.childItem,
                              isChildItemActive && { backgroundColor: colors.surface },
                            ]}
                            onPress={() => handleNavigate(child.route)}
                          >
                            <Text
                              style={[
                                styles.childText,
                                { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' },
                                isChildItemActive && { color: colors.primary, fontWeight: font.weights.semibold },
                              ]}
                              numberOfLines={1}
                            >
                              {t(child.titleKey)}
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
    gap: 4,
  },
  menuItemContent: {
    alignItems: 'center',
    borderRadius: radii.lg,
    flex: 1,
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
