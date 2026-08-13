import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Matches the web `employeeLeavesApi` (api/employee/leaves).
// These are short (hourly) leaves: a date plus start_time / end_time.
export type LeaveRow = {
  _id: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  reason?: string;
  status?: 'pending' | 'approved' | 'rejected';
  createdAt?: string;
};

export type CreateLeavePayload = {
  date: string;
  start_time: string;
  end_time: string;
  reason: string;
};

export async function fetchMyLeaves(): Promise<LeaveRow[]> {
  const response = await http.get<ApiResponse<LeaveRow[]>>('/api/employee/leaves');
  return response.data.data ?? [];
}

export async function createMyLeave(payload: CreateLeavePayload): Promise<void> {
  await http.post('/api/employee/leaves', payload);
}

export async function updateMyLeave(id: string, payload: CreateLeavePayload): Promise<void> {
  await http.patch(`/api/employee/leaves/${id}`, payload);
}

export async function deleteMyLeave(id: string): Promise<void> {
  await http.delete(`/api/employee/leaves/${id}`);
}
