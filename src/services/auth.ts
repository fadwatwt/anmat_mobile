import axios from 'axios';

import { http } from '../lib/http';
import { ApiResponse, LoginData } from '../types';

// BACKEND CONTRACT ISSUE: the server returns an existing access_token inside a
// 400 "Already logged in" error body. Tokens must never travel in error bodies
// (they leak into logs/crash reports). The backend should return 200 with the
// session instead. Kept here for backward compatibility with hardening:
// 1) the recovered token is NEVER trusted blindly — it is validated via an
//    authenticated /api/user/auth call before use;
// 2) the recovered user email must match the login email (prevents accepting a
//    stale/different-account session);
// 3) never log the token.
async function recoverAlreadyLoggedIn(error: unknown, expectedEmail: string): Promise<LoginData | null> {
  if (axios.isAxiosError(error) && error.response?.status === 400) {
    const body = error.response.data as {
      message?: string;
      data?: { access_token?: string };
    };
    if (body?.message === 'Already logged in' && body?.data?.access_token) {
      const token = body.data.access_token;
      try {
        const userRes = await http.get<ApiResponse<LoginData['user']>>('/api/user/auth', {
          headers: { Authorization: `Bearer ${token}` },
        });
        const user = userRes.data.data;
        if (!user) return null;
        // Guard against session fixation / wrong-account recovery.
        const recoveredEmail = String((user as { email?: string }).email || '').toLowerCase().trim();
        if (recoveredEmail && recoveredEmail !== expectedEmail.toLowerCase().trim()) {
          return null;
        }
        return { access_token: token, user };
      } catch {
        return null;
      }
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
    const recovered = await recoverAlreadyLoggedIn(error, email);
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
    const recovered = await recoverAlreadyLoggedIn(error, email);
    if (recovered) return recovered;
    throw error;
  }
}
