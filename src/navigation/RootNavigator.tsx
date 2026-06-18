import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { DashboardLayout } from '../layout/DashboardLayout';
import LoginScreen from '../screens/LoginScreen';
import DashboardMain from '../screens/DashboardScreen';
import { HREmployeesScreen } from '../screens/HREmployeesScreen';
import { EmployeeDetailScreen } from '../screens/EmployeeDetailScreen';
import { CreateEmployeeScreen } from '../screens/CreateEmployeeScreen';
import { EditEmployeeScreen } from '../screens/EditEmployeeScreen';
import HRDepartmentsScreen from '../screens/HRDepartmentsScreen';
import HRPositionsScreen from '../screens/HRPositionsScreen';
import HRMeetingsScreen from '../screens/HRMeetingsScreen';
import HRHolidaysScreen from '../screens/HRHolidaysScreen';
import HRTeamsScreen from '../screens/HRTeamsScreen';
import ProjectsMain from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProjectCreateScreen from '../screens/ProjectCreateScreen';
import TasksMain from '../screens/TasksScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import TaskCreateScreen from '../screens/TaskCreateScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import SubscribersScreen from '../screens/SubscribersScreen';
import { SubscriberDetailScreen } from '../screens/SubscriberDetailScreen';
import IndustriesScreen from '../screens/IndustriesScreen';
import SystemAdminsScreen from '../screens/SystemAdminsScreen';
import SupportTicketsScreen from '../screens/SupportTicketsScreen';
import MoneyMethodsScreen from '../screens/MoneyMethodsScreen';
import AIScreen from '../screens/AIScreen';
import ConversationsScreen from '../screens/ConversationsScreen';
import AnalyticsScreen from '../screens/AnalyticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AgendaScreen from '../screens/AgendaScreen';
import SocialMediaScreen from '../screens/SocialMediaScreen';
import { AttendanceScreen } from '../screens/AttendanceScreen';
import { SalaryScreen } from '../screens/SalaryScreen';
import { LeavesScreen } from '../screens/LeavesScreen';
import { RequestsScreen } from '../screens/RequestsScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import PlansScreen from '../screens/PlansScreen';
import TokenPricingScreen from '../screens/TokenPricingScreen';
import { RolesScreen } from '../screens/RolesScreen';
import { PermissionsScreen } from '../screens/PermissionsScreen';
import { MyTasksScreen } from '../screens/MyTasksScreen';
import { MyProjectsScreen } from '../screens/MyProjectsScreen';
import AdminSignInScreen from '../screens/AdminSignInScreen';
import ForgotPasswordScreen from '../screens/ForgotPasswordScreen';

const Stack = createNativeStackNavigator();

function Layout({ children }: { children: React.ReactNode }) {
  return <DashboardLayout>{children}</DashboardLayout>;
}

export function RootNavigator() {
  const { isLoading, token } = useAuth();
  const { colors } = useTheme();

  if (isLoading) {
    return (
      <View style={[styles.loading, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {token ? (
        <Stack.Group>
          <Stack.Screen name="DashboardMain">
            {() => <Layout><DashboardMain /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRMain">
            {() => <Layout><HREmployeesScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="EmployeeDetail">
            {() => <Layout><EmployeeDetailScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="CreateEmployee">
            {() => <Layout><CreateEmployeeScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="EditEmployee">
            {() => <Layout><EditEmployeeScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRDepartments">
            {() => <Layout><HRDepartmentsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRPositions">
            {() => <Layout><HRPositionsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRMeetings">
            {() => <Layout><HRMeetingsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRHolidays">
            {() => <Layout><HRHolidaysScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRTeams">
            {() => <Layout><HRTeamsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="ProjectsMain">
            {() => <Layout><ProjectsMain /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="ProjectDetail">
            {() => <Layout><ProjectDetailScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="ProjectCreate">
            {() => <Layout><ProjectCreateScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="TasksMain">
            {() => <Layout><TasksMain /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="MyTasks">
            {() => <Layout><MyTasksScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="MyProjects">
            {() => <Layout><MyProjectsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="TaskDetail">
            {() => <Layout><TaskDetailScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="TaskCreate">
            {() => <Layout><TaskCreateScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Settings">
            {() => <Layout><SettingsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Profile">
            {() => <Layout><ProfileScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Subscriptions">
            {() => <Layout><SubscriptionsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Subscribers">
            {() => <Layout><SubscribersScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="SubscriberDetail">
            {() => <Layout><SubscriberDetailScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Plans">
            {() => <Layout><PlansScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Roles">
            {() => <Layout><RolesScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Permissions">
            {() => <Layout><PermissionsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Industries">
            {() => <Layout><IndustriesScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="SystemAdmins">
            {() => <Layout><SystemAdminsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="SupportTickets">
            {() => <Layout><SupportTicketsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="MoneyMethods">
            {() => <Layout><MoneyMethodsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Attendance">
            {() => <Layout><AttendanceScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Salary">
            {() => <Layout><SalaryScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Leaves">
            {() => <Layout><LeavesScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Requests">
            {() => <Layout><RequestsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Agenda">
            {() => <Layout><AgendaScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Analytics">
            {() => <Layout><AnalyticsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Conversations">
            {() => <Layout><ConversationsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Notifications">
            {() => <Layout><NotificationsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="SocialMedia">
            {() => <Layout><SocialMediaScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="AI">
            {() => <Layout><AIScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="TokenPricing">
            {() => <Layout><TokenPricingScreen /></Layout>}
          </Stack.Screen>
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AdminSignIn" component={AdminSignInScreen} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
