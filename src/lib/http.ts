import axios from 'axios';

import { API_URL, REQUEST_TIMEOUT } from '../config/api';

let authToken: string | null = null;
let currentLanguage: string = 'en';

// --- Global "is a write request in flight" tracking -------------------------
// Mutating requests (POST/PUT/PATCH/DELETE) increment a counter so a global
// overlay can show "Processing..." automatically, without each screen wiring
// it up. GET requests are excluded (screens show their own list spinners),
// and a request can opt out via `config.silent = true`.
type ProcessingListener = (pending: number) => void;

let pendingMutations = 0;
const processingListeners = new Set<ProcessingListener>();

function emitProcessing() {
  processingListeners.forEach((listener) => listener(pendingMutations));
}

export function subscribeProcessing(listener: ProcessingListener) {
  processingListeners.add(listener);
  listener(pendingMutations);
  return () => {
    processingListeners.delete(listener);
  };
}

const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);

function isTrackedRequest(config: any) {
  if (config?.silent) return false;
  const method = String(config?.method || 'get').toLowerCase();
  return MUTATION_METHODS.has(method);
}

export const http = axios.create({
  baseURL: API_URL,
  timeout: REQUEST_TIMEOUT,
});

http.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`;
  }
  config.headers['Accept-Language'] = currentLanguage;
  if (isTrackedRequest(config)) {
    pendingMutations += 1;
    emitProcessing();
  }
  return config;
});

const settleProcessing = (config: any) => {
  if (isTrackedRequest(config)) {
    pendingMutations = Math.max(0, pendingMutations - 1);
    emitProcessing();
  }
};

// --- Global 401 handling ------------------------------------------------------
// AuthContext registers a logout callback here to avoid a circular import
// (AuthContext -> http, so http cannot import AuthContext).
type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

export function onUnauthorized(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

http.interceptors.response.use(
  (response) => {
    settleProcessing(response.config);
    return response;
  },
  (error) => {
    settleProcessing(error?.config);
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      // Don't fire for the login endpoints themselves (wrong password != expired session).
      const url = String(error.config?.url || '');
      const isAuthEndpoint = url.includes('/auth/login');
      if (!isAuthEndpoint) {
        unauthorizedHandler?.();
      }
    }
    return Promise.reject(error);
  },
);

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
    const data = error.response?.data as
      | { message?: string | string[]; errors?: Record<string, string | string[]> | string[]; error?: string }
      | undefined;
    if (Array.isArray(data?.message)) return data.message.join('\n');
    if (typeof data?.message === 'string' && data.message) return data.message;
    // Laravel-style validation bags: { errors: { email: [...] } }
    if (data?.errors) {
      if (Array.isArray(data.errors)) return data.errors.join('\n');
      const first = Object.values(data.errors)
        .flat()
        .filter(Boolean)
        .join('\n');
      if (first) return first;
    }
    if (data?.error) return data.error;
    return error.message || 'Request failed';
  }
  if (error instanceof Error && error.message) return error.message;

  return 'Something went wrong';
}
