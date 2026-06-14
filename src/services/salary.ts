import { http } from '../lib/http';
import { ApiResponse } from '../types';

// Matches the web `employeeSalariesApi` (api/employee/salary-transactions).
export type SalaryRow = {
  _id: string;
  employee?: { name?: string; email?: string };
  amount?: number;
  bonus?: number;
  discount?: number;
  comment?: string;
  created_at?: string;
};

export async function fetchMySalaryTransactions(): Promise<SalaryRow[]> {
  const response = await http.get<ApiResponse<SalaryRow[]> | SalaryRow[]>(
    '/api/employee/salary-transactions',
  );
  const data = (response.data as ApiResponse<SalaryRow[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}
