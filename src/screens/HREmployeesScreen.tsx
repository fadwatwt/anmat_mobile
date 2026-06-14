import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, DollarSign, Clock, ClipboardList } from 'lucide-react-native';
import { EmployeeListScreen } from './EmployeeListScreen';
import HRAttendancesScreen from './HRAttendancesScreen';
import HRSalaryScreen from './HRSalaryScreen';
import HRLeavesScreen from './HRLeavesScreen';
import HRRequestsScreen from './HRRequestsScreen';

const Tab = createMaterialTopTabNavigator();

export function HREmployeesScreen() {
  const { t } = useTranslation();

const tabScreens = [
  { name: 'Employees', component: EmployeeListScreen, icon: Users, title: t('Employees') },
  { name: 'Attendances', component: HRAttendancesScreen, icon: Calendar, title: t('Attendances') },
  { name: 'Short Leaves', component: HRLeavesScreen, icon: Clock, title: t('Short Leaves') },
  { name: 'Requests', component: HRRequestsScreen, icon: ClipboardList, title: t('Requests') },
  { name: 'Salary', component: HRSalaryScreen, icon: DollarSign, title: t('Salary') },
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
          tabBarActiveTintColor: '#3B82F6',
          tabBarInactiveTintColor: '#9CA3AF',
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderBottomWidth: 1,
            borderBottomColor: '#E5E7EB',
            elevation: 0,
          },
          tabBarIndicatorStyle: {
            backgroundColor: '#3B82F6',
            height: 3,
          },
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
