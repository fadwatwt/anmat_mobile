import axios from 'axios';

import { API_URL, REQUEST_TIMEOUT } from '../config/api';

let authToken: string | null = null;
let currentLanguage: string = 'en';

export const http = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
});

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  config.headers['Accept-Language'] = currentLanguage;
  return config;
});

export function setAuthToken(token: string | null) {
  authToken = token;
}

export function getAuthToken() {
  return authToken;
}

export function setLanguageHeader(lang: string) {
  currentLanguage = lang;
}

export function extractErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || 'Request failed';
  }

  return 'Something went wrong';
}
