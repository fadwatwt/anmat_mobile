import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type Rotation = {
  _id: string;
  employee: { _id: string; name: string; avatar?: string };
  date: string;
  shift_type: 'MORNING' | 'AFTERNOON' | 'NIGHT';
  start_time: string;
  end_time: string;
  createdAt?: string;
};

export type RotationListParams = {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  department_id?: string;
  employee_id?: string;
  monthly?: string;
  weekly?: string;
};

export async function fetchRotations(params: RotationListParams = {}): Promise<{ data: Rotation[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: Rotation[]; total: number }>>(`/api/rotation?${qs}`);
  return res.data.data;
}

export async function fetchEmployeeRotation(employeeId: string): Promise<Rotation[]> {
  const res = await http.get<ApiResponse<Rotation[]>>(`/api/subscriber/organization/employees/${employeeId}/rotation`);
  return res.data.data;
}

export async function fetchRotationsWithFilters(filters: RotationListParams): Promise<{ data: Rotation[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(filters).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.post<ApiResponse<{ data: Rotation[]; total: number }>>(`/api/subscriber/organization/attendances/rotations?${qs}`, {});
  return res.data.data;
}
