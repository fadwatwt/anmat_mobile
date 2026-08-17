import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, DollarSign, Clock, ClipboardList, Bell, Repeat2 } from 'lucide-react-native';
import { EmployeeListScreen } from './EmployeeListScreen';
import HRAttendancesScreen from './HRAttendancesScreen';
import HRSalaryScreen from './HRSalaryScreen';
import HRLeavesScreen from './HRLeavesScreen';
import HRRequestsScreen from './HRRequestsScreen';
import RotationScreen from './RotationScreen';
import { NotificationsScreen } from './NotificationsScreen';
import { useTheme } from '../context/ThemeContext';
import { spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

export function HREmployeesScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();

const tabScreens = [
  { name: 'Employees', component: EmployeeListScreen, icon: Users, title: t('Employees') },
  { name: 'Attendances', component: HRAttendancesScreen, icon: Calendar, title: t('Attendances') },
  { name: 'Short Leaves', component: HRLeavesScreen, icon: Clock, title: t('Short Leaves') },
  { name: 'Requests', component: HRRequestsScreen, icon: ClipboardList, title: t('Requests') },
  { name: 'Salary', component: HRSalaryScreen, icon: DollarSign, title: t('Salary') },
  // These are part of the HR hub on web as well, not just standalone sidebar pages.
  { name: 'Rotations', component: RotationScreen, icon: Repeat2, title: t('Rotations') },
  { name: 'Notifications', component: NotificationsScreen, icon: Bell, title: t('Notifications') },
] as const;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const tabConfig = tabScreens.find(t => t.name === route.name);
        return {
          tabBarLabel: tabConfig?.title,
          tabBarIcon: ({ color }) => {
            const Icon = tabConfig?.icon;
            return Icon ? <Icon size={20} color={color} strokeWidth={2} /> : <></>;
          },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
            elevation: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: colors.primary,
            height: 3,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' as const, textTransform: 'none' as const },
          tabBarScrollEnabled: true,
          tabBarItemStyle: { width: 'auto', minWidth: 80, paddingHorizontal: spacing.xs },
          sceneStyle: { backgroundColor: colors.background },
          headerShown: false,
        };
      }}
    >
      {tabScreens.map(({ name, component }) => (
        <Tab.Screen key={name} name={name} component={component} />
      ))}
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
