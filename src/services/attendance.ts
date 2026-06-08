import { http } from '../lib/http';
import { ApiResponse, AttendanceItem } from '../types';

export async function fetchAttendance() {
  const response = await http.get<ApiResponse<AttendanceItem[]> | AttendanceItem[]>(
    '/attendance/all',
  );
  return Array.isArray(response.data) ? response.data : response.data.data;
}

export async function checkIn() {
  const response = await http.post('/checkin');
  return response.data;
}

export async function checkOut() {
  const response = await http.post('/checkout');
  return response.data;
}
