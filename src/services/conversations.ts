import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type ChatUser = {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  type?: string;
};

export type ChatPollOption = {
  _id?: string;
  text: string;
  votes: (string | { _id?: string; name?: string })[];
};

export type ChatPoll = {
  _id: string;
  question: string;
  options: ChatPollOption[];
  allow_multiple_choice?: boolean;
  closes_at?: string | null;
  is_closed?: boolean;
  created_by?: string | { _id?: string; name?: string };
};

export type ChatMessage = {
  _id: string;
  chat_id?: string;
  content?: string;
  sent_by?: string | ChatUser;
  attachment?: string | { url?: string; name?: string; type?: string; size?: number };
  is_edited?: boolean;
  read_by?: string[];
  reactions?: { emoji: string; user?: string | ChatUser }[];
  poll?: ChatPoll;
  message_type?: string;
  thread_count?: number;
  parent_message_id?: string;
  created_at?: string;
};

export type ChatCandidate = {
  _id: string;
  name: string;
  avatar?: string;
  department_id?: string | null;
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
  model_type?: string;
  model_id?: string;
  image?: string;
  group_details?: { admins?: (string | ChatUser)[] };
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
  model_type?: string;
  model_id?: string;
  image?: string;
  group_details?: { admins?: (string | ChatUser)[] };
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
    model_type: raw.model_type,
    model_id: raw.model_id,
    image: raw.image,
    group_details: raw.group_details,
  };
}

export async function fetchChats(currentUserId?: string, isArchived?: boolean): Promise<ChatItem[]> {
  const response = await http.get<ApiResponse<RawChat[]>>('/api/chats', {
    params: isArchived === undefined ? undefined : { is_archived: isArchived },
  });
  const list = response.data.data || [];
  return list.map((c) => normalizeChat(c, currentUserId));
}

export type CreateChatPayload = {
  participants_ids: string[];
  title?: string;
  is_group?: boolean;
  model_type?: string;
  model_id?: string;
  description?: string;
};

export async function createChat(data: CreateChatPayload): Promise<ChatItem> {
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
  // Background read-receipt: don't show the global processing overlay.
  await http.patch(`/api/chats/${chatId}/read`, undefined, { silent: true } as any);
}

export async function archiveChat(chatId: string, isArchived = true): Promise<void> {
  await http.patch(`/api/chats/${chatId}/archive`, { is_archived: isArchived });
}

export type ChatPermission = {
  _id: string;
  name: string;
  description?: string;
};

export async function fetchChatPermissions(): Promise<ChatPermission[]> {
  const response = await http.get<ApiResponse<ChatPermission[]>>('/api/chats/permissions');
  return response.data.data;
}

export type ChatPollPayload = {
  question: string;
  options: string[];
  closes_at?: string;
  allow_multiple_choice?: boolean;
};

export async function createPoll(chatId: string, payload: ChatPollPayload): Promise<ChatPoll> {
  const response = await http.post<ApiResponse<ChatPoll>>(`/api/chats/${chatId}/polls`, payload);
  return response.data.data;
}

export async function fetchPolls(chatId: string): Promise<ChatPoll[]> {
  const response = await http.get<ApiResponse<ChatPoll[]>>(`/api/chats/${chatId}/polls`);
  return response.data.data;
}

export async function votePoll(pollId: string, optionIds: string[]): Promise<ChatPoll> {
  const response = await http.post<ApiResponse<ChatPoll>>(`/api/chats/polls/${pollId}/vote`, { option_ids: optionIds });
  return response.data.data;
}

export async function closePoll(pollId: string): Promise<ChatPoll> {
  const response = await http.patch<ApiResponse<ChatPoll>>(`/api/chats/polls/${pollId}/close`);
  return response.data.data;
}

export async function addChatParticipants(chatId: string, participantIds: string[]): Promise<ChatItem> {
  const response = await http.post<ApiResponse<ChatItem>>(`/api/chats/${chatId}/participants`, { participantIds });
  return response.data.data;
}

export async function removeChatParticipant(chatId: string, userId: string): Promise<void> {
  await http.delete(`/api/chats/${chatId}/participants/${userId}`);
}

export async function fetchChatCandidates(): Promise<ChatCandidate[]> {
  const response = await http.get<ApiResponse<ChatCandidate[]>>('/api/chats/candidates');
  return response.data.data || [];
}

export type UploadedFile = { url: string; name?: string };

export async function uploadChatFile(
  chatId: string,
  file: { uri: string; name: string; type: string },
): Promise<UploadedFile> {
  const form = new FormData();
  form.append('file', { uri: file.uri, name: file.name, type: file.type } as any);
  const response = await http.post<ApiResponse<UploadedFile>>(`/api/chats/${chatId}/upload`, form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    silent: true,
  } as any);
  return response.data.data || {};
}

export async function addReaction(messageId: string, emoji: string): Promise<ChatMessage> {
  const response = await http.post<ApiResponse<ChatMessage>>(`/api/chats/messages/${messageId}/reactions`, { emoji });
  return response.data.data;
}

export async function removeReaction(messageId: string, emoji: string): Promise<ChatMessage> {
  const response = await http.delete<ApiResponse<ChatMessage>>(`/api/chats/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  return response.data.data;
}

export async function fetchThreadReplies(messageId: string): Promise<ChatMessage[]> {
  const response = await http.get<ApiResponse<ChatMessage[]>>(`/api/chats/messages/${messageId}/replies`);
  return response.data.data || [];
}

export async function createThreadReply(messageId: string, content: string): Promise<ChatMessage> {
  const response = await http.post<ApiResponse<ChatMessage>>(`/api/chats/messages/${messageId}/replies`, { content });
  return response.data.data;
}

export async function searchChatMessages(chatId: string, q: string): Promise<ChatMessage[]> {
  const response = await http.get<ApiResponse<any>>(`/api/chats/${chatId}/messages/search`, { params: { q } });
  const data = response.data.data;
  if (Array.isArray(data)) return data;
  return (data?.data || []) as ChatMessage[];
}
