import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type KbEntry = {
  _id: string;
  title: string;
  content?: string;
  tags?: string[];
  category?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type KbListResult = {
  data: KbEntry[];
  total: number;
};

export async function fetchKbEntries(params: {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
} = {}): Promise<KbListResult> {
  const { page = 1, limit = 20, search, category } = params;
  const response = await http.get('/api/knowledge-base/entries', {
    params: { page, limit, search: search || undefined, category: category || undefined },
  });
  const body = response.data as any;
  // Web transformResponse returns full response: { data, total, ... }
  // Backend returns { data: [...], total } — handle both shapes.
  if (Array.isArray(body?.data?.data)) {
    return { data: body.data.data, total: body.data.total ?? body.data.data.length };
  }
  if (Array.isArray(body?.data)) {
    return { data: body.data, total: body.total ?? body.data.length };
  }
  return { data: [], total: 0 };
}

export async function createKbEntry(payload: {
  title: string;
  content?: string;
  tags?: string[];
  category?: string;
}): Promise<KbEntry> {
  const response = await http.post<ApiResponse<KbEntry>>('/api/knowledge-base/entries', payload);
  return (response.data as any).data || (response.data as any);
}

export async function updateKbEntry(
  id: string,
  payload: { title?: string; content?: string; tags?: string[]; category?: string },
): Promise<KbEntry> {
  const response = await http.patch<ApiResponse<KbEntry>>(`/api/knowledge-base/entries/${id}`, payload);
  return (response.data as any).data || (response.data as any);
}

export async function deleteKbEntry(id: string): Promise<void> {
  await http.delete(`/api/knowledge-base/entries/${id}`);
}

export async function uploadKbFile(params: {
  title: string;
  category?: string;
  fileUri: string;
  fileName: string;
  mimeType?: string;
}): Promise<KbEntry> {
  const form = new FormData();
  form.append('file', {
    uri: params.fileUri,
    name: params.fileName,
    type: params.mimeType || 'application/octet-stream',
  } as any);
  form.append('title', params.title);
  if (params.category) form.append('category', params.category);
  const response = await http.post('/api/knowledge-base/upload', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  } as any);
  return (response.data as any).data || (response.data as any);
}
