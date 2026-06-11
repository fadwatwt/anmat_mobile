import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type ChatUser = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
};

export type ChatMessage = {
  _id: string;
  chat_id?: string;
  content?: string;
  sent_by?: string | ChatUser;
  attachment?: { url?: string; name?: string; type?: string; size?: number };
  is_edited?: boolean;
  read_by?: string[];
  reactions?: { emoji: string; users: string[] }[];
  poll?: any;
  created_at?: string;
};

export type ChatItem = {
  _id: string;
  title?: string;
  type?: 'direct' | 'group';
  participants?: ChatUser[];
  last_message?: ChatMessage;
  unread_count?: number;
  is_archived?: boolean;
  created_at?: string;
};

export async function fetchChats(): Promise<ChatItem[]> {
  const response = await http.get<ApiResponse<ChatItem[]>>('/api/chats');
  return response.data.data;
}

export async function createChat(data: { participant_ids: string[]; title?: string }): Promise<ChatItem> {
  const response = await http.post<ApiResponse<ChatItem>>('/api/chats', data);
  return response.data.data;
}

export async function fetchMessages(chatId: string): Promise<ChatMessage[]> {
  const response = await http.get<ApiResponse<ChatMessage[]>>(`/api/chats/${chatId}/messages`);
  return response.data.data;
}

export async function editChatMessage(messageId: string, content: string): Promise<ChatMessage> {
  const response = await http.patch<ApiResponse<ChatMessage>>(`/api/chats/messages/${messageId}`, { content });
  return response.data.data;
}

export async function deleteChatMessage(messageId: string): Promise<void> {
  await http.delete(`/api/chats/messages/${messageId}`);
}

export async function markChatRead(chatId: string): Promise<void> {
  await http.patch(`/api/chats/${chatId}/read`);
}

export async function archiveChat(chatId: string): Promise<void> {
  await http.patch(`/api/chats/${chatId}/archive`);
}
