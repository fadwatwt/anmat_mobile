import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Matches the web `employeeAuthRequestsApi` (api/employee/employee-requests).
export type EmployeeAuthRequestType = 'DAY_OFF' | 'SALARY_ADVANCE' | 'WORK_DELAY';

export type EmployeeAuthRequest = {
  _id: string;
  type: EmployeeAuthRequestType;
  status: string; // "open" | "approved" | "rejected" | "cancelled"
  reason?: string;
  comment?: string;
  created_at?: string;
  // DAY_OFF
  vacation_date?: string;
  vacation_end_date?: string;
  // SALARY_ADVANCE
  advance_salary_by?: number | string;
  old_salary_amount?: number | string;
  // WORK_DELAY
  work_due_at?: string;
};

export type CreateRequestPayload = {
  employee_id: string;
  type: EmployeeAuthRequestType;
  reason: string;
  comment?: string;
  work_due_at?: string;
  advance_salary_by?: string;
  old_salary_amount?: string;
  vacation_date?: string;
  vacation_end_date?: string;
};

export async function fetchMyRequests(): Promise<EmployeeAuthRequest[]> {
  const response = await http.get<ApiResponse<EmployeeAuthRequest[]>>(
    '/api/employee/employee-requests',
  );
  return response.data.data ?? [];
}

export async function createRequest(payload: CreateRequestPayload): Promise<void> {
  await http.post('/api/employee/employee-requests', payload);
}

export async function cancelRequest(id: string): Promise<void> {
  await http.put(`/api/employee/employee-requests/${id}/cancel`);
}
