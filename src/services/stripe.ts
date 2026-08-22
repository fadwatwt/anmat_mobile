import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type SetupIntentResponse = {
  clientSecret: string;
  customerId: string;
};

export type CheckoutSessionResponse = {
  url: string;
  session_id: string;
};

export async function createSetupIntent(): Promise<SetupIntentResponse> {
  const response = await http.post<ApiResponse<SetupIntentResponse>>(
    '/api/subscriptions/subscriber/create-setup-intent',
  );
  const data = (response.data as ApiResponse<SetupIntentResponse>).data ?? response.data;
  return data as SetupIntentResponse;
}

export async function createCheckoutSession(planId: string, priceId: string): Promise<CheckoutSessionResponse> {
  const response = await http.post<ApiResponse<CheckoutSessionResponse>>(
    '/api/subscriptions/subscriber/create-checkout-session',
    { plan_id: planId, price_id: priceId },
  );
  const data = (response.data as ApiResponse<CheckoutSessionResponse>).data ?? response.data;
  return data as CheckoutSessionResponse;
}
