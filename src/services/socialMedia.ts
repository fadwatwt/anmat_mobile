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

// ===== External file part (multipart) =====
export type LocalFile = { uri: string; name: string; type: string };

export type ImportResult = { insertedCount?: number; failed?: number };

export type TweetAccountCheckResult = {
  user: string;
  status: boolean;
  message?: string;
};

async function postForm(url: string, formData: FormData): Promise<void> {
  await tweetHttp.post(url, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
}

export async function importTwitterAccounts(file: LocalFile, category: string): Promise<ImportResult> {
  const formData = new FormData();
  formData.append('csvFile', file as unknown as Blob);
  formData.append('Category', category);
  const res = await tweetHttp.post<ImportResult>('/accounts/import/tweet', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data || {};
}

export async function checkTwitterAccounts(accounts: string[], userAgent: string): Promise<TweetAccountCheckResult[]> {
  const res = await tweetHttp.post<{ data?: TweetAccountCheckResult[] }>('/accounts/check', {
    accounts: accounts.map((name) => ({ name })),
    userAgent,
  });
  return res.data?.data || [];
}

export async function postTweetSingle(account: string, text: string, images: LocalFile[]): Promise<void> {
  const formData = new FormData();
  formData.append('account', account);
  formData.append('tweet', text);
  images.forEach((img) => formData.append('images', img as unknown as Blob));
  await postForm('/methods/tweet', formData);
}

export async function likeTweet(accounts: string[], url: string): Promise<void> {
  await tweetHttp.post('/methods/like', { accounts, url });
}

export async function unlikeTweet(accounts: string[], url: string): Promise<void> {
  await tweetHttp.post('/methods/like/delete', { accounts, url });
}

export async function followAccounts(accounts: string[], follow: string[]): Promise<void> {
  await tweetHttp.post('/methods/follow', { accounts, follow });
}

export async function unfollowAccounts(accounts: string[], follow: string[]): Promise<void> {
  await tweetHttp.post('/methods/follow/delete', { accounts, follow });
}

export async function replyToTweet(accounts: string[], url: string, txtFile: LocalFile): Promise<void> {
  const formData = new FormData();
  formData.append('txtFile', txtFile as unknown as Blob);
  accounts.forEach((acc) => formData.append('accounts', acc));
  formData.append('url', url);
  await postForm('/methods/reply', formData);
}
