import React, { useState, useMemo } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useNavigationState } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Header } from '../components/Header';
import { Sidebar } from '../components/Sidebar';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';

const routeTitleMap: Record<string, string> = {
  DashboardMain: 'Dashboard',
  HRMain: 'HR Management',
  EmployeeDetail: 'Employee Profile',
  CreateEmployee: 'Add Employee',
  EditEmployee: 'Edit Employee',
  ProjectsMain: 'Projects',
  ProjectDetail: 'Project Details',
  ProjectCreate: 'Create Project',
  TasksMain: 'Tasks',
  MyTasks: 'My Tasks',
  MyProjects: 'My Projects',
  TaskDetail: 'Task Details',
  TaskCreate: 'Create Task',
  Settings: 'Settings',
  Profile: 'Profile',
  Subscriptions: 'Subscriptions',
  Agenda: 'Agenda',
  Analytics: 'Analytics',
  Conversations: 'Conversations',
  Notifications: 'Notifications',
  SocialMedia: 'Social Media',
  AI: 'AI Assistant',
  Subscribers: 'Subscribers',
  SubscriberDetail: 'Subscriber Details',
  Plans: 'Plans',
  Roles: 'Roles',
  Permissions: 'Permissions',
  Industries: 'Industries',
  SystemAdmins: 'System Admins',
  SupportTickets: 'Support Tickets',
  MoneyMethods: 'Money Methods',
  Attendance: 'Attendance',
  Salary: 'Salary',
  Leaves: 'Short Leaves',
  Requests: 'Requests',
  HRDepartments: 'Departments',
  HRPositions: 'Positions',
};

type Props = {
  children: React.ReactNode;
};

export function DashboardLayout({ children }: Props) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const currentRouteName = useNavigationState(state => {
    const findRoute = (s: any): string => {
      if (!s || !s.routes) return '';
      const route = s.routes[s.index || 0];
      if (route.state) return findRoute(route.state);
      return route.name;
    };
    return findRoute(state);
  });

  const screenTitle = useMemo(() => {
    const key = routeTitleMap[currentRouteName];
    return key ? t(key) : '';
  }, [currentRouteName, t]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background, overflow: 'hidden' }]}>
      <View style={[styles.main, { backgroundColor: colors.background }]}>
        <Header
          onMenuPress={() => setDrawerOpen(true)}
          title={currentRouteName === 'DashboardMain' ? undefined : screenTitle}
        />
        <View style={[styles.content, { backgroundColor: colors.background }]}>
          {children}
        </View>
      </View>

      {drawerOpen ? (
        <Pressable style={styles.overlay} onPress={() => setDrawerOpen(false)} />
      ) : null}

      <View
        style={[
          styles.sidebar,
          {
            backgroundColor: colors.surface,
            top: insets.top,
            bottom: insets.bottom,
          },
          isRTL
            ? { right: 0, transform: [{ translateX: drawerOpen ? 0 : 300 }] }
            : { left: 0, transform: [{ translateX: drawerOpen ? 0 : -300 }] },
        ]}
      >
        <Sidebar onClose={() => setDrawerOpen(false)} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  main: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 55,
  },
  root: {
    flex: 1,
  },
  sidebar: {
    bottom: 0,
    position: 'absolute',
    top: 0,
    width: 280,
    zIndex: 60,
  },
});
