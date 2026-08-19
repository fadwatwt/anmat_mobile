import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Search, X } from 'lucide-react-native';
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
  HR_Chats: 'HRChats',
  HR_Attendances: 'HRAttendances',
  HR_Leaves: 'HRLeaves',
  HR_Requests: 'HRRequests',
  HR_Salary: 'HRSalary',
  HR_EmployeeDetail: 'EmployeeDetail',
  HR_CreateEmployee: 'CreateEmployee',
  HR_EditEmployee: 'EditEmployee',
  Projects: 'ProjectsMain',
  Templates: 'Templates',
  Tasks: 'TasksMain',
  MyTasks: 'MyTasks',
  MyProjects: 'MyProjects',
  MyAgenda: 'Agenda',
  Attendance: 'Attendance',
  Salary: 'Salary',
  Leaves: 'Leaves',
  Requests: 'Requests',
  Agenda: 'Agenda',
  Appointments: 'Appointments',
  Analytics: 'Analytics',
  Conversations: 'Conversations',
  SocialMedia: 'SocialMedia',
  AI: 'AI',
  AIAnalytics: 'AIAnalytics',
  Subscribers: 'Subscribers',
  Plans: 'Plans',
  Roles: 'Roles',
  Permissions: 'Permissions',
  Industries: 'Industries',
  SystemAdmins: 'SystemAdmins',
  SupportTickets: 'SupportTickets',
  SupportTicketDetail: 'SupportTicketDetail',
  MoneyMethods: 'MoneyMethods',
  Settings: 'Settings',
  TodoList: 'TodoList',
  ActivityLogs: 'ActivityLogs',
  Organizations: 'Organizations',
  Rotation: 'Rotation',
  MoneyReceiving: 'MoneyReceiving',
  PaymentMethods: 'PaymentMethods',
  AdminRoles: 'AdminRoles',
  AdminPermissions: 'AdminPermissions',
  Financial: 'Financial',
  Timeline: 'Timeline',
  Escalation: 'Escalation',
  Translations: 'Translations',
  Profile: 'Profile',
};

type Props = {
  onClose: () => void;
};

export function Sidebar({ onClose }: Props) {
  const { user, permissions, permissionsLoaded } = useAuth();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const userType = user?.type as 'Admin' | 'Subscriber' | 'Employee';
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

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

  const toggleSectionCollapse = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  // Menu visibility mirrors the web sidebar exactly:
  //   1. user type ∈ allowedTo
  //   2. AND one of: no permission constraint, wildcard '*', `permission`, or any of `permissionAnyOf`.
  const hasWildcard = Array.isArray(permissions) && permissions.includes('*');
  const userHasPermission = (perm: string) => Array.isArray(permissions) && permissions.includes(perm);

  const isItemAllowed = (item: Pick<MenuItemType, 'allowedTo' | 'permission' | 'permissionAnyOf'>) => {
    if (!item.allowedTo || !item.allowedTo.includes(userType)) return false;
    if (hasWildcard) return true;

    const hasSingle = item.permission ? userHasPermission(item.permission) : null;
    const hasAny = Array.isArray(item.permissionAnyOf) && item.permissionAnyOf.length > 0
      ? item.permissionAnyOf.some(userHasPermission)
      : null;

    if (hasSingle === null && hasAny === null) return true;
    return Boolean(hasSingle) || Boolean(hasAny);
  };

  const filterItem = (item: MenuItemType): MenuItemType | null => {
    if (!isItemAllowed(item)) return null;
    if (!Array.isArray(item.children) || item.children.length === 0) return item;

    const visibleChildren = item.children.filter((child) => {
      const merged = { allowedTo: item.allowedTo, permission: child.permission, permissionAnyOf: child.permissionAnyOf };
      return isItemAllowed(merged);
    });

    if (item.children.length > 0 && visibleChildren.length === 0) return null;
    return { ...item, children: visibleChildren };
  };

  const filteredItems = permissionsLoaded ? menuItems.map(filterItem).filter(Boolean) as MenuItemType[] : [];

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const searchableItems = useMemo(() => {
    if (!normalizedQuery) return filteredItems;
    return filteredItems.map((item) => {
      const itemTitle = `${t(item.titleKey)} ${item.titleKey}`.toLowerCase();
      const childMatches = (item.children ?? []).filter(
        (child) =>
          `${t(child.titleKey)} ${child.titleKey}`.toLowerCase().includes(normalizedQuery),
      );
      if (itemTitle.includes(normalizedQuery)) {
        return childMatches.length > 0 ? { ...item, children: childMatches } : item;
      }
      if (childMatches.length > 0) {
        return { ...item, children: childMatches };
      }
      return null;
    }).filter(Boolean) as MenuItemType[];
  }, [filteredItems, normalizedQuery, t]);

  const isSearching = normalizedQuery.length > 0;

  const handleNavigate = (route: string, params?: Record<string, unknown>) => {
    const screen = routeToScreen[route];
    if (screen) {
      navigation.navigate(screen, params);
    }
    onClose();
  };

  const isRouteActive = (route: string) => {
    const screen = routeToScreen[route];
    return screen === currentScreenName;
  };

  const renderSectionHeader = (title: string) => {
    const isFirst = title === searchableItems[0]?.section;
    const isCollapsed = collapsedSections[title] && !isSearching;
    return (
      <TouchableOpacity
        style={[
          styles.sectionHeader,
          isFirst && styles.sectionHeaderFirst,
          { flexDirection: isRTL ? 'row-reverse' : 'row' },
        ]}
        onPress={() => toggleSectionCollapse(title)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.sectionHeaderText,
            { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' },
          ]}
        >
          {t(title)}
        </Text>
        <ChevronDown
          size={14}
          color={colors.textMuted}
          style={{ transform: [{ rotate: isCollapsed ? '180deg' : '0deg' }] }}
        />
      </TouchableOpacity>
    );
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

      <View style={[styles.searchSection, { borderBottomColor: colors.border }]}>
        <View
          style={[
            styles.searchBox,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              flexDirection: isRTL ? 'row-reverse' : 'row',
            },
          ]}
        >
          <Search size={16} color={colors.textMuted} />
          <TextInput
            style={[
              styles.searchInput,
              { color: colors.ink, textAlign: isRTL ? 'right' : 'left' },
            ]}
            placeholder={t('Search...')}
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCorrect={false}
          />
          {isSearching && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={16} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.menuScroll} showsVerticalScrollIndicator={false}>
        {!permissionsLoaded ? (
          <ActivityIndicator color={colors.primary} size="small" style={styles.menuLoading} />
        ) : null}
        <View style={styles.menuList}>
          {(() => {
            let lastSection: string | undefined;
            return searchableItems.map((item) => {
              const showHeader = item.section && item.section !== lastSection;
              lastSection = item.section;

              const sectionCollapsed = item.section ? (collapsedSections[item.section] && !isSearching) : false;
              if (showHeader && sectionCollapsed) {
                return (
                  <View key={`${item.section}-header`}>
                    {renderSectionHeader(item.section!)}
                  </View>
                );
              }

              const Icon = item.icon;
              const isActive = isRouteActive(item.route);
              const isExpanded = expandedItems[item.route] || isSearching;
              const hasChildren = item.children && item.children.length > 0;
              const isChildActive = item.children?.some(
                (child) => isRouteActive(child.route),
              );

              return (
                <View key={item.route}>
                  {showHeader && renderSectionHeader(item.section!)}
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
                        {item.children!.map((child, childIndex) => {
                          const isChildItemActive = isRouteActive(child.route);
                          return (
                            <TouchableOpacity
                              key={`${child.route}-${childIndex}`}
                              style={[
                                styles.childItem,
                                isChildItemActive && { backgroundColor: colors.surface },
                              ]}
                              onPress={() => handleNavigate(child.route, child.params)}
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
            });
          })()}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: spacing.md + 2,
    paddingBottom: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  sectionHeaderFirst: {
    paddingTop: 0,
  },
  sectionHeaderText: {
    fontSize: 11,
    fontWeight: font.weights.extrabold,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
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
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
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
  menuLoading: {
    marginTop: spacing.xl,
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
  searchBox: {
    alignItems: 'center',
    borderRadius: radii.full,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
  },
  searchInput: {
    flex: 1,
    fontSize: font.sizes.sm,
    paddingVertical: spacing.sm,
  },
  searchSection: {
    borderBottomWidth: 1,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  safe: {
    flex: 1,
    width: 280,
  },
});
