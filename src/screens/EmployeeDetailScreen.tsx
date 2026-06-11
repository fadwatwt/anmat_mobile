import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import { ArrowLeft, Mail, Phone, Calendar, MapPin, Briefcase, Building2, Banknote, Clock, UserCog, Shield, Trash2, ToggleLeft, ToggleRight } from 'lucide-react-native';
import { fetchEmployeeProfile, deleteEmployee, toggleEmployeeActivity, fetchEmployeeRequests } from '../services/employees';
import { fetchLeaves, fetchSalaryTransactions } from '../services/hr';
import { EmployeeDetailItem, EmployeeRequest, LeaveRecord, SalaryTransaction } from '../types';
import { Badge } from '../components/Badge';
import { useAuth } from '../context/AuthContext';
import { useLocale } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/types';
import { font, radii, spacing } from '../theme';

const Tab = createMaterialTopTabNavigator();

function ProfileTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const u: { name?: string; email?: string; phone?: string; is_active?: boolean } = employee.user || {};

  const Row = ({ label, value }: { label: string; value?: string | number | null }) => (
    <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
      <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{label}</Text>
      <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{value || '—'}</Text>
    </View>
  );

  const posTitle = typeof employee.position_id === 'object' ? employee.position_id?.title : '';
  return (
    <ScrollView style={styles.tabContent}>
      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Personal Information')}</Text>
        <Row label={t('Name')} value={u.name} />
        <Row label={t('Email')} value={u.email} />
        <Row label={t('Phone')} value={u.phone} />
        <Row label={t('Status')} value={u.is_active ? t('Active') : t('Inactive')} />
        <Row label={t('Country')} value={employee.country} />
        <Row label={t('City')} value={employee.city} />
        {employee.date_of_birth && <Row label={t('Date of Birth')} value={new Date(employee.date_of_birth).toLocaleDateString('ar-SA')} />}
      </View>

      <View style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Work Information')}</Text>
        <Row label={t('Department')} value={employee.department?.name} />
        <Row label={t('Position')} value={posTitle} />
        <Row label={t('Salary')} value={employee.salary ? `$${employee.salary.toLocaleString()}` : ''} />
        <Row label={t('Work Hours')} value={employee.work_hours ? `${employee.work_hours} hrs/day` : ''} />
        <Row label={t('Rating')} value={employee.overall_rating > 0 ? `${employee.overall_rating}/5` : t('No rating yet')} />
      </View>

      {employee.createdAt && (
        <View style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{t('Additional Info')}</Text>
          <Row label={t('Registered')} value={new Date(employee.createdAt).toLocaleDateString('ar-SA')} />
          <Row label={t('Registration Status')} value={employee.registration_status} />
        </View>
      )}
    </ScrollView>
  );
}

function RequestsTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [requests, setRequests] = useState<EmployeeRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchEmployeeRequests({ employee_id: employee._id });
        setRequests(Array.isArray(res?.data) ? res.data : []);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (!requests.length) return <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('No requests')}</Text>;

  return (
    <ScrollView style={styles.tabContent}>
      {requests.map(r => (
        <View key={r._id} style={styles.sectionCard}>
          <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{r.type}</Text>
          <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{r.status}</Text>
        </View>
      ))}
    </ScrollView>
  );
}

function LeavesTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [leaves, setLeaves] = useState<LeaveRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchLeaves({ employee_id: employee._id });
        setLeaves(Array.isArray(res?.data) ? res.data : []);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (!leaves.length) return <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('No leave records')}</Text>;

  const typeLabels: Record<string, string> = {
    annual: 'Annual', sick: 'Sick', emergency: 'Emergency',
    maternity: 'Maternity', paternity: 'Paternity', unpaid: 'Unpaid', other: 'Other',
  };
  const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
    approved: 'success', rejected: 'danger', pending: 'warning', cancelled: 'default',
  };
  const statusLabels: Record<string, string> = {
    approved: 'Approved', rejected: 'Rejected', pending: 'Pending', cancelled: 'Cancelled',
  };

  return (
    <ScrollView style={styles.tabContent}>
      {leaves.map(l => (
        <View key={l._id} style={styles.sectionCard}>
          <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
              {t(typeLabels[l.type] || l.type)}
            </Text>
            <Badge label={t(statusLabels[l.status] || l.status)} variant={statusVariant[l.status] || 'default'} />
          </View>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('From')}</Text>
            <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{l.start_date}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('To')}</Text>
            <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{l.end_date}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Days')}</Text>
            <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{l.days_count || '-'}</Text>
          </View>
          {l.reason && (
            <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Reason')}</Text>
              <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{l.reason}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

function FinancialTab({ employee }: { employee: EmployeeDetailItem }) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isRTL } = useLocale();
  const [transactions, setTransactions] = useState<SalaryTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetchSalaryTransactions({ employee_id: employee._id });
        setTransactions(Array.isArray(res?.data) ? res.data : []);
      } catch {} finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} />;
  if (!transactions.length) return <Text style={[styles.emptyText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('No financial transactions')}</Text>;

  const statusVariant: Record<string, 'success' | 'danger' | 'warning' | 'default'> = {
    paid: 'success', cancelled: 'danger', pending: 'warning',
  };
  const statusLabels: Record<string, string> = {
    paid: 'Paid', cancelled: 'Cancelled', pending: 'Pending',
  };

  return (
    <ScrollView style={styles.tabContent}>
      {transactions.map(tx => (
        <View key={tx._id} style={styles.sectionCard}>
          <View style={[styles.cardHeader, { flexDirection: isRTL ? 'row-reverse' : 'row' }]}>
            <Text style={[styles.cardTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>
              {t(tx.type.charAt(0).toUpperCase() + tx.type.slice(1))}
            </Text>
            <Badge label={t(statusLabels[tx.status] || tx.status)} variant={statusVariant[tx.status] || 'default'} />
          </View>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Amount')}</Text>
            <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{tx.amount?.toLocaleString()}</Text>
          </View>
          <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
            <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Month')}</Text>
            <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{tx.month} {tx.year}</Text>
          </View>
          {tx.description && (
            <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Description')}</Text>
              <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{tx.description}</Text>
            </View>
          )}
          {tx.paid_date && (
            <View style={[styles.row, { borderBottomColor: colors.borderLight }]}>
              <Text style={[styles.rowLabel, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{t('Paid Date')}</Text>
              <Text style={[styles.rowValue, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{tx.paid_date}</Text>
            </View>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

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
        try {
          const emp = await fetchEmployeeProfile(employeeId);
          setEmployee(emp);
        } catch (e) {
          Alert.alert(t('Error'), t('Failed to load employee data'));
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
      Alert.alert(t('Error'), t('Failed to toggle status'));
    }
  };

  const handleDelete = () => {
    if (!employee) return;
    Alert.alert(t('Delete Employee'), `${t('Are you sure you want to delete')} ${employee.user?.name || t('this employee')}?`, [
      { text: t('Cancel'), style: 'cancel' },
      {
        text: t('Delete'), style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmployee(employee.user_id);
            navigation.goBack();
          } catch { Alert.alert(t('Error'), t('Failed to delete')); }
        },
      },
    ]);
  };

  if (loading) return <ActivityIndicator style={styles.loading} color={colors.primary} size="large" />;
  if (!employee) return <Text style={[styles.errorText, { textAlign: isRTL ? 'right' : 'left' }]}>{t('Employee not found')}</Text>;

  const u: { name?: string; email?: string; phone?: string; is_active?: boolean } = employee.user || {};
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
          <Text style={[styles.avatarText, { textAlign: isRTL ? 'right' : 'left' }]}>{u.name?.charAt(0)?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={[styles.profileName, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>{u.name || t('Unknown')}</Text>
        <Text style={[styles.profileEmail, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{u.email || ''}</Text>
        <View style={[styles.statusBadge, { backgroundColor: isActive ? '#DCFCE7' : '#FEE2E2' }]}>
          <Text style={[styles.statusText, { color: isActive ? '#166534' : '#991B1B', textAlign: isRTL ? 'right' : 'left' }]}>
            {isActive ? t('Active') : t('Inactive')}
          </Text>
        </View>
      </View>

      {authUser?.type === 'Subscriber' && (
        <View style={styles.actionsRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={handleToggleActivity}>
            {isActive ? <ToggleLeft size={20} color="#F59E0B" /> : <ToggleRight size={20} color="#10B981" />}
            <Text style={[styles.actionText, { textAlign: isRTL ? 'right' : 'left' }]}>{isActive ? t('Deactivate') : t('Activate')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.actionBtn, styles.deleteBtn]} onPress={handleDelete}>
            <Trash2 size={20} color="#DF1C41" />
            <Text style={[styles.actionText, { color: '#DF1C41', textAlign: isRTL ? 'right' : 'left' }]}>{t('Delete')}</Text>
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
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  cardTitle: { fontSize: font.sizes.base, fontWeight: font.weights.semibold },
  row: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: spacing.sm, borderBottomWidth: 1 },
  rowLabel: { fontSize: font.sizes.sm },
  rowValue: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, maxWidth: '60%' },
  placeholder: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, margin: spacing.md, borderRadius: radii.xl },
  placeholderText: { fontSize: font.sizes.sm, marginTop: spacing.sm },
});
