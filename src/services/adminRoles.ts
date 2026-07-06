import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type AdminRole = {
  _id: string;
  name: string;
  description?: string;
  permissions?: string[];
  created_by?: string;
  createdAt?: string;
};

export type CreateAdminRolePayload = {
  name: string;
  description?: string;
  permissions?: string[];
};

export async function fetchAdminRoles(): Promise<AdminRole[]> {
  const res = await http.get<ApiResponse<AdminRole[]>>('/api/admin/roles');
  return res.data.data;
}

export async function createAdminRole(payload: CreateAdminRolePayload): Promise<AdminRole> {
  const res = await http.post<ApiResponse<AdminRole>>('/api/admin/roles', payload);
  return res.data.data;
}

export async function deleteAdminRole(roleId: string): Promise<void> {
  await http.delete(`/api/admin/roles/${roleId}`);
}

export async function syncAdminRolePermissions(roleId: string, permissions: string[]): Promise<AdminRole> {
  const res = await http.patch<ApiResponse<AdminRole>>(`/api/admin/roles/${roleId}/permissions/sync`, { permissions });
  return res.data.data;
}
