import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type SystemAdmin = {
  _id: string;
  name?: string;
  email?: string;
  role?: string;
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
