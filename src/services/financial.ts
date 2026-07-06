import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type SalaryTransaction = {
  _id: string;
  employee: { _id: string; name: string; avatar?: string };
  type: 'salary' | 'bonus' | 'deduction' | 'advance' | 'overtime' | 'allowance';
  amount: number;
  month: string;
  year: number;
  status: 'pending' | 'paid' | 'cancelled';
  description?: string;
  paid_date?: string;
  createdAt?: string;
};

export type CreateSalaryTransactionPayload = {
  employee_id: string;
  type: 'salary' | 'bonus' | 'deduction' | 'advance' | 'overtime' | 'allowance';
  amount: number;
  month: string;
  year: number;
  description?: string;
};

export type SalaryListParams = {
  page?: number;
  limit?: number;
  employee_id?: string;
  month?: string;
  year?: number;
  status?: string;
  type?: string;
};

export async function fetchAllSalaryTransactions(params: SalaryListParams = {}): Promise<{ data: SalaryTransaction[]; total: number }> {
  const qs = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => { if (v != null) qs.append(k, String(v)); });
  const res = await http.get<ApiResponse<{ data: SalaryTransaction[]; total: number }>>(`/api/subscriber/organization/employees-salary-transactions?${qs}`);
  return res.data.data;
}

export async function createSalaryTransaction(payload: CreateSalaryTransactionPayload): Promise<SalaryTransaction> {
  const res = await http.post<ApiResponse<SalaryTransaction>>('/api/subscriber/organization/employees-salary-transactions', payload);
  return res.data.data;
}

export async function deleteSalaryTransaction(transactionId: string): Promise<void> {
  await http.delete(`/api/subscriber/organization/employees-salary-transactions/${transactionId}`);
}
