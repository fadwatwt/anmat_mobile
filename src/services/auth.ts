import axios from 'axios';

import { http } from '../lib/http';
import { ApiResponse, LoginData } from '../types';

export async function loginWithEmail(email: string, password: string) {
  try {
    const response = await http.post<ApiResponse<LoginData>>('/api/user/auth/login', {
      email,
      password,
    });
    return response.data.data;
  } catch (error) {
    // Handle "Already logged in" — backend returns the existing token in error data
    if (axios.isAxiosError(error) && error.response?.status === 400) {
      const body = error.response.data as {
        message?: string;
        data?: { access_token?: string };
      };
      if (body?.message === 'Already logged in' && body?.data?.access_token) {
        // Re-fetch user with the existing token
        const token = body.data.access_token;
        const userRes = await http.get<ApiResponse<any>>('/api/user/auth', {
          headers: { Authorization: `Bearer ${token}` },
        });
        return { access_token: token, user: userRes.data.data };
      }
    }
    throw error;
  }
}
