import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type RolePermission = { _id?: string; name?: string };

export type AppRole = {
  _id: string;
  name: string;
  permissions: RolePermission[];
};

// Admin roles (web: adminRolesAPI) — response is { data: [...] }, perms in admin_permissions_ids.
export async function fetchAdminRoles(): Promise<AppRole[]> {
  const response = await http.get<ApiResponse<any[]>>('/api/admin/roles');
  const list = response.data.data ?? [];
  return list.map((r: any) => ({
    _id: r._id,
    name: r.name,
    permissions: r.admin_permissions_ids || [],
  }));
}

export async function createAdminRole(name: string, permissionIds: string[]): Promise<void> {
  await http.post('/api/admin/roles', { name, admin_permissions_ids: permissionIds });
}

export async function syncAdminRolePermissions(id: string, permissionIds: string[]): Promise<void> {
  await http.patch(`/api/admin/roles/${id}/permissions/sync`, { admin_permissions_ids: permissionIds });
}

export async function deleteAdminRole(id: string): Promise<void> {
  await http.delete(`/api/admin/roles/${id}`);
}

// Subscriber roles (web: subscriberRolesApi) — response is array, perms in permissions_ids.
export async function fetchSubscriberRoles(): Promise<AppRole[]> {
  const response = await http.get<ApiResponse<any[]> | any[]>('/api/subscriber/organization/roles');
  const list = (response.data as ApiResponse<any[]>).data ?? response.data;
  const arr = Array.isArray(list) ? list : [];
  return arr.map((r: any) => ({
    _id: r._id,
    name: r.name,
    permissions: r.permissions_ids || [],
  }));
}

export async function createSubscriberRole(name: string, permissionIds: string[]): Promise<void> {
  await http.post('/api/subscriber/organization/roles', { name, permissions_ids: permissionIds });
}

export async function syncSubscriberRolePermissions(id: string, permissionIds: string[]): Promise<void> {
  await http.patch(`/api/subscriber/organization/roles/${id}/permissions/sync`, { permissions_ids: permissionIds });
}

export async function deleteSubscriberRole(id: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/roles/${id}`);
}

// Unified helpers (branch on isAdmin) for use in RoleModal/RolesScreen.
export function createRole(isAdmin: boolean, name: string, permissionIds: string[]): Promise<void> {
  return isAdmin ? createAdminRole(name, permissionIds) : createSubscriberRole(name, permissionIds);
}

export function syncRolePermissions(isAdmin: boolean, id: string, permissionIds: string[]): Promise<void> {
  return isAdmin
    ? syncAdminRolePermissions(id, permissionIds)
    : syncSubscriberRolePermissions(id, permissionIds);
}
