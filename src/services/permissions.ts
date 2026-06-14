import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Subscriber permissions (web: subscriberPermissionsApi). Admins use api/admin/permissions.
// Admin perms expose `details`; subscriber perms expose `title`/`action`/`model_type`.
export type Permission = {
  _id: string;
  name: string;
  title?: string;
  details?: string;
  action?: string;
  model_type?: string;
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchPermissions(isAdmin: boolean): Promise<Permission[]> {
  const url = isAdmin ? '/api/admin/permissions' : '/api/subscriber/permissions';
  const response = await http.get<ApiResponse<Permission[]> | Permission[]>(url);
  const data = (response.data as ApiResponse<Permission[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

// Display label helper — subscriber perms prefer title, admin perms use name.
export function permissionLabel(p: Permission): string {
  return p.title || p.name || '--';
}
