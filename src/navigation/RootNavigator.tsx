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
import HRAttendancesScreen from '../screens/HRAttendancesScreen';
import HRLeavesScreen from '../screens/HRLeavesScreen';
import HRSalaryScreen from '../screens/HRSalaryScreen';
import HRRequestsScreen from '../screens/HRRequestsScreen';
import ProjectsMain from '../screens/ProjectsScreen';
import ProjectDetailScreen from '../screens/ProjectDetailScreen';
import ProjectCreateScreen from '../screens/ProjectCreateScreen';
import TasksMain from '../screens/TasksScreen';
import TaskDetailScreen from '../screens/TaskDetailScreen';
import TaskCreateScreen from '../screens/TaskCreateScreen';
import SettingsScreen from '../screens/SettingsScreen';
import SubscriptionsScreen from '../screens/SubscriptionsScreen';
import SubscribersScreen from '../screens/SubscribersScreen';
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
import PlaceholderScreen from '../screens/PlaceholderScreen';

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
          <Stack.Screen name="HRAttendances">
            {() => <Layout><HRAttendancesScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRLeaves">
            {() => <Layout><HRLeavesScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRSalary">
            {() => <Layout><HRSalaryScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="HRRequests">
            {() => <Layout><HRRequestsScreen /></Layout>}
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
          <Stack.Screen name="Agenda">
            {() => <Layout><AgendaScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Analytics">
            {() => <Layout><AnalyticsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="Conversations">
            {() => <Layout><ConversationsScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="SocialMedia">
            {() => <Layout><SocialMediaScreen /></Layout>}
          </Stack.Screen>
          <Stack.Screen name="AI">
            {() => <Layout><AIScreen /></Layout>}
          </Stack.Screen>
        </Stack.Group>
      ) : (
        <Stack.Group>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="AdminSignIn" component={AdminSignInPlaceholder} />
          <Stack.Screen name="ForgotPassword" component={ForgotPasswordPlaceholder} />
        </Stack.Group>
      )}
    </Stack.Navigator>
  );
}

function AdminSignInPlaceholder() {
  return <PlaceholderScreen titleKey="Admin Sign In" />;
}

function ForgotPasswordPlaceholder() {
  return <PlaceholderScreen titleKey="Forgot Password" />;
}

const styles = StyleSheet.create({
  loading: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
});
