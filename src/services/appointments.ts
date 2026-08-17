import { http } from '../lib/http';
import { ApiResponse, UserType } from '../types';

export type Appointment = {
  _id: string;
  title: string;
  description?: string;
  location?: string;
  date?: string;
  start_time?: string;
  end_time?: string;
  category?: string;
  color?: string;
  is_all_day?: boolean;
  enable_reminders?: boolean;
  reminder_types?: string[];
  recurrence_type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'upcoming' | 'completed' | 'cancelled';
  countdownDays?: number;
  notes?: string;
  attendee_list?: { _id: string; name: string; imageProfile?: string }[];
  task?: { _id: string; title: string; status?: string; priority?: string };
  user?: { _id: string; name: string; imageProfile?: string };
  task_id?: string;
  is_personal?: boolean;
  created_at?: string;
};

export type DailyTask = {
  _id: string;
  title: string;
  description?: string;
  date?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  category?: string;
  status?: 'pending' | 'in_progress' | 'completed';
  notes?: string;
  is_personal?: boolean;
};

export type AppointmentFilters = { status?: string; category?: string };

/** Base path differs by role: subscribers use organization scope, employees use their own. */
function base(role: UserType | undefined) {
  return role === 'Employee' ? 'api/employee' : 'api/subscriber/organization';
}

// ===== Appointments =====

export async function fetchAppointments(role: UserType | undefined, filters: AppointmentFilters = {}): Promise<Appointment[]> {
  const params = new URLSearchParams();
  if (filters.status) params.set('status', filters.status);
  if (filters.category) params.set('category', filters.category);
  const qs = params.toString();
  const res = await http.get<ApiResponse<Appointment[]>>(`/${base(role)}/appointments${qs ? `?${qs}` : ''}`);
  return res.data.data || [];
}

export async function fetchAppointmentDetails(role: UserType | undefined, id: string): Promise<Appointment> {
  const res = await http.get<ApiResponse<Appointment>>(`/${base(role)}/appointments/${id}`);
  return res.data.data;
}

export async function searchAppointments(role: UserType | undefined, search: string): Promise<Appointment[]> {
  const res = await http.get<ApiResponse<Appointment[]>>(`/${base(role)}/appointments/search?q=${encodeURIComponent(search)}`);
  return res.data.data || [];
}

export async function fetchTodayAppointments(role: UserType | undefined): Promise<Appointment[]> {
  // Employees don't expose a dedicated "today" route; filter their list client-side.
  if (role === 'Employee') {
    const today = new Date().toISOString().slice(0, 10);
    const all = await fetchAppointments(role);
    return all.filter((a) => (a.date || '').slice(0, 10) === today);
  }
  const res = await http.get<ApiResponse<Appointment[]>>('/api/subscriber/organization/appointments/today');
  return res.data.data || [];
}

export async function fetchMonthAppointments(role: UserType | undefined, year: number, month: number): Promise<Appointment[]> {
  const res = await http.get<ApiResponse<Appointment[]>>(`/${base(role)}/appointments/month/${year}/${month}`);
  return res.data.data || [];
}

export async function createAppointment(role: UserType | undefined, body: Partial<Appointment>): Promise<void> {
  await http.post<ApiResponse<unknown>>(`/${base(role)}/appointments`, body);
}

export async function updateAppointment(role: UserType | undefined, id: string, body: Partial<Appointment>): Promise<void> {
  await http.put<ApiResponse<unknown>>(`/${base(role)}/appointments/${id}`, body);
}

export async function completeAppointment(role: UserType | undefined, id: string): Promise<void> {
  await http.patch<ApiResponse<unknown>>(`/${base(role)}/appointments/${id}/complete`, {});
}

export async function cancelAppointment(role: UserType | undefined, id: string): Promise<void> {
  await http.patch<ApiResponse<unknown>>(`/${base(role)}/appointments/${id}/cancel`, {});
}

export async function deleteAppointment(role: UserType | undefined, id: string): Promise<void> {
  await http.delete<ApiResponse<unknown>>(`/${base(role)}/appointments/${id}`);
}

export async function addAppointmentNotes(role: UserType | undefined, id: string, notes: string): Promise<void> {
  await http.patch<ApiResponse<unknown>>(`/${base(role)}/appointments/${id}/notes`, { notes });
}

// ===== Daily Tasks =====

export async function fetchDailyTasks(role: UserType | undefined, params: { date?: string } = {}): Promise<DailyTask[]> {
  const qs = params.date ? `?date=${params.date}` : '';
  const res = await http.get<ApiResponse<DailyTask[]>>(`/${base(role)}/daily-tasks${qs}`);
  return res.data.data || [];
}

export async function createDailyTask(role: UserType | undefined, body: Partial<DailyTask>): Promise<void> {
  await http.post<ApiResponse<unknown>>(`/${base(role)}/daily-tasks`, body);
}

export async function updateDailyTask(role: UserType | undefined, id: string, body: Partial<DailyTask>): Promise<void> {
  await http.put<ApiResponse<unknown>>(`/${base(role)}/daily-tasks/${id}`, body);
}

export async function completeDailyTask(role: UserType | undefined, id: string): Promise<void> {
  await http.patch<ApiResponse<unknown>>(`/${base(role)}/daily-tasks/${id}/complete`, {});
}

export async function deleteDailyTask(role: UserType | undefined, id: string): Promise<void> {
  await http.delete<ApiResponse<unknown>>(`/${base(role)}/daily-tasks/${id}`);
}
