import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Matches the web `aiApi` escalation endpoints (api/escalation/...).
export type EscalationRequest = {
  _id: string;
  requester_name?: string;
  requester_email?: string;
  requester?: { name?: string; email?: string };
  message?: string;
  chat_id?: string;
  created_at?: string;
  status?: string;
};

export async function fetchPendingEscalations(): Promise<EscalationRequest[]> {
  const response = await http.get<ApiResponse<EscalationRequest[]>>('/api/escalation/pending');
  return response.data.data ?? [];
}

export async function approveEscalation(id: string): Promise<{ chat_id?: string }> {
  const response = await http.post<ApiResponse<{ chat_id?: string }>>(`/api/escalation/${id}/approve`);
  const body = response.data?.data ?? response.data ?? {};
  return typeof body === 'object' ? body : {};
}

export async function rejectEscalation(id: string): Promise<void> {
  await http.post(`/api/escalation/${id}/reject`);
}
