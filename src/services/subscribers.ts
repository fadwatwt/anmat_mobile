import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type Subscriber = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  organization?: { name: string; website?: string; email?: string; logo?: string };
  createdAt?: string;
};

export async function fetchSubscribers(): Promise<Subscriber[]> {
  const response = await http.get<ApiResponse<Subscriber[]>>('/api/admin/subscribers');
  return response.data.data;
}

export async function fetchSubscriberById(id: string): Promise<Subscriber> {
  const response = await http.get<ApiResponse<Subscriber>>(`/api/admin/subscribers/${id}`);
  return response.data.data;
}

export async function toggleSubscriberActivation(id: string): Promise<void> {
  await http.patch(`/api/admin/subscribers/${id}/toggle-activation`);
}
