export const API_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://api.anmaat.com';

// External tweetAPI service (Twitter accounts/actions) — separate origin from main backend.
// Matches web anmat_front-main/src/Root.Route.js ExternalServer (production).
export const EXTERNAL_API_URL =
  process.env.EXPO_PUBLIC_EXTERNAL_API_URL || 'https://twitter.anmaat.com/api/v1';

export const REQUEST_TIMEOUT = 20000;
