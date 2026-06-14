import { http } from '../lib/http';
import { ApiResponse, TaskItem } from '../types';

export async function fetchTasks(): Promise<TaskItem[]> {
  const response = await http.get<ApiResponse<TaskItem[]>>('/api/subscriber/organization/tasks');
  return response.data.data;
}

export async function fetchTaskById(id: string): Promise<TaskItem> {
  const response = await http.get<ApiResponse<TaskItem>>(`/api/subscriber/organization/tasks/${id}`);
  return response.data.data;
}

export async function createTask(data: Partial<TaskItem>): Promise<TaskItem> {
  const response = await http.post<ApiResponse<TaskItem>>('/api/subscriber/organization/tasks', data);
  return response.data.data;
}

export async function updateTask(id: string, data: Partial<TaskItem>): Promise<TaskItem> {
  const response = await http.put<ApiResponse<TaskItem>>(`/api/subscriber/organization/tasks/${id}`, data);
  return response.data.data;
}

export async function deleteTask(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/tasks/${id}`);
}

export async function completeTask(id: string) {
  return updateTask(id, { status: 'completed' });
}

// ===== Employee "My Tasks" (web: employeeTasksApi, api/employee/tasks) =====
export async function fetchMyTasks(): Promise<TaskItem[]> {
  const response = await http.get<ApiResponse<TaskItem[]> | TaskItem[]>('/api/employee/tasks');
  const data = (response.data as ApiResponse<TaskItem[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function updateMyTaskStatus(id: string, status: string): Promise<void> {
  await http.put(`/api/employee/tasks/${id}/status-update`, { status });
}
