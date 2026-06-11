import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type AIMessage = {
  _id?: string;
  role: 'user' | 'assistant' | 'system';
  content?: string;
  thought?: string;
  attachments?: string[];
  pending_action?: any;
  created_at?: string;
};

export type AIConversation = {
  _id: string;
  title?: string;
  created_at?: string;
  updated_at?: string;
};

export type TokenBalance = {
  free_limit?: number;
  free_consumed?: number;
  paid_balance?: number;
  is_unlimited?: boolean;
};

export type TokenPackage = {
  _id: string;
  name?: string;
  tokens?: number;
  price?: number;
};

export async function fetchTokenBalance(): Promise<TokenBalance> {
  const response = await http.get<ApiResponse<TokenBalance>>('/api/ai/tokens/balance');
  return response.data.data || response.data;
}

export async function fetchTokenPackages(): Promise<TokenPackage[]> {
  const response = await http.get<ApiResponse<TokenPackage[]>>('/api/ai/tokens/packages');
  return response.data.data || response.data;
}

export async function listConversations(): Promise<AIConversation[]> {
  const response = await http.get<ApiResponse<AIConversation[]>>('/api/ai/conversations');
  return response.data.data || response.data;
}

export async function getConversationMessages(id: string): Promise<AIMessage[]> {
  const response = await http.get<ApiResponse<AIMessage[]>>(`/api/ai/conversations/${id}/messages`);
  return response.data.data || response.data;
}

export async function sendMessage(data: { message: string; conversation_id?: string; attachments?: string[]; model?: string }): Promise<{ message: AIMessage; conversation_id: string }> {
  const response = await http.post<ApiResponse<{ message: AIMessage; conversation_id: string }>>('/api/ai/chat', data);
  return response.data.data || response.data;
}

export async function renameConversation(id: string, title: string): Promise<void> {
  await http.patch(`/api/ai/conversations/${id}`, { title });
}

export async function deleteConversation(id: string): Promise<void> {
  await http.delete(`/api/ai/conversations/${id}`);
}
