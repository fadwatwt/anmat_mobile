import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useTranslation } from 'react-i18next';
import { Settings, Bell, Clock, MessageSquare, ClipboardList, User, Sparkles } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { font, radii, spacing } from '../theme';

import GeneralSettingsTab from './settings/GeneralSettingsTab';
import NotificationsTab from './settings/NotificationsTab';
import AttendanceSettingsTab from './settings/AttendanceSettingsTab';
import ConversationsSettingsTab from './settings/ConversationsSettingsTab';
import TasksSettingsTab from './settings/TasksSettingsTab';
import ProfileSecurityTab from './settings/ProfileSecurityTab';
import AiSettingsTab from './settings/AiSettingsTab';

const Tab = createMaterialTopTabNavigator();

export default function SettingsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { user } = useAuth();
  const { isRTL } = useLocale();

  const tabs = [
    { name: 'General', component: GeneralSettingsTab, icon: Settings, title: t('General') },
    { name: 'Notifications', component: NotificationsTab, icon: Bell, title: t('Notifications') },
    { name: 'Attendance', component: AttendanceSettingsTab, icon: Clock, title: t('Attendance') },
    { name: 'Conversations', component: ConversationsSettingsTab, icon: MessageSquare, title: t('Conversations') },
    { name: 'Tasks', component: TasksSettingsTab, icon: ClipboardList, title: t('Tasks') },
    { name: 'ProfileSecurity', component: ProfileSecurityTab, icon: User, title: t('Privacy & Security') },
  ] as const;

  if (user?.type === 'Admin') {
    (tabs as any).push({ name: 'AI', component: AiSettingsTab, icon: Sparkles, title: t('AI Assistant') });
  }

  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.headerIcon, { backgroundColor: colors.primaryLight }]}>
          <Settings size={20} color={colors.primary} />
        </View>
        <View style={{ alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
          <Text style={[styles.headerTitle, { color: colors.ink, textAlign: align }]}>{t('Settings Page')}</Text>
          <Text style={[styles.headerSub, { color: colors.textMuted, textAlign: align }]}>
            {t('Manage your preferences and configure various options.')}
          </Text>
        </View>
      </View>

      {/* Tabs */}
      <Tab.Navigator
        screenOptions={({ route }) => {
          const cfg = tabs.find((tb) => tb.name === route.name);
          return {
            tabBarLabel: cfg?.title,
            tabBarIcon: ({ color }: { color: string }) => {
              const Icon = cfg?.icon;
              return Icon ? <Icon size={16} color={color} strokeWidth={2} /> : <></>;
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderBottomWidth: 1,
              borderBottomColor: colors.border,
              elevation: 0,
            },
            tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
            tabBarLabelStyle: { fontSize: 10, fontWeight: '600' as const, textTransform: 'none' as const },
            tabBarScrollEnabled: true,
            tabBarItemStyle: { width: 'auto', minWidth: 80, paddingHorizontal: spacing.xs },
            headerShown: false,
            lazy: true,
          };
        }}
      >
        {tabs.map(({ name, component }) => (
          <Tab.Screen key={name} name={name} component={component} />
        ))}
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  headerSub: { fontSize: font.sizes.xs },
});
