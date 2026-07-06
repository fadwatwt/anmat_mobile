import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type ActivityLog = {
  _id: string;
  action: string;
  description?: string;
  type?: string;
  createdAt?: string;
  employee?: { _id: string; name: string; avatar?: string };
  department?: { _id: string; name: string };
  task?: { _id: string; title?: string };
  project?: { _id: string; name?: string };
};

export type ActivityLogsListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function fetchMyOrganizationLogs(params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/my-organization?${qs}`);
  return res.data.data;
}

export async function fetchMyLogs(params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/my-logs?${qs}`);
  return res.data.data;
}

export async function fetchAllLogs(params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs?${qs}`);
  return res.data.data;
}

export async function fetchLogsByDepartment(departmentId: string, params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/department/${departmentId}?${qs}`);
  return res.data.data;
}

export async function fetchLogsByEmployee(employeeId: string, params: ActivityLogsListParams = {}): Promise<{ data: ActivityLog[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: ActivityLog[]; total: number }>>(`/api/activity-logs/employee/${employeeId}?${qs}`);
  return res.data.data;
}
