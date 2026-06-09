import { http } from '../lib/http';
import { ApiResponse, EmployeeItem, EmployeeDetailItem, Department, Position, EmployeeRequest, InvitationData, NotificationType } from '../types';

export interface EmployeesListParams {
  page?: number;
  limit?: number;
  search?: string;
  department?: string;
  status?: string;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export async function fetchEmployees(params: EmployeesListParams = {}): Promise<EmployeeDetailItem[]> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await http.get<ApiResponse<EmployeeDetailItem[]>>(
    `/api/subscriber/organization/employees?${queryParams.toString()}`
  );
  return response.data.data;
}

export async function fetchEmployeeProfile(id: string): Promise<EmployeeDetailItem> {
  const response = await http.get<ApiResponse<EmployeeDetailItem>>(
    `/api/subscriber/organization/employees/${id}`
  );
  return response.data.data;
}

export interface WebCreateEmployeePayload {
  email: string;
  name: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  employee_detail?: {
    department_id?: string | null;
    position_id?: string | null;
    country?: string;
    city?: string;
    work_hours?: number;
    salary?: number;
    yearly_day_offs?: number;
    weekend_days?: string[];
    date_of_birth?: string;
    roles_ids?: string[];
    shift_type?: string;
    shift_start_time?: string;
    shift_end_time?: string;
    storage_quota?: number | null;
  };
}

export async function createEmployee(data: WebCreateEmployeePayload): Promise<EmployeeDetailItem> {
  const response = await http.post<ApiResponse<EmployeeDetailItem>>(
    '/api/subscriber/organization/employees',
    data
  );
  return response.data.data;
}

export interface WebUpdateEmployeePayload {
  id: string;
  name?: string;
  phone?: string;
  employee_details?: {
    department_id?: string | null;
    position_id?: string | null;
    country?: string;
    city?: string;
    work_hours?: number;
    salary?: number;
    yearly_day_offs?: number;
    weekend_days?: string[];
    date_of_birth?: string;
    roles_ids?: string[];
    shift_type?: string;
    shift_start_time?: string;
    shift_end_time?: string;
    storage_quota?: number | null;
  };
}

export async function updateEmployee(payload: WebUpdateEmployeePayload): Promise<EmployeeDetailItem> {
  const { id, ...data } = payload;
  const response = await http.put<ApiResponse<EmployeeDetailItem>>(
    `/api/subscriber/organization/employees/${id}`,
    data
  );
  return response.data.data;
}

export async function deleteEmployee(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/employees/${id}`);
}

export async function toggleEmployeeActivity(id: string): Promise<EmployeeDetailItem> {
  const response = await http.put<ApiResponse<EmployeeDetailItem>>(
    `/api/subscriber/organization/employees/${id}/toggle-activity`,
    {}
  );
  return response.data.data;
}

export async function inviteEmployee(email: string): Promise<InvitationData> {
  const response = await http.post<ApiResponse<InvitationData>>(
    '/api/subscriber/employee-invitations',
    { email }
  );
  return response.data.data;
}

export async function assignEmployeesToDepartment(department_id: string, employeeIds: string[]): Promise<void> {
  await http.put('/api/subscriber/organization/employees/assign-department', {
    department_id,
    employeeIds,
  });
}

export async function unassignEmployeesFromDepartment(department_id: string, employeeIds: string[]): Promise<void> {
  await http.put('/api/subscriber/organization/employees/unassign-department', {
    department_id,
    employeeIds,
  });
}

export async function sendNotification(data: {
  notification_type_id: string;
  title: string;
  message: string;
  target: 'all_employees' | 'specific_employees' | 'department';
  department_id?: string;
  employee_ids?: string[];
}): Promise<void> {
  await http.post('/api/subscriber/notifications/send', data);
}

export async function fetchNotificationTypes(): Promise<NotificationType[]> {
  const response = await http.get<ApiResponse<NotificationType[]>>(
    '/api/subscriber/notification-types'
  );
  return response.data.data;
}

export async function fetchDepartments(): Promise<Department[]> {
  const response = await http.get<ApiResponse<Department[]>>(
    '/api/subscriber/organization/departments'
  );
  return response.data.data;
}

export async function fetchPositions(): Promise<Position[]> {
  const response = await http.get<ApiResponse<Position[]>>(
    '/api/subscriber/organization/positions'
  );
  return response.data.data;
}

export async function fetchEmployeeRequests(params: {
  page?: number;
  limit?: number;
  status?: string;
  employee_id?: string;
} = {}): Promise<PaginatedResponse<EmployeeRequest>> {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value));
    }
  });

  const response = await http.get<ApiResponse<PaginatedResponse<EmployeeRequest>>>(
    `/api/subscriber/organization/employees-requests?${queryParams.toString()}`
  );
  return response.data.data;
}

export async function updateRequestStatus(id: string, status: 'approved' | 'rejected'): Promise<EmployeeRequest> {
  const response = await http.put<ApiResponse<EmployeeRequest>>(
    `/api/subscriber/organization/employees-requests/${id}/status`,
    { status }
  );
  return response.data.data;
}

export async function deleteRequest(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/employees-requests/${id}`);
}