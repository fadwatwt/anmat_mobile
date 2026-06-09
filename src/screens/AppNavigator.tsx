import { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

import { useAuth } from '../context/AuthContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import { NavigationProvider, useAppNavigation } from '../context/NavigationContext';
import { useTheme } from '../context/ThemeContext';

import LoginScreen from './LoginScreen';
import DashboardScreen from './DashboardScreen';
import ProjectsScreen from './ProjectsScreen';
import TasksScreen from './TasksScreen';
import { AttendanceScreen } from './AttendanceScreen';
import SettingsScreen from './SettingsScreen';
import PlaceholderScreen from './PlaceholderScreen';
import { HREmployeesScreen } from './HREmployeesScreen';
import { EmployeeDetailScreen } from './EmployeeDetailScreen';
import { CreateEmployeeScreen } from './CreateEmployeeScreen';
import { EditEmployeeScreen } from './EditEmployeeScreen';

const screens: Record<string, { title: string; icon: string }> = {
  Dashboard: { title: 'Dashboard', icon: '🏠' },
  Subscriptions: { title: 'Subscriptions', icon: '💳' },
  HR: { title: 'HR Management', icon: '👥' },
  HR_Employees: { title: 'Employees', icon: '👤' },
  HR_Departments: { title: 'Departments', icon: '🏢' },
  HR_Positions: { title: 'Positions', icon: '💼' },
  HR_Attendances: { title: 'Attendances', icon: '📅' },
  HR_Leaves: { title: 'Leaves', icon: '🏖' },
  HR_Salary: { title: 'Salary', icon: '💰' },
  HR_Requests: { title: 'Requests', icon: '📝' },
  HR_EmployeeDetail: { title: 'Employee Profile', icon: '👤' },
  HR_CreateEmployee: { title: 'Add Employee', icon: '➕' },
  HR_EditEmployee: { title: 'Edit Employee', icon: '✏️' },
  Projects: { title: 'Projects', icon: '📁' },
  Tasks: { title: 'Tasks', icon: '✅' },
  Attendance: { title: 'Attendance', icon: '📅' },
  Salary: { title: 'Salary', icon: '💰' },
  Leaves: { title: 'Short Leaves', icon: '🕐' },
  Requests: { title: 'Requests', icon: '📝' },
  Agenda: { title: 'Agenda', icon: '📆' },
  Analytics: { title: 'Analytics', icon: '📊' },
  Conversations: { title: 'Conversations', icon: '💬' },
  SocialMedia: { title: 'Social Media', icon: '📱' },
  AI: { title: 'AI Assistant', icon: '🤖' },
  Subscribers: { title: 'Subscribers', icon: '🏷' },
  Industries: { title: 'Industries', icon: '🏗' },
  SystemAdmins: { title: 'System Admins', icon: '🔑' },
  SupportTickets: { title: 'Support Tickets', icon: '🎫' },
  MoneyMethods: { title: 'Money Methods', icon: '💳' },
  Settings: { title: 'Settings', icon: '⚙' },
};

function ScreenRenderer({ route }: { route: string }) {
  const { routeParams } = useAppNavigation();

  switch (route) {
    case 'Dashboard':
      return <DashboardScreen />;
    case 'HR':
    case 'HR_Employees':
      return <HREmployeesScreen />;
    case 'HR_EmployeeDetail':
      return <EmployeeDetailScreen />;
    case 'HR_CreateEmployee':
      return <CreateEmployeeScreen />;
    case 'HR_EditEmployee':
      return <EditEmployeeScreen />;
    case 'Projects':
      return <ProjectsScreen />;
    case 'Tasks':
      return <TasksScreen />;
    case 'Attendance':
      return <AttendanceScreen />;
    case 'Settings':
      return <SettingsScreen />;
    default: {
      const info = screens[route] || { title: route, icon: '📄' };
      return <PlaceholderScreen title={info.title} icon={info.icon} />;
    }
  }
}

export default function AppNavigator() {
  const { isLoading, token } = useAuth();
  const { colors } = useTheme();
  const [currentRoute, setCurrentRoute] = useState('Dashboard');

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  if (!token) {
    return <LoginScreen />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        <DashboardLayout
          currentRoute={currentRoute}
          onNavigate={setCurrentRoute}
        >
          <NavigationProvider onNavigate={setCurrentRoute}>
            <ScreenRenderer route={currentRoute} />
          </NavigationProvider>
        </DashboardLayout>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
