import { http } from '../lib/http';
import i18n from '../i18n';
import { ApiResponse } from '../types';

// Admin industries CRUD (web: industriesApi, api/admin/industries).
export type Industry = {
  _id: string;
  name: string;
  icon_name?: string;
  is_allowed?: boolean;
  organizations_count?: number;
};

export type IndustryPayload = {
  name: string;
  icon_name?: string;
  is_allowed?: boolean;
};

export async function fetchIndustries(): Promise<Industry[]> {
  const lang = (i18n.language || 'en').split('-')[0];
  const res = await http.get<ApiResponse<Industry[]> | Industry[]>('/api/admin/industries', { params: { locale: lang } });
  const data = (res.data as ApiResponse<Industry[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function fetchSubscriberIndustries(): Promise<Industry[]> {
  const lang = (i18n.language || 'en').split('-')[0];
  const res = await http.get<ApiResponse<Industry[]> | Industry[]>('/api/subscriber/industries', { params: { locale: lang } });
  const data = (res.data as ApiResponse<Industry[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function createIndustry(data: IndustryPayload): Promise<void> {
  await http.post('/api/admin/industries', data);
}

export async function updateIndustry(id: string, data: IndustryPayload): Promise<void> {
  await http.patch(`/api/admin/industries/${id}`, data);
}

export async function deleteIndustry(id: string): Promise<void> {
  await http.delete(`/api/admin/industries/${id}`);
}
