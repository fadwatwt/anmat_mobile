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
  balance?: number;       // paid tokens (ai_tokens_balance)
  free_limit?: number;
  free_consumed?: number;
  is_unlimited?: boolean;
};

export type TokenPackage = {
  _id: string;
  name?: string;
  description?: string;
  tokens?: number;
  price?: number;
  price_cents?: number;
  price_label?: string;
  features?: string[];
  is_active?: boolean;
  sort_order?: number;
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
  const response = await http.get<ApiResponse<{ conversation: any; messages: AIMessage[] }>>(`/api/ai/conversations/${id}/messages`);
  const body = response.data.data ?? response.data;
  // API returns { conversation, messages } — extract messages array
  return Array.isArray(body) ? body : (body?.messages ?? []);
}

export async function sendMessage(data: { message: string; conversation_id?: string; attachments?: string[]; model?: string }): Promise<{ message: AIMessage; conversation_id: string }> {
  const response = await http.post<ApiResponse<{ assistant_message: AIMessage; conversation_id: string }>>('/api/ai/chat', data);
  const body = response.data.data || response.data;
  return {
    message: body.assistant_message,
    conversation_id: body.conversation_id,
  };
}

export async function renameConversation(id: string, title: string): Promise<void> {
  await http.patch(`/api/ai/conversations/${id}`, { title });
}

export async function deleteConversation(id: string): Promise<void> {
  await http.delete(`/api/ai/conversations/${id}`);
}
