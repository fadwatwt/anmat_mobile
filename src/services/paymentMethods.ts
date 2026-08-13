import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type PaymentAttribute = { key: string; value: string };

export type PaymentMethod = {
  _id: string;
  type?: string;
  is_default?: boolean;
  is_active?: boolean;
  attributes?: PaymentAttribute[];
  stripe_pm_id?: string;
  created_at?: string;
  updated_at?: string;
};

export function paymentMethodAttr(pm: PaymentMethod | null | undefined, key: string): string {
  return pm?.attributes?.find(a => a.key === key)?.value || '';
}

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const response = await http.get<ApiResponse<PaymentMethod[]> | PaymentMethod[]>('/api/subscriber/payment-methods/');
  const data = (response.data as ApiResponse<PaymentMethod[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export type CreatePaymentMethodPayload = {
  type: string;
  is_default?: boolean;
  is_active?: boolean;
  attributes: PaymentAttribute[];
};

export async function createPaymentMethod(payload: CreatePaymentMethodPayload): Promise<PaymentMethod> {
  const response = await http.post<ApiResponse<PaymentMethod>>('/api/subscriber/payment-methods/', payload);
  return (response.data as ApiResponse<PaymentMethod>).data ?? response.data;
}

export async function updatePaymentMethod(id: string, attributes: PaymentAttribute[]): Promise<PaymentMethod> {
  const response = await http.patch<ApiResponse<PaymentMethod>>(`/api/subscriber/payment-methods/${id}`, { attributes });
  return (response.data as ApiResponse<PaymentMethod>).data ?? response.data;
}

export async function setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
  const response = await http.patch<ApiResponse<PaymentMethod>>(`/api/subscriber/payment-methods/${id}/default`, {});
  return (response.data as ApiResponse<PaymentMethod>).data ?? response.data;
}

export async function deletePaymentMethod(id: string): Promise<void> {
  await http.delete(`/api/subscriber/payment-methods/${id}`);
}
