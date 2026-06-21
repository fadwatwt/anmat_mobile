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

http.interceptors.response.use(
  (response) => {
    settleProcessing(response.config);
    return response;
  },
  (error) => {
    settleProcessing(error?.config);
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
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || error.message || 'Request failed';
  }

  return 'Something went wrong';
}
