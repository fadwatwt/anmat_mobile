import { http } from '../lib/http';

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

export async function createIndustry(data: IndustryPayload): Promise<void> {
  await http.post('/api/admin/industries', data);
}

export async function updateIndustry(id: string, data: IndustryPayload): Promise<void> {
  await http.patch(`/api/admin/industries/${id}`, data);
}

export async function deleteIndustry(id: string): Promise<void> {
  await http.delete(`/api/admin/industries/${id}`);
}
