import { http } from '../lib/http';
import { ApiResponse, User } from '../types';

export type EmployeeDetail = {
  date_of_birth?: string;
  city?: string;
  country?: string;
  department?: { name?: string };
  position?: { name?: string };
  salary?: number;
  work_hours?: number;
  yearly_day_offs?: number;
  weekend_days?: string[];
  overall_rating?: number;
  ratings?: Array<{ details?: string; created_at?: string; score?: number; comment?: string }>;
};

export type ProfileUser = User & {
  phone?: string;
  is_active?: boolean;
  imageProfile?: string;
  employee_detail?: EmployeeDetail;
  organization?: { name?: string; website?: string; email?: string; logo?: string };
};

export async function fetchMe(): Promise<ProfileUser> {
  const res = await http.get<ApiResponse<ProfileUser>>('/api/user/auth');
  return res.data.data;
}

export type UpdateProfilePayload = {
  name?: string;
  phone?: string;
  email?: string;
};

/** Updates basic account info. Admin and regular users use different paths. */
export async function updateProfile(payload: UpdateProfilePayload, isAdmin: boolean): Promise<void> {
  const url = isAdmin ? '/api/admin/account' : '/api/user/account';
  await http.put<ApiResponse<unknown>>(url, payload);
}

/** Employee-specific detail update (department/salary fields handled server-side). */
export async function updateEmployeeDetail(payload: Record<string, unknown>): Promise<void> {
  await http.put<ApiResponse<unknown>>('/api/employee/details', payload);
}

export type ChangePasswordPayload = {
  old_password: string;
  new_password: string;
  new_password_confirmation: string;
};

export async function changePassword(payload: ChangePasswordPayload, isAdmin: boolean): Promise<void> {
  const url = isAdmin ? '/api/admin/account/update-password' : '/api/user/account/update-password';
  await http.put<ApiResponse<unknown>>(url, payload);
}
