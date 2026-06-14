import { http } from '../lib/http';
import { ApiResponse, AttendanceRecord, LeaveRecord, SalaryTransaction, Department, Position, EmployeeItem } from '../types';

// ─── Types that match the REAL subscriber/organization API shapes ─────────────
export type OrgAttendance = {
  _id: string;
  employee_id?: string;
  employee?: { _id?: string; name?: string; email?: string };
  date?: string;
  start_time?: string;
  end_time?: string;
  late_in_minutes?: number;
  comment?: string;
  createdAt?: string;
};

export type OrgLeave = {
  _id: string;
  employee_id?: string;
  employee?: { _id?: string; name?: string; email?: string };
  date?: string;
  start_time?: string;
  end_time?: string;
  createdAt?: string;
};

export type OrgSalaryTransaction = {
  _id: string;
  employee_id?: string;
  employee?: { _id?: string; name?: string; email?: string };
  amount?: number;
  bonus?: number;
  discount?: number;
  comment?: string;
  createdAt?: string;
};

export type CreateAttendancePayload = {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
  late_in_minutes?: number;
};

export type CreateOrgLeavePayload = {
  employee_id: string;
  date: string;
  start_time: string;
  end_time: string;
};

export type CreateSalaryPayload = {
  employee_id: string;
  amount: number;
  bonus?: number;
  discount?: number;
  comment?: string;
};
// ─────────────────────────────────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  employee_id?: string;
  department_id?: string;
  date_from?: string;
  date_to?: string;
  month?: string;
  year?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

// ===== OrgAttendances (real API) =====
export async function fetchOrgAttendances(params: ListParams = {}): Promise<{ data: OrgAttendance[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: OrgAttendance[]; total: number } | OrgAttendance[]>>(
    `/api/subscriber/organization/attendances?${qs}`
  );
  const d = res.data.data as any;
  if (Array.isArray(d)) return { data: d, total: d.length };
  return { data: d?.data ?? [], total: d?.total ?? 0 };
}

export async function createOrgAttendance(payload: CreateAttendancePayload): Promise<OrgAttendance> {
  const res = await http.post<ApiResponse<OrgAttendance>>('/api/subscriber/organization/attendances', payload);
  return res.data.data;
}

export async function updateOrgAttendance(id: string, payload: Partial<CreateAttendancePayload>): Promise<OrgAttendance> {
  const res = await http.patch<ApiResponse<OrgAttendance>>(`/api/subscriber/organization/attendances/${id}`, payload);
  return res.data.data;
}

export async function deleteOrgAttendance(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/attendances/${id}`);
}

// ===== OrgLeaves / Short Leaves (real API) =====
export async function fetchOrgLeaves(params: ListParams = {}): Promise<{ data: OrgLeave[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: OrgLeave[]; total: number } | OrgLeave[]>>(
    `/api/subscriber/organization/leaves?${qs}`
  );
  const d = res.data.data as any;
  if (Array.isArray(d)) return { data: d, total: d.length };
  return { data: d?.data ?? [], total: d?.total ?? 0 };
}

export async function createOrgLeave(payload: CreateOrgLeavePayload): Promise<OrgLeave> {
  const res = await http.post<ApiResponse<OrgLeave>>('/api/subscriber/organization/leaves', payload);
  return res.data.data;
}

export async function deleteOrgLeave(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/leaves/${id}`);
}

// ===== OrgSalaryTransactions (real API) =====
export async function fetchOrgSalaryTransactions(params: ListParams = {}): Promise<{ data: OrgSalaryTransaction[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: OrgSalaryTransaction[]; total: number } | OrgSalaryTransaction[]>>(
    `/api/subscriber/organization/employees-salary-transactions?${qs}`
  );
  const d = res.data.data as any;
  if (Array.isArray(d)) return { data: d, total: d.length };
  return { data: d?.data ?? [], total: d?.total ?? 0 };
}

export async function createOrgSalaryTransaction(payload: CreateSalaryPayload): Promise<OrgSalaryTransaction> {
  const res = await http.post<ApiResponse<OrgSalaryTransaction>>(
    '/api/subscriber/organization/employees-salary-transactions', payload
  );
  return res.data.data;
}

export async function deleteOrgSalaryTransaction(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/employees-salary-transactions/${id}`);
}

// ===== Attendances (legacy — kept for backward compat) =====
export async function fetchAttendances(params: ListParams = {}): Promise<PaginatedResponse<AttendanceRecord>> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await http.get<ApiResponse<PaginatedResponse<AttendanceRecord>>>(
    `/api/subscriber/organization/attendances?${queryParams.toString()}`
  );
  return response.data.data;
}

export async function createAttendance(data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
  const response = await http.post<ApiResponse<AttendanceRecord>>(
    '/api/subscriber/organization/attendances',
    data
  );
  return response.data.data;
}

export async function updateAttendance(id: string, data: Partial<AttendanceRecord>): Promise<AttendanceRecord> {
  const response = await http.patch<ApiResponse<AttendanceRecord>>(
    `/api/subscriber/organization/attendances/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteAttendance(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/attendances/${id}`);
}

// ===== Leaves =====
export async function fetchLeaves(params: ListParams = {}): Promise<PaginatedResponse<LeaveRecord>> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await http.get<ApiResponse<PaginatedResponse<LeaveRecord>>>(
    `/api/subscriber/organization/leaves?${queryParams.toString()}`
  );
  return response.data.data;
}

export async function createLeave(data: Partial<LeaveRecord>): Promise<LeaveRecord> {
  const response = await http.post<ApiResponse<LeaveRecord>>(
    '/api/subscriber/organization/leaves',
    data
  );
  return response.data.data;
}

export async function updateLeave(id: string, data: Partial<LeaveRecord>): Promise<LeaveRecord> {
  const response = await http.patch<ApiResponse<LeaveRecord>>(
    `/api/subscriber/organization/leaves/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteLeave(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/leaves/${id}`);
}

// ===== Salary Transactions =====
export async function fetchSalaryTransactions(params: ListParams = {}): Promise<PaginatedResponse<SalaryTransaction>> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await http.get<ApiResponse<PaginatedResponse<SalaryTransaction>>>(
    `/api/subscriber/organization/employees-salary-transactions?${queryParams.toString()}`
  );
  return response.data.data;
}

export async function createSalaryTransaction(data: Partial<SalaryTransaction>): Promise<SalaryTransaction> {
  const response = await http.post<ApiResponse<SalaryTransaction>>(
    '/api/subscriber/organization/employees-salary-transactions',
    data
  );
  return response.data.data;
}

export async function deleteSalaryTransaction(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/employees-salary-transactions/${id}`);
}

// ===== Departments =====
export async function fetchDepartments(): Promise<Department[]> {
  const response = await http.get<ApiResponse<Department[]>>(
    '/api/subscriber/organization/departments'
  );
  return response.data.data;
}

export async function createDepartment(data: Partial<Department>): Promise<Department> {
  const response = await http.post<ApiResponse<Department>>(
    '/api/subscriber/organization/departments',
    data
  );
  return response.data.data;
}

export async function updateDepartment(id: string, data: Partial<Department>): Promise<Department> {
  const response = await http.put<ApiResponse<Department>>(
    `/api/subscriber/organization/departments/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/departments/${id}`);
}

export async function assignEmployeesToDepartment(departmentId: string, employeeIds: string[]): Promise<void> {
  await http.patch(`/api/subscriber/organization/departments/${departmentId}/employees`, { employeeIds });
}

export async function unassignEmployeesFromDepartment(departmentId: string, employeeIds: string[]): Promise<void> {
  await http.patch(`/api/subscriber/organization/departments/${departmentId}/employees/unassign`, { employeeIds });
}

// ===== Positions =====
export async function fetchPositions(): Promise<Position[]> {
  const response = await http.get<ApiResponse<Position[]>>(
    '/api/subscriber/organization/positions'
  );
  return response.data.data;
}

export async function createPosition(data: Partial<Position>): Promise<Position> {
  const response = await http.post<ApiResponse<Position>>(
    '/api/subscriber/organization/positions',
    data
  );
  return response.data.data;
}

export async function updatePosition(id: string, data: Partial<Position>): Promise<Position> {
  const response = await http.patch<ApiResponse<Position>>(
    `/api/subscriber/organization/positions/${id}`,
    data
  );
  return response.data.data;
}

export async function deletePosition(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/positions/${id}`);
}

// ===== Subscriber Notifications =====
export interface NotificationType {
  _id: string;
  name: string;
  description?: string;
}

export interface SendNotificationData {
  type_id: string;
  recipient_type: 'employee' | 'department' | 'all';
  recipient_ids?: string[];
  title: string;
  message: string;
  priority?: 'low' | 'medium' | 'high';
}

export async function fetchNotificationTypes(): Promise<NotificationType[]> {
  const response = await http.get<ApiResponse<NotificationType[]>>(
    '/api/subscriber-notifications/types'
  );
  return response.data.data;
}

export async function sendNotification(data: SendNotificationData): Promise<void> {
  await http.post('/api/subscriber-notifications/send', data);
}

export async function fetchSentNotifications(params: { page?: number; limit?: number } = {}): Promise<PaginatedResponse<any>> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value != null) {
      queryParams.append(key, String(value));
    }
  });

  const response = await http.get<ApiResponse<PaginatedResponse<any>>>(
    `/api/subscriber-notifications/sent?${queryParams.toString()}`
  );
  return response.data.data;
}