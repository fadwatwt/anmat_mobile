import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type ExportPayload = {
  module: string;
  format: 'csv' | 'excel' | 'pdf';
  filters?: Record<string, string>;
  ids?: string[];
};

export async function exportData(payload: ExportPayload): Promise<Blob> {
  const res = await http.post<Blob>('/api/subscriber/organization/export', payload, {
    responseType: 'blob',
  });
  return res.data;
}
