import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type Project = {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  start_date?: string;
  startDate?: string;
  due_date?: string;
  endDate?: string;
  department_id?: { name: string; _id: string };
  department?: { name: string; _id: string };
  assignees_ids?: string[];
  assignees?: { name: string; image?: string; _id: string }[];
  manager_id?: string;
  manager?: { _id: string; name: string; email?: string; avatar?: string };
  overall_rating?: number;
  created_at?: string;
  updated_at?: string;
};

export type Department = {
  _id: string;
  name: string;
  rate?: number;
};

export type ActivityLog = {
  _id: string;
  action?: string;
  description?: string;
  createdAt?: string;
  user?: { name: string; image?: string };
};

export async function fetchProjects() {
  const response = await http.get<ApiResponse<Project[]>>('/api/subscriber/organization/projects');
  return response.data.data;
}

export async function fetchProjectDetails(id: string): Promise<Project> {
  const response = await http.get<ApiResponse<Project>>(`/api/subscriber/organization/projects/${id}`);
  return response.data.data ?? (response.data as any);
}

export type CreateProjectPayload = {
  name?: string;
  description?: string;
  manager_id?: string;
  department_id?: string;
  assignees_ids?: string[];
  start_date?: string;
  due_date?: string;
  started_in?: string;
  finished_in?: string;
  progress?: number;
  status?: string;
};

export async function createProject(payload: CreateProjectPayload): Promise<Project> {
  const response = await http.post<ApiResponse<Project>>('/api/subscriber/organization/projects', payload);
  return response.data.data ?? (response.data as any);
}

export async function updateProject(id: string, payload: Partial<CreateProjectPayload>): Promise<Project> {
  const response = await http.patch<ApiResponse<Project>>(`/api/subscriber/organization/projects/${id}`, payload);
  return response.data.data ?? (response.data as any);
}

export async function deleteProject(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/projects/${id}`);
}

export async function fetchDepartments() {
  const response = await http.get<ApiResponse<Department[]>>('/api/subscriber/organization/departments');
  return response.data.data;
}

export async function fetchActivityLogs(limit = 10) {
  const response = await http.get<ApiResponse<ActivityLog[]>>('/api/activity-logs/my-organization', { params: { limit } });
  return response.data.data;
}

// ===== Employee "My Projects" (web: employeeProjectsApi, api/employee/projects) =====
export async function fetchMyProjects(): Promise<Project[]> {
  const response = await http.get<ApiResponse<Project[]> | Project[]>('/api/employee/projects');
  const data = (response.data as ApiResponse<Project[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}
