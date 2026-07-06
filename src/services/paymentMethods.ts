import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type PaymentMethod = {
  _id: string;
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'stripe';
  is_default?: boolean;
  last_four?: string;
  exp_month?: number;
  exp_year?: number;
  cardholder_name?: string;
  billing_address?: string;
  stripe_payment_method_id?: string;
  createdAt?: string;
};

export type CreatePaymentMethodPayload = {
  type: 'credit_card' | 'debit_card' | 'paypal' | 'bank_transfer' | 'stripe';
  stripe_payment_method_id?: string;
  last_four?: string;
  cardholder_name?: string;
  billing_address?: string;
};

export async function fetchPaymentMethods(): Promise<PaymentMethod[]> {
  const res = await http.get<ApiResponse<PaymentMethod[]>>('/api/subscriber/payment-methods/');
  return res.data.data;
}

export async function createPaymentMethod(payload: CreatePaymentMethodPayload): Promise<PaymentMethod> {
  const res = await http.post<ApiResponse<PaymentMethod>>('/api/subscriber/payment-methods/', payload);
  return res.data.data;
}

export async function setDefaultPaymentMethod(id: string): Promise<PaymentMethod> {
  const res = await http.patch<ApiResponse<PaymentMethod>>(`/api/subscriber/payment-methods/${id}/default`);
  return res.data.data;
}

export async function updatePaymentMethod(id: string, payload: Partial<CreatePaymentMethodPayload>): Promise<PaymentMethod> {
  const res = await http.patch<ApiResponse<PaymentMethod>>(`/api/subscriber/payment-methods/${id}`, payload);
  return res.data.data;
}
