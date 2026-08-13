import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type SystemAdmin = {
  _id: string;
  name?: string;
  email?: string;
  avatar?: string;
  admin_system_roles?: AdminRole[];
  is_active?: boolean;
  createdAt?: string;
};

export type AdminRole = {
  _id: string;
  name: string;
  permissions?: string[];
};

export async function fetchSystemAdmins(): Promise<SystemAdmin[]> {
  const response = await http.get<ApiResponse<SystemAdmin[]>>('/api/admin/admins');
  return response.data.data;
}

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  const response = await http.get<ApiResponse<AdminRole[]>>('/api/admin/roles');
  return response.data.data;
}

export async function assignAdminRole(adminId: string, roleId: string): Promise<void> {
  await http.post('/api/admin/roles/assign', { role_id: roleId, admin_id: adminId });
}

export async function unassignAdminRole(adminId: string, roleId: string): Promise<void> {
  await http.post('/api/admin/roles/unassign', { role_id: roleId, admin_id: adminId });
}

export async function sendAdminNotification(data: {
  target: 'specific_users' | 'all_subscribers' | 'all_admins';
  title: string;
  message: string;
  priority?: 'high' | 'normal' | 'low';
  action_url?: string;
  user_ids?: string[];
}): Promise<{ sent: number }> {
  const response = await http.post<ApiResponse<{ sent: number }>>('/api/notifications/admin/send', data);
  return response.data.data || { sent: 0 };
}

export type CreateAdminPayload = {
  name: string;
  email: string;
  password: string;
  admin_system_roles: string[];
};

export async function createSystemAdmin(data: CreateAdminPayload): Promise<SystemAdmin> {
  const response = await http.post<ApiResponse<SystemAdmin>>('/api/admin/admins', data);
  return response.data.data;
}
