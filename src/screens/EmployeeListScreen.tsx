import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator, Alert, Dimensions, FlatList, Image, Platform, RefreshControl,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import {
  Bell, Building2, Check, CheckCircle, ChevronLeft, ChevronRight,
  Copy, Edit3, LogOut, MessageCircle, MoreHorizontal, Plus,
  Search, ToggleLeft, ToggleRight, Trash2, UserPlus, UserRound, X,
} from 'lucide-react-native';
import { AccountDetails } from '../components/AccountDetails';
import { Badge } from '../components/Badge';
import { StarRating } from '../components/StarRating';
import { StatusActions } from '../components/StatusActions';
import type { ActionItem } from '../components/StatusActions';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useLocale } from '../context/LanguageContext';
import { useNavigation } from '@react-navigation/native';
import { AssignDepartmentModal } from '../modals/AssignDepartmentModal';
import { CreateEmployeeModal } from '../modals/CreateEmployeeModal';
import { EditEmployeeModal } from '../modals/EditEmployeeModal';
import { InviteEmployeeModal } from '../modals/InviteEmployeeModal';
import { SendNotificationModal } from '../modals/SendNotificationModal';
import {
  deleteEmployee as deleteEmployeeService,
  fetchEmployees,
  toggleEmployeeActivity,
  unassignEmployeesFromDepartment,
} from '../services/employees';
import { font, radii, spacing } from '../theme';
import type { EmployeeDetailItem } from '../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const ROWS_PER_PAGE_OPTIONS = [5, 10, 15, 20];
const COL_WIDTHS = [180, 170, 130, 100, 100, 120, 80, 50];
const HEADERS = ['Employees', 'Contact', 'Department', 'Salary', 'Rating', 'Registration', 'Status', ''];

export function EmployeeListScreen() {
  const navigation = useNavigation<any>();
  const { user } = useAuth();
  const { colors, isDark } = useTheme();
  const isSubscriber = user?.type === 'Subscriber';
  const { isRTL } = useLocale();

  const [employees, setEmployees] = useState<EmployeeDetailItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const [selectedEmp, setSelectedEmp] = useState<EmployeeDetailItem | null>(null);

  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showInvite, setShowInvite] = useState(false);
  const [showNotify, setShowNotify] = useState(false);
  const [showAssign, setShowAssign] = useState(false);

  const loadEmployees = useCallback(async (p: number = 1, isRefresh: boolean = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else if (p === 1) setLoading(true);
      const data = await fetchEmployees();
      setEmployees(data || []);
      setPage(1);
    } catch (e) {
      console.error('Failed to load employees:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search, rowsPerPage]);

  useEffect(() => { loadEmployees(1, true); }, [loadEmployees]);

  const filteredEmployees = useMemo(() => {
    if (!search) return employees;
    return employees.filter(emp =>
      (emp.user?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (emp.user?.email || '').toLowerCase().includes(search.toLowerCase())
    );
  }, [employees, search]);

  const totalPages = Math.ceil(filteredEmployees.length / rowsPerPage) || 1;
  const startIndex = (page - 1) * rowsPerPage;
  const currentRows = filteredEmployees.slice(startIndex, startIndex + rowsPerPage);

  const handleDelete = (emp: EmployeeDetailItem) => {
    Alert.alert('Delete Employee', `Are you sure you want to delete ${emp.user?.name || 'this employee'}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteEmployeeService(emp.user_id);
            loadEmployees(1, true);
          } catch { Alert.alert('Error', 'Failed to delete employee'); }
        },
      },
    ]);
  };

  const handleToggleActive = (emp: EmployeeDetailItem) => {
    const isActive = emp.user?.is_active;
    Alert.alert(
      isActive ? 'Deactivate Employee' : 'Activate Employee',
      isActive ? 'Are you sure you want to deactivate this employee?' : 'Are you sure you want to activate this employee?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: isActive ? 'Deactivate' : 'Activate',
          onPress: async () => {
            try {
              await toggleEmployeeActivity(emp.user_id);
              loadEmployees(1, true);
            } catch { Alert.alert('Error', 'Failed to toggle status'); }
          },
        },
      ],
    );
  };

  const handleUnassignDepartment = (emp: EmployeeDetailItem) => {
    const deptId = typeof emp.department_id === 'object' ? emp.department_id?._id : emp.department_id;
    if (!deptId) return;
    Alert.alert(
      'Unassign Department',
      'Are you sure you want to unassign this employee from their department?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unassign',
          onPress: async () => {
            try {
              await unassignEmployeesFromDepartment(deptId, [emp._id]);
              loadEmployees(1, true);
            } catch { Alert.alert('Error', 'Failed to unassign'); }
          },
        },
      ],
    );
  };

  const buildActions = (emp: EmployeeDetailItem): ActionItem[] => {
    const hasDept = !!(emp.department || emp.department_id);
    const items: ActionItem[] = [
      { label: 'Edit', icon: <Edit3 size={16} color="#375DFB" />, onPress: () => { setSelectedEmp(emp); setShowEdit(true); } },
      { label: 'Send Notification', icon: <Bell size={16} color="#375DFB" />, onPress: () => { setSelectedEmp(emp); setShowNotify(true); } },
      {
        label: hasDept ? 'Change Department' : 'Assign Department',
        icon: <Building2 size={16} color="#10B981" />,
        onPress: () => { setSelectedEmp(emp); setShowAssign(true); },
      },
    ];
    if (hasDept) {
      items.push({
        label: 'Unassign Department', icon: <LogOut size={16} color="#F59E0B" />,
        onPress: () => handleUnassignDepartment(emp),
      });
    }
    items.push({
      label: emp.user?.is_active ? 'Deactivate' : 'Activate',
      icon: emp.user?.is_active ? <ToggleRight size={16} color="#F59E0B" /> : <ToggleLeft size={16} color="#10B981" />,
      onPress: () => handleToggleActive(emp),
    });
    items.push({
      label: 'Chat', icon: <MessageCircle size={16} color="#3B82F6" />,
      onPress: () => {},
    });
    items.push({
      label: 'Delete', icon: <Trash2 size={16} color="#DF1C41" />,
      onPress: () => handleDelete(emp), destructive: true,
    });
    return items;
  };

  const renderRow = (emp: EmployeeDetailItem, idx: number) => {
    const u: { name?: string; email?: string; phone?: string; is_active?: boolean } = emp.user || {};
    const role = emp.position_id && typeof emp.position_id === 'object' ? (emp.position_id as any).title : (u.is_active ? 'Active' : 'Inactive');
    return (
      <TouchableOpacity
        key={emp._id}
        style={[s.tr, { borderBottomColor: colors.border }]}
                onPress={() => navigation.navigate('EmployeeDetail', { employee: emp })}
        activeOpacity={0.7}
      >
        <View style={[s.td, { width: COL_WIDTHS[0] }]}>
          <AccountDetails
            name={u.name}
            role={typeof emp.position_id === 'object' ? emp.position_id?.title : (u.is_active ? 'Active' : 'Inactive')}
          />
        </View>
        <View style={[s.td, { width: COL_WIDTHS[1] }]}>
          <Text style={[s.contactEmail, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{u.email || 'N/A'}</Text>
          <Text style={[s.contactPhone, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{u.phone || 'N/A'}</Text>
        </View>
        <View style={[s.td, { width: COL_WIDTHS[2] }]}>
          <Text style={[s.deptName, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>
            {(emp.department?.name || (typeof emp.department_id === 'object' ? emp.department_id?.name : null)) || 'N/A'}
          </Text>
          <Text style={[s.deptLocation, { textAlign: isRTL ? 'right' : 'left' }]} numberOfLines={1}>{emp.country ? `${emp.country}, ${emp.city || ''}` : ''}</Text>
        </View>
        <View style={[s.td, { width: COL_WIDTHS[3] }]}>
          <Text style={[s.salaryAmount, { textAlign: isRTL ? 'right' : 'left' }]}>${emp.salary?.toLocaleString?.() || '0'}</Text>
          <Text style={[s.salaryHours, { textAlign: isRTL ? 'right' : 'left' }]}>{emp.work_hours || 0} hrs/day</Text>
        </View>
        <View style={[s.td, { width: COL_WIDTHS[4] }]}>
          {emp.overall_rating > 0 ? (
            <StarRating rating={emp.overall_rating} />
          ) : (
            <Text style={[s.noRating, { textAlign: isRTL ? 'right' : 'left' }]}>No rating yet</Text>
          )}
        </View>
        <View style={[s.td, { width: COL_WIDTHS[5] }]}>
          {emp.registration_status === 'complete' ? (
            <View style={s.regRow}>
              <CheckCircle size={16} color="#059669" />
              <Text style={[s.regComplete, { textAlign: isRTL ? 'right' : 'left' }]}>Complete</Text>
            </View>
          ) : emp.registration_status === 'registered' ? (
            <View style={s.regRow}>
              <UserRound size={16} color="#3B82F6" />
              <Text style={[s.regRegistered, { textAlign: isRTL ? 'right' : 'left' }]}>Registered</Text>
            </View>
          ) : (
            <View style={s.regCol}>
              <View style={s.regRow}>
                <UserPlus size={16} color="#F59E0B" />
                <Text style={[s.regPending, { textAlign: isRTL ? 'right' : 'left' }]}>Pending</Text>
              </View>
              {emp.invitation_token && (
                <TouchableOpacity style={s.copyLink} onPress={() => {
                  const link = `${Platform.select({ web: window.location.origin, default: '' })}/register/employee#reg_emp_t=${emp.invitation_token}#org=${emp.organization_id}`;
                  navigator.clipboard?.writeText(link);
                  Alert.alert('Copied', 'Invitation link copied to clipboard');
                }}>
                  <Copy size={10} color="#375DFB" />
                  <Text style={[s.copyLinkText, { textAlign: isRTL ? 'right' : 'left' }]}>Copy Link</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        <View style={[s.td, { width: COL_WIDTHS[6] }]}>
          <View style={[s.statusBadge, { backgroundColor: u.is_active ? '#DCFCE7' : '#FEE2E2' }]}>
            <Text style={[s.statusText, { color: u.is_active ? '#166534' : '#991B1B', textAlign: isRTL ? 'right' : 'left' }]}>
              {u.is_active ? 'Active' : 'Inactive'}
            </Text>
          </View>
        </View>
        <View style={[s.td, { width: COL_WIDTHS[7], justifyContent: 'center' }]}>
          <StatusActions actions={buildActions(emp)} />
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator style={s.loadingState} color={colors.primary} size="large" />;
  }

  return (
    <View style={s.container}>
      {/* Toolbar */}
      <View style={[s.toolbar, { borderBottomColor: colors.border }]}>
        <View style={s.toolbarLeft}>
          <Text style={[s.toolbarTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>Employees</Text>
        </View>
        <View style={s.toolbarRight}>
          {isSubscriber && (
            <>
              <TouchableOpacity style={[s.toolBtn, s.notifyBtn]} onPress={() => setShowNotify(true)}>
                <Bell size={16} color="#375DFB" />
                <Text style={[s.notifyBtnText, { textAlign: isRTL ? 'right' : 'left' }]}>Send Notification</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toolBtn, s.inviteBtn]} onPress={() => setShowInvite(true)}>
                <UserPlus size={16} color="#374151" />
                <Text style={[s.inviteBtnText, { textAlign: isRTL ? 'right' : 'left' }]}>Invite Employee</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.toolBtn, s.addBtn]} onPress={() => setShowCreate(true)}>
                <Plus size={16} color="#FFF" />
                <Text style={[s.addBtnText, { textAlign: isRTL ? 'right' : 'left' }]}>Add New Employee</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>

      {/* Search */}
      <View style={[s.searchBar, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Search size={18} color="#9CA3AF" />
        <TextInput
          placeholder="Search employees..."
          placeholderTextColor="#9CA3AF"
          value={search}
          onChangeText={setSearch}
          style={[s.searchInput, { color: colors.ink }]}
        />
        {search ? (
          <TouchableOpacity onPress={() => setSearch('')}>
            <X size={16} color="#9CA3AF" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Table */}
      <ScrollView horizontal showsHorizontalScrollIndicator bounces={false} style={s.tableOuter}>
        <View>
          {/* Header */}
          <View style={[s.thead, { backgroundColor: colors.background }]}>
            {HEADERS.map((h, i) => (
              <View key={i} style={[s.th, { width: COL_WIDTHS[i] }]}>
                <Text style={[s.thText, { textAlign: isRTL ? 'right' : 'left' }]}>{h}</Text>
              </View>
            ))}
          </View>

          {/* Body */}
          <FlatList
            data={currentRows}
            keyExtractor={item => item._id}
            renderItem={({ item, index }) => renderRow(item, index)}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => loadEmployees(1, true)} />
            }
            ListEmptyComponent={
              <View style={s.emptyState}>
                <Text style={[s.emptyTitle, { color: colors.ink, textAlign: isRTL ? 'right' : 'left' }]}>No employees found</Text>
                <Text style={[s.emptySub, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
                  {search ? 'Try changing your search' : 'Start by adding a new employee'}
                </Text>
              </View>
            }
            style={s.tableBody}
          />
        </View>
      </ScrollView>

      {/* Pagination */}
      <View style={[s.pagination, { borderTopColor: colors.border }]}>
        <View style={s.pagLeft}>
          <Text style={[s.pagInfo, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>
            Page {page} of {totalPages}
          </Text>
        </View>
        <View style={s.pagCenter}>
          <TouchableOpacity onPress={() => setPage(1)} disabled={page <= 1} style={s.pagBtn}>
            <ChevronLeft size={16} color={page <= 1 ? '#D1D5DB' : '#374151'} />
          </TouchableOpacity>
          {Array.from({ length: totalPages }).map((_, i) => {
            if (totalPages > 5 && Math.abs(page - (i + 1)) > 1 && i !== 0 && i !== totalPages - 1) {
              if (i === 1 || i === totalPages - 2) return <Text key={i} style={[s.pagDots, { textAlign: isRTL ? 'right' : 'left' }]}>...</Text>;
              return null;
            }
            return (
              <TouchableOpacity
                key={i}
                onPress={() => setPage(i + 1)}
                style={[s.pagNum, page === i + 1 && { backgroundColor: colors.primary }]}
              >
                <Text style={[s.pagNumText, { textAlign: isRTL ? 'right' : 'left' }, page === i + 1 && { color: '#FFF' }]}>{i + 1}</Text>
              </TouchableOpacity>
            );
          })}
          <TouchableOpacity onPress={() => setPage(totalPages)} disabled={page >= totalPages} style={s.pagBtn}>
            <ChevronRight size={16} color={page >= totalPages ? '#D1D5DB' : '#374151'} />
          </TouchableOpacity>
        </View>
        <View style={s.pagRight}>
          <View style={[s.rowsPerPage, { borderColor: colors.border }]}>
            <Text style={[s.rowsPerPageText, { color: colors.textMuted, textAlign: isRTL ? 'right' : 'left' }]}>{rowsPerPage}/page</Text>
          </View>
        </View>
      </View>

      {/* Modals */}
      <CreateEmployeeModal visible={showCreate} onClose={() => setShowCreate(false)} onSuccess={() => loadEmployees(1, true)} />
      <EditEmployeeModal visible={showEdit} onClose={() => { setShowEdit(false); setSelectedEmp(null); }} onSuccess={() => loadEmployees(1, true)} employeeData={selectedEmp} />
      <InviteEmployeeModal visible={showInvite} onClose={() => setShowInvite(false)} />
      <SendNotificationModal visible={showNotify} onClose={() => setShowNotify(false)} />
      <AssignDepartmentModal visible={showAssign} onClose={() => { setShowAssign(false); setSelectedEmp(null); }} onSuccess={() => loadEmployees(1, true)} initialEmployee={selectedEmp} />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1 },
  loadingState: { flex: 1, justifyContent: 'center', padding: spacing.xl },
  toolbar: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
    borderBottomWidth: 1, flexWrap: 'wrap', gap: spacing.sm,
  },
  toolbarLeft: {},
  toolbarTitle: { fontSize: font.sizes.xl, fontWeight: font.weights.bold },
  toolbarRight: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
  toolBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: radii.lg,
  },
  notifyBtn: { backgroundColor: '#EEF2FF' },
  notifyBtnText: { color: '#375DFB', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  inviteBtn: { borderWidth: 1, borderColor: '#E5E7EB' },
  inviteBtnText: { color: '#374151', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  addBtn: { backgroundColor: '#375DFB' },
  addBtnText: { color: '#FFF', fontSize: font.sizes.sm, fontWeight: font.weights.medium },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', margin: spacing.md,
    paddingHorizontal: spacing.md, borderRadius: radii.lg, borderWidth: 1, height: 40,
  },
  searchInput: { flex: 1, fontSize: font.sizes.sm, marginLeft: spacing.sm },
  tableOuter: { flex: 1 },
  thead: {
    flexDirection: 'row', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm,
    borderBottomWidth: 1, borderBottomColor: '#E5E7EB',
  },
  th: { paddingHorizontal: spacing.sm },
  thText: { fontSize: font.sizes.xs, fontWeight: font.weights.semibold, color: '#6B7280' },
  tableBody: { flex: 1 },
  tr: {
    flexDirection: 'row', paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm, borderBottomWidth: 1,
  },
  td: {
    paddingHorizontal: spacing.sm, justifyContent: 'center',
  },
  contactEmail: { fontSize: font.sizes.sm, fontWeight: font.weights.medium, color: '#111827' },
  contactPhone: { fontSize: font.sizes.xs, color: '#6B7280', marginTop: 1 },
  deptName: { fontSize: font.sizes.sm, fontWeight: font.weights.semibold, color: '#111827' },
  deptLocation: { fontSize: 10, color: '#9CA3AF', marginTop: 1 },
  salaryAmount: { fontSize: font.sizes.sm, fontWeight: font.weights.bold, color: '#375DFB' },
  salaryHours: { fontSize: 10, color: '#9CA3AF' },
  noRating: { fontSize: 10, color: '#9CA3AF', fontStyle: 'italic' },
  regRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  regCol: { gap: 2 },
  regComplete: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, color: '#059669' },
  regRegistered: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, color: '#3B82F6' },
  regPending: { fontSize: font.sizes.xs, fontWeight: font.weights.medium, color: '#D97706' },
  copyLink: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  copyLinkText: { fontSize: 10, color: '#375DFB', textDecorationLine: 'underline' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 99 },
  statusText: { fontSize: font.sizes.xs, fontWeight: font.weights.medium },
  emptyState: { padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontSize: font.sizes.lg, fontWeight: font.weights.semibold, marginBottom: spacing.xs },
  emptySub: { fontSize: font.sizes.sm, textAlign: 'center' },
  pagination: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderTopWidth: 1,
  },
  pagLeft: {},
  pagInfo: { fontSize: font.sizes.xs },
  pagCenter: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pagBtn: { padding: 4 },
  pagDots: { color: '#9CA3AF', fontSize: font.sizes.sm },
  pagNum: { width: 28, height: 28, borderRadius: 8, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#E5E7EB' },
  pagNumText: { fontSize: font.sizes.sm, color: '#374151', fontWeight: font.weights.medium },
  pagRight: {},
  rowsPerPage: { borderWidth: 1, borderRadius: radii.lg, paddingHorizontal: spacing.sm, paddingVertical: 4 },
  rowsPerPageText: { fontSize: font.sizes.xs },
});

// Keep a flat styles for simpler cases
const ss = StyleSheet.create({});
