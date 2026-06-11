export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://anmat-backend-system.onrender.com';

// External tweetAPI service (Twitter accounts/actions) — separate origin from main backend.
export const EXTERNAL_API_URL =
  process.env.EXPO_PUBLIC_EXTERNAL_API_URL || 'http://localhost:8000/api/v1';

export const REQUEST_TIMEOUT = 20000;
