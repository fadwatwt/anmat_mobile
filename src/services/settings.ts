import { http } from '../lib/http';
import { ApiResponse } from '../types';

// ===== User Preferences =====
export type UserPreferences = {
  notifications?: {
    newsUpdates?: boolean;
    remindersEvents?: boolean;
    leaveAttendance?: boolean;
    deadlineNotification?: boolean;
  };
  notification_methods?: {
    email?: boolean;
    push?: boolean;
  };
  min_tasks?: number;
};

export async function fetchUserPreferences(): Promise<UserPreferences> {
  const res = await http.get<ApiResponse<UserPreferences>>('/api/user/settings/preferences');
  return res.data.data ?? {};
}

export async function updateUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  await http.patch('/api/user/settings/preferences', prefs);
}

// ===== Attendance Settings =====
export type AttendanceSettings = {
  minutes_before_warning?: number;
  daily_working_hours?: number;
};

export async function fetchAttendanceSettings(): Promise<AttendanceSettings> {
  const res = await http.get<ApiResponse<AttendanceSettings>>('/api/admin/settings/attendance');
  return res.data.data ?? {};
}

export async function updateAttendanceSettings(data: AttendanceSettings): Promise<void> {
  await http.patch('/api/admin/settings/attendance', data);
}

// ===== Chat Settings =====
export type ChatSettings = {
  retention_days?: number;
  max_file_size_bytes?: number;
  auto_create_project_chat?: boolean;
};

export async function fetchChatSettings(): Promise<ChatSettings> {
  const res = await http.get<ApiResponse<ChatSettings>>('/api/chats/settings');
  return res.data.data ?? {};
}

export async function updateChatSettings(data: ChatSettings): Promise<void> {
  await http.patch('/api/chats/settings', data);
}

// ===== Organization Settings (used by regional preferences & rating) =====
export type OrganizationSettings = {
  timezone?: string;
  time_format?: string;
  date_format?: string;
  is_points_system_active?: boolean;
  default_evaluation_method?: string;
  rating_types?: string[];
};

export async function fetchOrganizationSettings(): Promise<OrganizationSettings> {
  const res = await http.get<ApiResponse<OrganizationSettings>>('/api/subscriber/organization');
  return res.data.data ?? {};
}

export async function updateOrganizationSettings(data: Partial<OrganizationSettings>): Promise<void> {
  await http.put('/api/subscriber/organization', data);
}

// ===== AI Free Tokens Limit (Admin only) =====
export async function fetchFreeTokensLimit(): Promise<{ limit: number }> {
  const res = await http.get<ApiResponse<{ limit: number }>>('/api/admin/settings/free-tokens');
  return res.data.data ?? { limit: 5000 };
}

export async function updateFreeTokensLimit(limit: number): Promise<void> {
  await http.patch('/api/admin/settings/free-tokens', { limit });
}
