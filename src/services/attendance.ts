import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Matches the web `employeeAttendanceApi` (api/employee/attendances).
// Records use start_time / end_time (HH:MM) and a yyyy-MM-dd date.
export type AttendanceRow = {
  _id: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
  createdAt?: string;
};

export async function fetchMyAttendances(): Promise<AttendanceRow[]> {
  const response = await http.get<ApiResponse<AttendanceRow[]>>('/api/employee/attendances');
  return response.data.data ?? [];
}

export async function checkIn(start_time: string): Promise<void> {
  await http.post('/api/employee/attendances/check-in', { start_time });
}

export async function checkOut(end_time: string): Promise<void> {
  await http.put('/api/employee/attendances/check-out', { end_time });
}
