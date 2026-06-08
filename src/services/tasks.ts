import { http } from '../lib/http';
import { ApiResponse, TaskItem } from '../types';

export async function fetchTasks() {
  const response = await http.get<ApiResponse<TaskItem[]> | TaskItem[]>('/tasks');
  return Array.isArray(response.data) ? response.data : response.data.data;
}

export async function completeTask(id: string) {
  const response = await http.put(`/tasks/${id}/complete`);
  return response.data;
}
