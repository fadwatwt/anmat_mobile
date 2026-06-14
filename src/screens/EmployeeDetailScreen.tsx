import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ArrowLeft, Trash2, ToggleLeft, ToggleRight, Plus } from 'lucide-react-native';
import { fetchEmployeeProfile, deleteEmployee, toggleEmployeeActivity, fetchEmployeeRequests } from '../services/employees';
import { fetchOrgLeaves, fetchOrgAttendances, fetchOrgSalaryTransactions, deleteOrgLeave, deleteOrgAttendance, deleteOrgSalaryTransaction, OrgAttendance, OrgLeave, OrgSalaryTransaction } from '../services/hr';
import { EmployeeDetailItem, EmployeeRequest } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import { AddAttendanceModal } from '../modals/AddAttendanceModal';
import { AddShortLeaveModal } from '../modals/AddShortLeaveModal';
import { AddSalaryModal } from '../modals/AddSalaryModal';
import { extractErrorMessage } from '../lib/http';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

// ─── Profile tab ─────────────────────────────────────────────────────────────
function ProfileTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const u = employee.user || {} as any;
  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.ink, textAlign: align }]}>{value || '—'}</Text>
    </View>
  );

  const posTitle = typeof employee.position_id === 'object' ? employee.position_id?.title : '';
  return (
    <ScrollView style={styles.tabContent}>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Personal Information')}</Text>
        <Row label={t('Name')} value={u.name} />
        <Row label={t('Email')} value={u.email} />
        <Row label={t('Phone')} value={u.phone} />
        <Row label={t('Status')} value={u.is_active ? t('Active') : t('Inactive')} />
        <Row label={t('Country')} value={employee.country} />
        <Row label={t('City')} value={employee.city} />
        {employee.date_of_birth && <Row label={t('Date of Birth')} value={new Date(employee.date_of_birth).toLocaleDateString()} />}
      </View>
      <View style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: align }]}>{t('Work Information')}</Text>
        <Row label={t('Department')} value={employee.department?.name} />
        <Row label={t('Position')} value={posTitle} />
        <Row label={t('Salary')} value={employee.salary ? `$${employee.salary.toLocaleString()}` : ''} />
        <Row label={t('Work Hours')} value={employee.work_hours ? `${employee.work_hours} hrs/day` : ''} />
        <Row label={t('Rating')} value={employee.overall_rating > 0 ? `${employee.overall_rating}/5` : t('No rating yet')} />
      </View>
    </ScrollView>
  );
}

// ─── Attendance tab ───────────────────────────────────────────────────────────
function AttendanceTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const [records, setRecords] = useState<OrgAttendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchOrgAttendances({ employee_id: employee.user_id });
      setRecords(res.data);
    } catch { setRecords([]); } finally { setLoading(false); }
  }, [employee.user_id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (item: OrgAttendance) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try { await deleteOrgAttendance(item._id); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.tabContent}>
        {records.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: align }]}>{t('No attendance records')}</Text>
        ) : (
          records.map(r => (
            <View key={r._id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]}>{r.date || '--'}</Text>
                <View style={{ flexDirection: 'row', gap: spacing.xs, alignItems: 'center' }}>
                  {(r.late_in_minutes ?? 0) > 0
                    ? <Badge label={`${r.late_in_minutes} ${t('min')}`} variant="warning" />
                    : <Badge label={t('On Time')} variant="success" />
                  }
                  <TouchableOpacity onPress={() => handleDelete(r)}>
                    <Text style={{ color: '#EF4444', fontSize: font.sizes.xs }}>{t('Delete')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{t('Start Time')}</Text>
                <Text style={[styles.rowValue, { color: colors.ink, textAlign: align }]}>{r.start_time || '--'}</Text>
              </View>
              <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{t('End Time')}</Text>
                <Text style={[styles.rowValue, { color: r.end_time ? colors.ink : '#C2540A', textAlign: align }]}>
                  {r.end_time || t('In Progress')}
                </Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalOpen(true)}>
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>

      <AddAttendanceModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
      />
    </View>
  );
}

// ─── Short Leaves tab ─────────────────────────────────────────────────────────
function LeavesTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const [leaves, setLeaves] = useState<OrgLeave[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchOrgLeaves({ employee_id: employee.user_id });
      setLeaves(res.data);
    } catch { setLeaves([]); } finally { setLoading(false); }
  }, [employee.user_id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (item: OrgLeave) => {
    Alert.alert(t('Delete Short Leave Record'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try { await deleteOrgLeave(item._id); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.tabContent}>
        {leaves.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: align }]}>{t('No leave records')}</Text>
        ) : (
          leaves.map(l => (
            <View key={l._id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]}>{l.date || '--'}</Text>
                <TouchableOpacity onPress={() => handleDelete(l)}>
                  <Text style={{ color: '#EF4444', fontSize: font.sizes.xs }}>{t('Delete')}</Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{t('Start Time')}</Text>
                <Text style={[styles.rowValue, { color: colors.ink, textAlign: align }]}>{l.start_time || '--'}</Text>
              </View>
              <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
                <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{t('End Time')}</Text>
                <Text style={[styles.rowValue, { color: colors.ink, textAlign: align }]}>{l.end_time || '--'}</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalOpen(true)}>
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>

      <AddShortLeaveModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
        presetEmployeeId={employee.user_id}
      />
    </View>
  );
}

// ─── Salary tab ───────────────────────────────────────────────────────────────
function SalaryTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const [transactions, setTransactions] = useState<OrgSalaryTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await fetchOrgSalaryTransactions({ employee_id: employee.user_id });
      setTransactions(res.data);
    } catch { setTransactions([]); } finally { setLoading(false); }
  }, [employee.user_id]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = (item: OrgSalaryTransaction) => {
    Alert.alert(t('Delete'), t('Are you sure?'), [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try { await deleteOrgSalaryTransaction(item._id); load(); }
          catch (e) { Alert.alert(t('Error'), extractErrorMessage(e)); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.tabContent}>
        {transactions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: align }]}>{t('No financial transactions')}</Text>
        ) : (
          transactions.map(tx => (
            <View key={tx._id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
                <Text style={[styles.cardTitle, { color: colors.ink, textAlign: align }]}>
                  {tx.amount != null ? `$${tx.amount.toLocaleString()}` : '--'}
                </Text>
                <TouchableOpacity onPress={() => handleDelete(tx)}>
                  <Text style={{ color: '#EF4444', fontSize: font.sizes.xs }}>{t('Delete')}</Text>
                </TouchableOpacity>
              </View>
              {tx.bonus != null && tx.bonus > 0 && (
                <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{t('Bonus')}</Text>
                  <Text style={[styles.rowValue, { color: '#10B981', textAlign: align }]}>+${tx.bonus.toLocaleString()}</Text>
                </View>
              )}
              {tx.discount != null && tx.discount > 0 && (
                <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{t('Deduction')}</Text>
                  <Text style={[styles.rowValue, { color: '#EF4444', textAlign: align }]}>-${tx.discount.toLocaleString()}</Text>
                </View>
              )}
              {tx.comment && (
                <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
                  <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{t('Comment')}</Text>
                  <Text style={[styles.rowValue, { color: colors.ink, textAlign: align }]}>{tx.comment}</Text>
                </View>
              )}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalOpen(true)}>
        <Plus size={22} color="#FFF" />
      </TouchableOpacity>

      <AddSalaryModal
        visible={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setModalOpen(false); load(); }}
        presetEmployeeId={employee.user_id}
      />
    </View>
  );
}

// ─── Requests tab ─────────────────────────────────────────────────────────────
function RequestsTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const align = (isRTL ? 'right' : 'left') as 'right' | 'left';
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchEmployeeRequests({ employee_id: employee.user_id });
        setRequests(Array.isArray(res?.data) ? res.data : []);
      } catch { } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (!requests.length) return <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: align }]}>{t('No requests')}</Text>;

  return (
    <ScrollView style={styles.tabContent}>
      {requests.map(r => (
        <View key={r._id} style={[styles.sectionCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: align }]}>{r.type}</Text>
          <Text style={[styles.rowValue, { color: colors.ink, textAlign: align }]}>{r.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export function EmployeeDetailScreen() {
  const { t } = useTranslation();
  const route = useRoute<any>();
  const navigation = useNavigation();
  const employeeParam = route.params?.employee as EmployeeDetailItem | undefined;
  const employeeId = route.params?.employee_id as string | undefined;
  const { colors } = useTheme();
  const { user: authUser } = useAuth();
  const { isRTL } = useLocale();
  const [employee, setEmployee] = useState<EmployeeDetailItem | null>(employeeParam || null);
  const [loading, setLoading] = useState(!employee && !!employeeId);

  useEffect(() => {
    if (!employee && employeeId) {
      (async () => {
        try { setEmployee(await fetchEmployeeProfile(employeeId)); }
        catch { Alert.alert(t('Error'), t('Failed to load employee data')); }
        finally { setLoading(false); }
      })();
    }
  }, [employeeId]);

  const handleToggleActivity = async () => {
    if (!employee) return;
    try { setEmployee(await toggleEmployeeActivity(employee.user_id)); }
    catch { Alert.alert(t('Error'), t('Failed to toggle status')); }
  };

  const handleDelete = () => {
    if (!employee) return;
    Alert.alert(t('Delete Employee'), `${t('Are you sure you want to delete')} ${employee.user?.name || t('this employee')}?`, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try { await deleteEmployee(employee.user_id); navigation.goBack(); }
          catch { Alert.alert(t('Error'), t('Failed to delete')); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;
  if (!employee) return <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('Employee not found')}</Text>;

  const u = employee.user || {} as any;
  const isActive = u.is_active;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ArrowLeft size={24} color={colors.ink} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Employee Details')}</Text>
        <View style={styles.backBtn} />
      </View>

      <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={styles.avatarText}>{u.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.ink }]}>{u.name || t('Unknown')}</Text>
        <Text style={[styles.profileEmail, { color: colors.textMuted }]}>{u.email || ''}</Text>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusText, { color: isActive ? '#166534' : '#991B1B' }]}>
            {isActive ? t('Active') : t('Inactive')}
          </Text>
        </View>
      </View>

      {authUser?.type === 'Subscriber' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleToggleActivity}>
            {isActive ? <ToggleLeft size={20} color="#F59E0B" /> : <ToggleRight size={20} color="#10B981" />}
            <Text style={[styles.actionText, { color: '#374151' }]}>{isActive ? t('Deactivate') : t('Activate')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Trash2 size={20} color="#DF1C41" />
            <Text style={[styles.actionText, { color: '#DF1C41' }]}>{t('Delete')}</Text>
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
          tabBarScrollEnabled: true,
        }}
      >
        <Tab.Screen name="profile" options={{ title: t('Profile') }} children={() => <ProfileTab employee={employee} />} />
        <Tab.Screen name="attendance" options={{ title: t('Attendances') }} children={() => <AttendanceTab employee={employee} />} />
        <Tab.Screen name="leaves" options={{ title: t('Short Leaves') }} children={() => <LeavesTab employee={employee} />} />
        <Tab.Screen name="salary" options={{ title: t('Salary') }} children={() => <SalaryTab employee={employee} />} />
        <Tab.Screen name="requests" options={{ title: t('Requests') }} children={() => <RequestsTab employee={employee} />} />
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
  actionText: { fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  deleteBtn: { borderColor: '#FECDD3' },
  tabContent: { flex: 1, padding: spacing.md },
  sectionCard: { borderRadius: radii.xl, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1 },
  sectionTitle: { fontSize: font.sizes.base, fontWeight: font.weights.semibold, marginBottom: spacing.md },
  cardHeader: { justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  rowLabel: { fontSize: font.sizes.sm },
  rowValue: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, maxWidth: '60%' },
  fab: {
    position: 'absolute', bottom: spacing.xl, right: spacing.xl,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3,
  },
});
