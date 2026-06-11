import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type MoneyMethod = {
  _id: string;
  name?: string;
  type?: string;
  is_active?: boolean;
  instructions?: string;
  createdAt?: string;
};

export async function fetchMoneyMethods(): Promise<MoneyMethod[]> {
  const response = await http.get<ApiResponse<MoneyMethod[]>>('/api/admin/money-receiving-methods');
  return response.data.data;
}
