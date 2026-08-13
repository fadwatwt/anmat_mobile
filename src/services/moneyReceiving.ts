import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Matches the web `moneyReceivingApi` (api/admin/money-receiving-methods).
export type MoneyReceivingAttribute = {
  key?: string;
  value?: string;
  is_secret?: boolean;
  is_masked?: boolean;
};

export type MoneyReceivingMethod = {
  _id: string;
  title: string;
  type?: string;
  is_active?: boolean;
  is_default?: boolean;
  sort_order?: number;
  attributes?: MoneyReceivingAttribute[];
  createdAt?: string;
};

export type CreateMoneyReceivingPayload = {
  title: string;
  type: string;
  is_active: boolean;
  is_default: boolean;
  sort_order: number;
  attributes: { key: string; value: string; is_secret?: boolean }[];
};

export const MONEY_RECEIVING_TYPES: { value: string; label: string }[] = [
  { value: 'stripe', label: 'Stripe' },
  { value: 'paypal', label: 'PayPal' },
  { value: 'hyperpay', label: 'HyperPay' },
  { value: 'moyasar', label: 'Moyasar' },
  { value: 'paytabs', label: 'PayTabs' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'wallet', label: 'Wallet' },
  { value: 'other', label: 'Other' },
];

export function getMoneyReceivingTypeLabel(type?: string) {
  const found = MONEY_RECEIVING_TYPES.find((m) => m.value === type);
  return found ? found.label : type || '';
}

export async function fetchMoneyReceivingMethods(): Promise<MoneyReceivingMethod[]> {
  const res = await http.get<ApiResponse<MoneyReceivingMethod[]> | MoneyReceivingMethod[]>('/api/admin/money-receiving-methods');
  const data = (res.data as ApiResponse<MoneyReceivingMethod[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function createMoneyReceivingMethod(payload: CreateMoneyReceivingPayload): Promise<void> {
  await http.post('/api/admin/money-receiving-methods', payload);
}

export async function updateMoneyReceivingMethod(id: string, payload: CreateMoneyReceivingPayload): Promise<void> {
  await http.patch(`/api/admin/money-receiving-methods/${id}`, payload);
}

export async function deleteMoneyReceivingMethod(id: string): Promise<void> {
  await http.delete(`/api/admin/money-receiving-methods/${id}`);
}

export async function toggleMoneyReceivingMethodActiveStatus(id: string): Promise<void> {
  await http.patch(`/api/admin/money-receiving-methods/${id}/toggle-activity`);
}
