import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Matches the web `employeeLeavesApi` (api/employee/leaves).
// These are short (hourly) leaves: a date plus start_time / end_time.
export type LeaveRow = {
  _id: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  createdAt?: string;
};

export async function fetchMyLeaves(): Promise<LeaveRow[]> {
  const response = await http.get<ApiResponse<LeaveRow[]>>('/api/employee/leaves');
  return response.data.data ?? [];
}
