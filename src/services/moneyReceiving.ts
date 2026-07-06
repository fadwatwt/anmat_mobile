import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type MoneyReceivingMethod = {
  _id: string;
  name: string;
  type: 'bank' | 'wallet' | 'cash' | 'other';
  details?: string;
  is_active?: boolean;
  createdAt?: string;
};

export async function fetchMoneyReceivingMethods(): Promise<MoneyReceivingMethod[]> {
  const res = await http.get<ApiResponse<MoneyReceivingMethod[]>>('/api/admin/money-receiving-methods');
  return res.data.data;
}
