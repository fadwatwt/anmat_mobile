import React, { useCallback, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { CalendarDays, CalendarRange, List, Plus } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { EmptyState } from '../components/EmptyState';
import { HourlyTimeline } from '../components/agenda/HourlyTimeline';
import { MonthlyCalendar } from '../components/agenda/MonthlyCalendar';
import { AppointmentCard } from '../components/agenda/AppointmentCard';
import { DailyTaskCard } from '../components/agenda/DailyTaskCard';
import { CreateAgendaModal } from '../components/agenda/CreateAgendaModal';
import {
  Appointment, DailyTask,
  fetchTodayAppointments, fetchMonthAppointments, fetchAppointments, fetchDailyTasks,
  completeAppointment, cancelAppointment, completeDailyTask, deleteDailyTask,
} from '../services/appointments';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

// ===== Today tab =====

function TodayTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const role = user?.type;
  const todayStr = new Date().toISOString().slice(0, 10);

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [appts, tks] = await Promise.all([
        fetchTodayAppointments(role).catch(() => []),
        fetchDailyTasks(role, { date: todayStr }).catch(() => []),
      ]);
      setAppointments(appts);
      setTasks(tks);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role, todayStr]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleCompleteTask = async (id: string) => { await completeDailyTask(role, id).catch(() => {}); load(); };
  const handleDeleteTask = async (id: string) => { await deleteDailyTask(role, id).catch(() => {}); load(); };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;

  const priorities = tasks.filter((tk) => (tk.priority === 'urgent' || tk.priority === 'high') && tk.status !== 'completed').slice(0, 3);

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary bar */}
      <View style={[styles.summaryBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Summary value={appointments.length} label={t('Appointments')} color="#375DFB" />
        <Summary value={tasks.length} label={t('Daily Tasks')} color="#10B981" />
        <Summary value={priorities.length} label={t('Priorities')} color="#EF4444" />
      </View>

      <HourlyTimeline appointments={appointments} />

      {/* Priorities */}
      {priorities.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Priorities')}</Text>
          {priorities.map((tk) => (
            <DailyTaskCard key={tk._id} task={tk} onComplete={handleCompleteTask} onDelete={handleDeleteTask} />
          ))}
        </View>
      )}

      {/* Today's tasks */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t("Today's Tasks")}</Text>
        {tasks.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No daily tasks')}</Text>
        ) : (
          tasks.map((tk) => (
            <DailyTaskCard key={tk._id} task={tk} onComplete={handleCompleteTask} onDelete={handleDeleteTask} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

function Summary({ value, label, color }: { value: number; label: string; color: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryValue, { color }]}>{value}</Text>
      <Text style={[styles.summaryLabel, { color: colors.textMuted }]} numberOfLines={1}>{label}</Text>
    </View>
  );
}

// ===== Calendar tab =====

function CalendarTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const role = user?.type;

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDate, setSelectedDate] = useState<string | null>(now.toISOString().slice(0, 10));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setAppointments(await fetchMonthAppointments(role, year, month).catch(() => []));
    } finally {
      setLoading(false);
    }
  }, [role, year, month]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const dayAppointments = appointments.filter((a) => (a.date || '').slice(0, 10) === selectedDate);

  return (
    <ScrollView style={{ backgroundColor: colors.background }} contentContainerStyle={styles.tabContent} showsVerticalScrollIndicator={false}>
      <MonthlyCalendar
        year={year}
        month={month}
        appointments={appointments}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
        onChangeMonth={(y, m) => { setYear(y); setMonth(m); }}
      />
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {selectedDate || t('Selected Day')}
        </Text>
        {loading ? (
          <ActivityIndicator color={colors.primary} />
        ) : dayAppointments.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No appointments found')}</Text>
        ) : (
          dayAppointments.map((a) => <AppointmentCard key={a._id} appointment={a} />)
        )}
      </View>
    </ScrollView>
  );
}

// ===== List tab =====

function ListTab() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const { user } = useAuth();
  const role = user?.type;

  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [tasks, setTasks] = useState<DailyTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const [appts, tks] = await Promise.all([
        fetchAppointments(role).catch(() => []),
        fetchDailyTasks(role).catch(() => []),
      ]);
      setAppointments(appts);
      setTasks(tks);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [role]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const handleComplete = async (id: string) => { await completeAppointment(role, id).catch(() => {}); load(); };
  const handleCancel = async (id: string) => { await cancelAppointment(role, id).catch(() => {}); load(); };
  const handleCompleteTask = async (id: string) => { await completeDailyTask(role, id).catch(() => {}); load(); };
  const handleDeleteTask = async (id: string) => { await deleteDailyTask(role, id).catch(() => {}); load(); };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;

  const upcoming = appointments.filter((a) => a.status === 'upcoming' || !a.status);
  const completed = appointments.filter((a) => a.status === 'completed');

  return (
    <ScrollView
      style={{ backgroundColor: colors.background }}
      contentContainerStyle={styles.tabContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} colors={[colors.primary]} />}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
          {t('Upcoming')} ({upcoming.length})
        </Text>
        {upcoming.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No appointments found')}</Text>
        ) : (
          upcoming.map((a) => <AppointmentCard key={a._id} appointment={a} onComplete={handleComplete} onCancel={handleCancel} showCountdown />)
        )}
      </View>

      {completed.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
            {t('Completed')} ({completed.length})
          </Text>
          {completed.map((a) => <AppointmentCard key={a._id} appointment={a} />)}
        </View>
      )}

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Daily Tasks')}</Text>
        {tasks.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted }]}>{t('No daily tasks')}</Text>
        ) : (
          tasks.map((tk) => <DailyTaskCard key={tk._id} task={tk} onComplete={handleCompleteTask} onDelete={handleDeleteTask} />)
        )}
      </View>
    </ScrollView>
  );
}

// ===== Main screen =====

export default function AgendaScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [createOpen, setCreateOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const tabs = [
    { name: 'Today', component: TodayTab, icon: CalendarDays, title: t('Today') },
    { name: 'Calendar', component: CalendarTab, icon: CalendarRange, title: t('Calendar') },
    { name: 'List', component: ListTab, icon: List, title: t('List') },
  ] as const;

  return (
    <View style={styles.container}>
      <Tab.Navigator
        key={reloadKey}
        screenOptions={({ route }) => {
          const cfg = tabs.find((tb) => tb.name === route.name);
          return {
            tabBarLabel: cfg?.title,
            tabBarIcon: ({ color }) => {
              const Icon = cfg?.icon;
              return Icon ? <Icon size={18} color={color} strokeWidth={2} /> : <></>;
            },
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, elevation: 0 },
            tabBarIndicatorStyle: { backgroundColor: colors.primary, height: 3 },
            tabBarLabelStyle: { fontSize: 11, fontWeight: '600', textTransform: 'none' },
            headerShown: false,
          };
        }}
      >
        {tabs.map(({ name, component }) => (
          <Tab.Screen key={name} name={name} component={component} />
        ))}
      </Tab.Navigator>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setCreateOpen(true)} activeOpacity={0.85}>
        <Plus size={24} color="#FFF" />
      </TouchableOpacity>

      <CreateAgendaModal
        visible={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={() => setReloadKey((k) => k + 1)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  emptyText: { fontSize: font.sizes.sm, paddingVertical: spacing.md, textAlign: 'center' },
  fab: {
    alignItems: 'center', borderRadius: radii.full, bottom: spacing.xl, height: 44, justifyContent: 'center',
    position: 'absolute', right: spacing.lg, width: 44,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 4, elevation: 5,
  },
  loading: { flex: 1, padding: spacing.xxl },
  section: { gap: spacing.sm },
  sectionTitle: { fontSize: font.sizes.base, fontWeight: font.weights.bold },
  summaryBar: {
    borderRadius: radii.xxl, borderWidth: 1, flexDirection: 'row', justifyContent: 'space-around', padding: spacing.md,
  },
  summaryItem: { alignItems: 'center', gap: 2 },
  summaryLabel: { fontSize: font.sizes.xs },
  summaryValue: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  tabContent: { gap: spacing.md, padding: spacing.md, paddingBottom: 90 },
});
