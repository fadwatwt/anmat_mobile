import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type Organization = {
  _id: string;
  name: string;
  email?: string;
  website?: string;
  logo?: string;
  industry?: { _id: string; name: string };
  subscribers_count?: number;
  employees_count?: number;
  status?: string;
  createdAt?: string;
};

export type CreateOrganizationPayload = {
  name: string;
  email?: string;
  website?: string;
  logo?: string;
  industry_id?: string;
};

export type OrganizationListParams = {
  page?: number;
  limit?: number;
  industry_id?: string;
};

export async function fetchMyOrganization(): Promise<Organization> {
  const res = await http.get<ApiResponse<Organization>>('/api/subscriber/organization');
  return res.data.data;
}

export async function createOrganization(payload: CreateOrganizationPayload): Promise<Organization> {
  const res = await http.post<ApiResponse<Organization>>('/api/subscriber/organizations', payload);
  return res.data.data;
}

export async function updateOrganization(payload: Partial<CreateOrganizationPayload>): Promise<Organization> {
  const res = await http.put<ApiResponse<Organization>>('/api/subscriber/organization', payload);
  return res.data.data;
}

export async function fetchAllOrganizations(params: OrganizationListParams = {}): Promise<{ data: Organization[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: Organization[]; total: number }>>(`/api/admin/organizations?${qs}`);
  return res.data.data;
}
