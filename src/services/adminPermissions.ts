import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type AdminPermission = {
  _id: string;
  name: string;
  key: string;
  description?: string;
  module?: string;
  createdAt?: string;
};

export async function fetchAdminPermissions(): Promise<AdminPermission[]> {
  const res = await http.get<ApiResponse<AdminPermission[]>>('/api/admin/permissions');
  return res.data.data;
}
