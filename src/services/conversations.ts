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
  is_group?: boolean;
  participants?: ChatUser[];
  last_message?: ChatMessage;
  unread_count?: number;
  is_archived?: boolean;
  created_at?: string;
};

/** Raw shape returned by the backend (different field names). */
type RawChat = {
  _id: string;
  title?: string;
  is_group?: boolean;
  participants_ids?: ChatUser[];
  lastMessage?: ChatMessage;
  last_message?: ChatMessage;
  unreadCount?: number;
  unread_count?: number;
  is_archived?: boolean;
  created_at?: string;
};

/** Map the backend's raw chat into the shape the UI expects. */
function normalizeChat(raw: RawChat, currentUserId?: string): ChatItem {
  const participants = Array.isArray(raw.participants_ids) ? raw.participants_ids : [];
  // For 1:1 chats, the displayed party is the participant who isn't the current user.
  const others = currentUserId
    ? participants.filter((p) => p?._id !== currentUserId)
    : participants;
  return {
    _id: raw._id,
    title: raw.title,
    is_group: raw.is_group,
    type: raw.is_group ? 'group' : 'direct',
    participants: others.length > 0 ? others : participants,
    last_message: raw.lastMessage ?? raw.last_message,
    unread_count: raw.unreadCount ?? raw.unread_count ?? 0,
    is_archived: raw.is_archived,
    created_at: raw.created_at,
  };
}

export async function fetchChats(currentUserId?: string): Promise<ChatItem[]> {
  const response = await http.get<ApiResponse<RawChat[]>>('/api/chats');
  const list = response.data.data || [];
  return list.map((c) => normalizeChat(c, currentUserId));
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

export async function archiveChat(chatId: string, isArchived = true): Promise<void> {
  await http.patch(`/api/chats/${chatId}/archive`, { is_archived: isArchived });
}
