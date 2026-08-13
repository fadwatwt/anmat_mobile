import { http } from '../lib/http';
import { ApiResponse } from '../types';

// ===== Feature types (for plan creation) =====
export type FeatureTypeAttribute = { key: string; data_type: 'number' | 'string' };

export type FeatureType = {
  _id: string;
  title: string;
  type?: string;
  details?: string;
  attributes_definitions?: FeatureTypeAttribute[];
};

export async function fetchFeatureTypes(): Promise<FeatureType[]> {
  const response = await http.get<ApiResponse<FeatureType[]> | FeatureType[]>(
    '/api/admin/subscriptions-feature-types',
    { params: { filter: 'active' } },
  );
  const data = (response.data as ApiResponse<FeatureType[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

// ===== Subscription plans (web: subscriptionPlansApi) =====
export type PlanFeature = {
  plan_feature?: { _id?: string; title?: string };
  feature_type?: { title?: string };
  feature_type_id?: string;
  properties?: { key: string; value: string }[];
};

export type PlanPricing = {
  price: number;
  discount?: number;
  interval: string;
  interval_count?: number;
  days_number?: number;
  is_active?: boolean;
};

export type SubscriptionPlan = {
  _id: string;
  name: string;
  description?: string;
  pricing?: PlanPricing[];
  trial?: { trial_days?: number; is_active?: boolean };
  features?: PlanFeature[];
  is_active?: boolean;
  createdAt?: string;
};

export type CreatePlanPayload = {
  name: string;
  description: string;
  pricing: Omit<PlanPricing, never>[];
  features: { feature_type_id: string; properties: { key: string; value: string }[] }[];
  trial: { trial_days: number; is_active: boolean };
  is_active: boolean;
};

export async function createSubscriptionPlan(payload: CreatePlanPayload): Promise<void> {
  await http.post('/api/admin/subscription-plans', payload);
}

export async function updateSubscriptionPlan(id: string, payload: CreatePlanPayload): Promise<void> {
  await http.patch(`/api/admin/subscription-plans/${id}`, payload);
}

export async function fetchSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const response = await http.get<ApiResponse<SubscriptionPlan[]> | SubscriptionPlan[]>(
    '/api/admin/subscription-plans',
  );
  const data = (response.data as ApiResponse<SubscriptionPlan[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function deleteSubscriptionPlan(id: string): Promise<void> {
  await http.delete(`/api/admin/subscription-plans/${id}`);
}

export async function toggleSubscriptionPlanActive(id: string): Promise<void> {
  await http.patch(`/api/admin/subscription-plans/${id}/toggle-activity`);
}

export async function toggleSubscriptionPlanTrial(id: string): Promise<void> {
  await http.patch(`/api/admin/subscription-plans/${id}/trial/toggle-activity`);
}

// ===== Subscription plan translations (web: planTranslationsApi) =====
export type PlanFeatureTranslation = {
  feature_type_id: string;
  title?: string;
  details?: string;
};

export type PlanTranslation = {
  _id?: string;
  plan_id?: string;
  locale: string;
  name?: string;
  description?: string;
  feature_translations?: {
    feature_type_id?: string;
    plan_feature?: { _id?: string };
    title?: string;
    details?: string;
  }[];
};

export type PlanTranslationPayload = {
  locale: string;
  name?: string;
  description?: string;
  feature_translations?: PlanFeatureTranslation[];
};

export async function fetchPlanTranslations(planId: string): Promise<PlanTranslation[]> {
  const response = await http.get<ApiResponse<PlanTranslation[]> | PlanTranslation[]>(
    `/api/admin/subscription-plans/${planId}/translations`,
  );
  const data = (response.data as ApiResponse<PlanTranslation[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function createPlanTranslation(planId: string, payload: PlanTranslationPayload): Promise<void> {
  await http.post(`/api/admin/subscription-plans/${planId}/translations`, payload);
}

export async function updatePlanTranslation(planId: string, locale: string, payload: Omit<PlanTranslationPayload, 'locale'>): Promise<void> {
  await http.patch(`/api/admin/subscription-plans/${planId}/translations/${locale}`, payload);
}

export async function deletePlanTranslation(planId: string, locale: string): Promise<void> {
  await http.delete(`/api/admin/subscription-plans/${planId}/translations/${locale}`);
}

// ===== AI token packages (web: tokenPackagesApi) =====
export type TokenPackage = {
  _id: string;
  name: string;
  description?: string;
  price_label?: string;
  price_cents?: number;
  tokens?: number;
  features?: string[];
  sort_order?: number;
  is_active?: boolean;
};

export type CreateTokenPackagePayload = {
  name: string;
  description?: string;
  price_cents: number;
  price_label: string;
  tokens: number;
  sort_order?: number;
  features?: string[];
  is_active: boolean;
};

export async function createTokenPackage(payload: CreateTokenPackagePayload): Promise<void> {
  await http.post('/api/ai/admin/token-packages', payload);
}

export async function updateTokenPackage(id: string, payload: CreateTokenPackagePayload): Promise<void> {
  await http.put(`/api/ai/admin/token-packages/${id}`, payload);
}

export async function fetchTokenPackages(): Promise<TokenPackage[]> {
  const response = await http.get<ApiResponse<TokenPackage[]> | TokenPackage[]>(
    '/api/ai/admin/token-packages',
  );
  const data = (response.data as ApiResponse<TokenPackage[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function deleteTokenPackage(id: string): Promise<void> {
  await http.delete(`/api/ai/admin/token-packages/${id}`);
}

export async function toggleTokenPackageActive(id: string, isActive: boolean): Promise<void> {
  await http.put(`/api/ai/admin/token-packages/${id}`, { is_active: !isActive });
}

export async function seedTokenPackages(): Promise<void> {
  await http.post('/api/ai/admin/token-packages/seed');
}
