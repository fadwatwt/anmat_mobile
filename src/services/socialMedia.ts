import axios from 'axios';
import { http, getAuthToken } from '../lib/http';
import { EXTERNAL_API_URL, REQUEST_TIMEOUT } from '../config/api';
import { ApiResponse } from '../types';

// External tweetAPI client — shares the anmat JWT but lives on a different origin.
const tweetHttp = axios.create({ baseURL: EXTERNAL_API_URL, timeout: REQUEST_TIMEOUT });
tweetHttp.interceptors.request.use((config) => {
  const token = getAuthToken();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export type SocialMediaQuota = {
  used: number;
  limit: number;
  unlimited: boolean;
};

export type TwitterAccount = {
  _id: string;
  name: string;
  AccountStatus?: string;
  Description?: string;
  location?: string;
  Category?: { _id?: string; name?: string };
  AccountBasicInfo?: { Location?: string; SecretKey?: string };
  AccountDataInfo1?: { FullName?: string; Followers?: number };
};

export type AccountCategory = {
  _id: string;
  name: string;
  parent?: { _id?: string; name?: string } | null;
  accountCount?: number;
};

export type CreateTwitterAccountPayload = {
  name: string;
  password: string;
  email?: string;
  phone?: string;
  location?: string;
  Category: string;
  Description?: string;
  SecretKey?: string;
};

export type UpdateTwitterAccountPayload = {
  name?: string;
  location?: string;
  Category?: string;
  description?: string;
  SecretKey?: string;
};

export async function fetchSocialMediaQuota(): Promise<SocialMediaQuota> {
  const res = await http.get<ApiResponse<SocialMediaQuota>>('/api/subscriber/social-media-quota');
  const d = res.data.data || ({} as SocialMediaQuota);
  return { used: d.used ?? 0, limit: d.limit ?? 0, unlimited: !!d.unlimited };
}

export async function fetchTwitterAccounts(params: { page?: number; limit?: number; Category?: string } = {}): Promise<TwitterAccount[]> {
  const search = new URLSearchParams();
  if (params.page) search.append('page', String(params.page));
  if (params.limit) search.append('limit', String(params.limit));
  if (params.Category) search.append('Category', params.Category);
  const qs = search.toString();
  const res = await tweetHttp.get<{ data?: TwitterAccount[] }>(`/accounts/tweet${qs ? `?${qs}` : ''}`);
  return res.data?.data || [];
}

export async function createTwitterAccount(payload: CreateTwitterAccountPayload): Promise<void> {
  await tweetHttp.post('/accounts/tweet', payload);
}

export async function updateTwitterAccount(id: string, payload: UpdateTwitterAccountPayload): Promise<void> {
  await tweetHttp.put(`/accounts/${id}`, payload);
}

export async function deleteTwitterAccount(id: string): Promise<void> {
  await tweetHttp.delete(`/accounts/${id}`);
}

// ===== Account categories (external tweetAPI) =====
export async function fetchAccountCategories(): Promise<AccountCategory[]> {
  const res = await tweetHttp.get<AccountCategory[] | { data?: AccountCategory[] }>('/accountcategories');
  const data = Array.isArray(res.data) ? res.data : res.data?.data;
  return data || [];
}

export async function createAccountCategory(name: string, parent?: string): Promise<void> {
  await tweetHttp.post('/accountcategories', parent ? { name, parent } : { name });
}

export async function updateAccountCategory(id: string, name: string, parent?: string | null): Promise<void> {
  const payload: { name: string; parent?: string | null } = { name };
  if (parent !== undefined) payload.parent = parent;
  await tweetHttp.put(`/accountcategories/${id}`, payload);
}

export async function deleteAccountCategory(id: string): Promise<void> {
  await tweetHttp.delete(`/accountcategories/${id}`);
}
