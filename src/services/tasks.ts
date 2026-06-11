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
