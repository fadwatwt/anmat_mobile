import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Users, Calendar, DollarSign, Clock, ClipboardList } from 'lucide-react-native';
import { EmployeeListScreen } from './EmployeeListScreen';
import { AttendanceScreen } from './AttendanceScreen';
import { SalaryScreen } from './SalaryScreen';
import { LeavesScreen } from './LeavesScreen';
import { RequestsScreen } from './RequestsScreen';

const Tab = createMaterialTopTabNavigator();

export function HREmployeesScreen() {
  const { t } = useTranslation();

const tabScreens = [
  { name: 'Employees', component: EmployeeListScreen, icon: Users, title: t('Employees') },
  { name: 'Attendance', component: AttendanceScreen, icon: Calendar, title: t('Attendance') },
  { name: 'Salary', component: SalaryScreen, icon: DollarSign, title: t('Salary') },
  { name: 'Leaves', component: LeavesScreen, icon: Clock, title: t('Leaves') },
  { name: 'Requests', component: RequestsScreen, icon: ClipboardList, title: t('Requests') },
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
