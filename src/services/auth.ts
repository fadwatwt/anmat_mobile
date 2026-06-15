import axios from 'axios';

import { http } from '../lib/http';
import { ApiResponse, LoginData } from '../types';

// When the backend rejects a login with "Already logged in", it returns the
// existing token in the error body — recover the session by re-fetching the user.
async function recoverAlreadyLoggedIn(error: unknown): Promise<LoginData | null> {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    const body = error.response.data as {
      message?: string;
      data?: { access_token?: string };
    };
    if (body?.message === 'Already logged in' && body?.data?.access_token) {
      const token = body.data.access_token;
      const userRes = await http.get<ApiResponse<LoginData['user']>>('/api/user/auth', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { access_token: token, user: userRes.data.data };
    }
  }
  return null;
}

export async function loginWithEmail(email: string, password: string): Promise<LoginData> {
  try {
    const response = await http.post<ApiResponse<LoginData>>('/api/user/auth/login', {
      email,
      password,
    });
    return response.data.data;
  } catch (error) {
    const recovered = await recoverAlreadyLoggedIn(error);
    if (recovered) return recovered;
    throw error;
  }
}

export async function adminLoginWithEmail(email: string, password: string): Promise<LoginData> {
  try {
    const response = await http.post<ApiResponse<LoginData>>('/api/admin/auth/login', {
      email,
      password,
    });
    return response.data.data;
  } catch (error) {
    const recovered = await recoverAlreadyLoggedIn(error);
    if (recovered) return recovered;
    throw error;
  }
}
