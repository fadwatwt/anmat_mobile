import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Briefcase, Building2, BadgeAlert as Badge, Banknote, Clock, UserCog, Shield, Trash2, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { fetchEmployeeProfile, deleteEmployee, toggleEmployeeActivity, fetchEmployeeRequests } from '../services/employees';
import { EmployeeDetailItem, EmployeeRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useAppNavigation } from '../context/NavigationContext';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

function ProfileTab({ employee }: { employee: EmployeeDetailItem }) {
  const { colors } = useTheme();
  const u: { name?: string; email?: string; phone?: string; is_active?: boolean } = employee.user || {};

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.ink }]}>{value || '—'}</Text>
    </View>
  );

  const posTitle = typeof employee.position_id === 'object' ? employee.position_id?.title : '';
  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Personal Information</Text>
        <Row label="Name" value={u.name} />
        <Row label="Email" value={u.email} />
        <Row label="Phone" value={u.phone} />
        <Row label="Status" value={u.is_active ? 'Active' : 'Inactive'} />
        <Row label="Country" value={employee.country} />
        <Row label="City" value={employee.city} />
        {employee.date_of_birth && <Row label="Date of Birth" value={new Date(employee.date_of_birth).toLocaleDateString('ar-SA')} />}
      </View>

      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.ink }]}>Work Information</Text>
        <Row label="Department" value={employee.department?.name} />
        <Row label="Position" value={posTitle} />
        <Row label="Salary" value={employee.salary ? `$${employee.salary.toLocaleString()}` : ''} />
        <Row label="Work Hours" value={employee.work_hours ? `${employee.work_hours} hrs/day` : ''} />
        <Row label="Rating" value={employee.overall_rating > 0 ? `${employee.overall_rating}/5` : 'No rating yet'} />
      </View>

      {employee.createdAt && (
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.ink }]}>Additional Info</Text>
          <Row label="Registered" value={new Date(employee.createdAt).toLocaleDateString('ar-SA')} />
          <Row label="Registration Status" value={employee.registration_status} />
        </View>
      )}
    </ScrollView>
  );
}

function RequestsTab({ employee }: { employee: EmployeeDetailItem }) {
  const { colors } = useTheme();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchEmployeeRequests({ employee_id: employee._id });
        setRequests(res.data);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (!requests.length) return <Text style={[styles.emptyText, { color: colors.textMuted }]}>No requests</Text>;

  return (
    <ScrollView style={styles.tabContent}>
      {requests.map(r => (
        <View key={r._id} style={styles.sectionCard}>
          <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{r.type}</Text>
          <Text style={[styles.rowValue, { color: colors.ink }]}>{r.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function LeavesTab({ employee }: { employee: EmployeeDetailItem }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
      <Clock size={40} color={colors.textMuted} />
      <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Leaves coming soon</Text>
    </View>
  );
}

function FinancialTab({ employee }: { employee: EmployeeDetailItem }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.placeholder, { backgroundColor: colors.surface }]}>
      <Banknote size={40} color={colors.textMuted} />
      <Text style={[styles.placeholderText, { color: colors.textMuted }]}>Financial details coming soon</Text>
    </View>
  );
}

export function EmployeeDetailScreen() {
  const { routeParams, goBack } = useAppNavigation();
  const employeeParam = routeParams?.employee as EmployeeDetailItem | undefined;
  const employeeId = routeParams?.employee_id as string | undefined;
  const { colors } = useTheme();
  const { user: authUser } = useAuth();
  const [employee, setEmployee] = useState<EmployeeDetailItem | null>(employeeParam || null);
  const [loading, setLoading] = useState(!employee && !!employeeId);

  useEffect(() => {
    if (!employee && employeeId) {
      (async () => {
        try {
          const emp = await fetchEmployeeProfile(employeeId);
          setEmployee(emp);
        } catch (e) {
          Alert.alert('Error', 'Failed to load employee data');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [employeeId]);

  const handleToggleActivity = async () => {
    if (!employee) return;
    try {
      const updated = await toggleEmployeeActivity(employee.user_id);
      setEmployee(updated);
    } catch (e) {
      Alert.alert('Error', 'Failed to toggle status');
    }
  };

  const handleDelete = () => {
    if (!employee) return;
    Alert.alert('Delete Employee', `Are you sure you want to delete ${employee.user?.name || 'this employee'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmployee(employee.user_id);
            goBack();
          } catch { Alert.alert('Error', 'Failed to delete'); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;
  if (!employee) return <Text style={styles.errorText}>Employee not found</Text>;

  const u: { name?: string; email?: string; phone?: string; is_active?: boolean } = employee.user || {};
  const isActive = u.is_active;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={goBack} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.ink }]}>Employee Details</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{u.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.ink }]}>{u.name || 'Unknown'}</Text>
        <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{u.email || ''}</Text>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusText, { color: isActive ? '#166534' : '#991B1B' }]}>
            {isActive ? 'Active' : 'Inactive'}
          </Text>
        </View>
      </View>

      {authUser?.type === 'Subscriber' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleToggleActivity}>
            {isActive ? <ToggleLeft size={20} color="#F59E0B" /> : <ToggleRight size={20} color="#10B981" />}
            <Text style={styles.actionText}>{isActive ? 'Deactivate' : 'Activate'}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Trash2 size={20} color="#DF1C41" />
            <Text style={[styles.actionText, { color: '#DF1C41' }]}>Delete</Text>
          </TouchableOpacity>
        </View>
      )}

      <Tab.Navigator
        screenOptions={{
          tabBarStyle: { backgroundColor: colors.surface, elevation: 0 },
          tabBarIndicatorStyle: { backgroundColor: colors.primary },
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textMuted,
          tabBarLabelStyle: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold },
        }}
      >
        {<Tab.Screen name="profile" children={() => <ProfileTab employee={employee} />} />}
        {<Tab.Screen name="requests" children={() => <RequestsTab employee={employee} />} />}
        {<Tab.Screen name="leaves" children={() => <LeavesTab employee={employee} />} />}
        {<Tab.Screen name="financial" children={() => <FinancialTab employee={employee} />} />}
      </Tab.Navigator>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loading: { flex: 1, justifyContent: 'center' },
  errorText: { textAlign: 'center', padding: spacing.xl, color: '#EF4444' },
  emptyText: { textAlign: 'center', padding: spacing.xl, fontSize: font.sizes.sm },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1 },
  backBtn: { width: 40, padding: spacing.xs },
  headerTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold },
  profileCard: { alignItems: 'center', padding: spacing.lg, marginBottom: spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.sm },
  avatarText: { fontSize: font.sizes.xxl, fontWeight: font.weights.bold, color: '#FFF' },
  profileName: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  profileEmail: { fontSize: font.sizes.sm, marginBottom: spacing.sm },
  statusBadge: { paddingHorizontal: 14, paddingVertical: 4, borderRadius: 99 },
  statusText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  actionsRow: { flexDirection: 'row', justifyContent: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radii.lg, borderWidth: 1, borderColor: '#E5E7EB' },
  actionText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, color: '#374151' },
  deleteBtn: { borderColor: '#FECDD3' },
  tabContent: { padding: spacing.md },
  sectionCard: { backgroundColor: '#FFF', borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: '#E5E7EB' },
  sectionTitle: { fontSize: font.sizes.base, fontWeight: font.weights.semibold, marginBottom: spacing.md },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  rowLabel: { fontSize: font.sizes.sm },
  rowValue: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, maxWidth: '60%', textAlign: 'right' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, margin: spacing.md, borderRadius: radii.xl },
  placeholderText: { fontSize: font.sizes.sm, marginTop: spacing.sm },
});
