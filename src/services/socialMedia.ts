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
  Category?: { name?: string };
  AccountDataInfo1?: { FullName?: string; Followers?: number };
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

export async function deleteTwitterAccount(id: string): Promise<void> {
  await tweetHttp.delete(`/accounts/${id}`);
}
