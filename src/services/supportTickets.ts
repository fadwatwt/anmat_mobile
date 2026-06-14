import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type SupportTicket = {
  _id: string;
  title?: string;
  description?: string;
  status?: string;
  priority?: string;
  created_by?: { _id: string; name: string; email?: string };
  assigned_to?: { _id: string; name: string };
  messages?: { text: string; user: string; createdAt: string }[];
  createdAt?: string;
  updatedAt?: string;
};

export async function fetchSupportTickets(): Promise<SupportTicket[]> {
  const response = await http.get<ApiResponse<SupportTicket[]>>('/api/support-tickets');
  return response.data.data;
}

export async function fetchSupportTicketById(id: string): Promise<SupportTicket> {
  const response = await http.get<ApiResponse<SupportTicket>>(`/api/support-tickets/${id}`);
  return response.data.data;
}

export type CreateTicketPayload = {
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
};

export async function createSupportTicket(data: CreateTicketPayload): Promise<SupportTicket> {
  const response = await http.post<ApiResponse<SupportTicket>>('/api/support-tickets', data);
  return response.data.data;
}

export async function updateSupportTicketStatus(id: string, status: string): Promise<void> {
  await http.patch(`/api/support-tickets/${id}`, { status });
}
