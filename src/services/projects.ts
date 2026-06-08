import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type Project = {
  _id: string;
  name?: string;
  title?: string;
  description?: string;
  status?: string;
  progress?: number;
  startDate?: string;
  due_date?: string;
  endDate?: string;
  department_id?: { name: string; _id: string };
  assignees?: { name: string; image?: string; _id: string }[];
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

export async function fetchDepartments() {
  const response = await http.get<ApiResponse<Department[]>>('/api/subscriber/organization/departments');
  return response.data.data;
}

export async function fetchActivityLogs(limit = 10) {
  const response = await http.get<ApiResponse<ActivityLog[]>>('/api/activity-logs/my-organization', { params: { limit } });
  return response.data.data;
}
