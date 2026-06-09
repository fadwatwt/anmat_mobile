import { http } from '../lib/http';
import {
  ApiResponse,
  AdminAnalytics,
  AnalyticsOverview,
  TaskStatistics,
  DepartmentRating,
  DashboardProject,
  ActivityLogItem,
  EmployeeDashboardTask,
  SubscriptionBasic,
  IndustryCount,
} from '../types';

// ===== Admin =====

export async function fetchAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await http.get<ApiResponse<AdminAnalytics>>('/api/admin/analytics');
  return response.data.data;
}

export async function fetchAdminSubscriptions(page = 1, limit = 10): Promise<{ data: SubscriptionBasic[]; total: number }> {
  const response = await http.get<ApiResponse<{ data: SubscriptionBasic[]; total: number }>>(
    `/api/subscriptions/admin/basic-details?page=${page}&limit=${limit}`
  );
  return response.data.data;
}

export async function fetchIndustriesOrganizationsCount(): Promise<IndustryCount[]> {
  const response = await http.get<ApiResponse<IndustryCount[]>>('/api/admin/industries/organizations-count');
  return response.data.data;
}

export async function fetchAdminOrganizations(industry_id?: string): Promise<any[]> {
  const params = industry_id ? `?industry_id=${industry_id}` : '';
  const response = await http.get<ApiResponse<any[]>>(`/api/admin/organizations${params}`);
  return response.data.data;
}

// ===== Subscriber =====

export async function fetchSubscriberAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await http.get<ApiResponse<AnalyticsOverview>>('/api/subscriber/organization/analytics');
  return response.data.data;
}

export async function fetchSubscriberTaskStats(): Promise<TaskStatistics> {
  const response = await http.get<ApiResponse<TaskStatistics>>('/api/subscriber/organization/tasks/statistics/status');
  return response.data.data;
}

export async function fetchSubscriberDepartments(): Promise<DepartmentRating[]> {
  const response = await http.get<ApiResponse<DepartmentRating[]>>('/api/subscriber/organization/departments');
  return response.data.data;
}

export async function fetchSubscriberProjects(page = 1, limit = 10): Promise<{ data: DashboardProject[]; total: number }> {
  const response = await http.get<ApiResponse<{ data: DashboardProject[]; total: number }>>(
    `/api/subscriber/organization/projects?page=${page}&limit=${limit}`
  );
  return response.data.data;
}

export async function fetchOrganizationLogs(limit = 10): Promise<ActivityLogItem[]> {
  const response = await http.get<ApiResponse<ActivityLogItem[]>>(`/api/activity-logs/my-organization?limit=${limit}`);
  return response.data.data;
}

// ===== Employee =====

export async function fetchEmployeeAnalyticsOverview(): Promise<AnalyticsOverview> {
  const response = await http.get<ApiResponse<AnalyticsOverview>>('/api/employee/analytics');
  return response.data.data;
}

export async function fetchEmployeeTaskStats(): Promise<TaskStatistics> {
  const response = await http.get<ApiResponse<TaskStatistics>>('/api/employee/tasks/statistics/status');
  return response.data.data;
}

export async function fetchEmployeeTasks(page = 1, limit = 10): Promise<{ data: EmployeeDashboardTask[]; total: number }> {
  const response = await http.get<ApiResponse<{ data: EmployeeDashboardTask[]; total: number }>>(
    `/api/employee/tasks?page=${page}&limit=${limit}`
  );
  return response.data.data;
}

export async function fetchEmployeeLogs(limit = 10): Promise<ActivityLogItem[]> {
  const response = await http.get<ApiResponse<ActivityLogItem[]>>(`/api/activity-logs/my-employee-scope?limit=${limit}`);
  return response.data.data;
}
