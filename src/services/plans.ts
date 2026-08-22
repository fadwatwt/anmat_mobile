import { http } from '../lib/http';
import i18n from '../i18n';
import { ApiResponse } from '../types';
import {
  fetchTokenPackageTranslations,
  fetchFeatureTypeTranslations,
  fetchPlanTranslations,
} from './translations';

export {
  fetchPlanTranslations,
  createPlanTranslation,
  updatePlanTranslation,
  deletePlanTranslation,
} from './translations';
export type {
  PlanTranslation,
  PlanFeatureTranslation,
} from './translations';

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
  const lang = (i18n.language || 'en').split('-')[0];
  const response = await http.get<ApiResponse<FeatureType[]> | FeatureType[]>(
    '/api/admin/subscriptions-feature-types',
    { params: { filter: 'active', locale: lang } },
  );
  const data = (response.data as ApiResponse<FeatureType[]>).data ?? response.data;
  const featureTypes = Array.isArray(data) ? data : [];

  if (lang !== 'en' && featureTypes.length > 0) {
    return applyTranslationsToFeatureTypes(featureTypes, lang);
  }

  return featureTypes;
}

async function applyTranslationsToFeatureTypes(featureTypes: FeatureType[], locale: string): Promise<FeatureType[]> {
  const results = [...featureTypes];
  for (let i = 0; i < results.length; i++) {
    try {
      const translations = await fetchFeatureTypeTranslations(results[i]._id);
      const t = translations.find((tr) => tr.locale === locale);
      if (t) {
        results[i] = {
          ...results[i],
          title: t.title || results[i].title,
          details: t.details || results[i].details,
        };
      }
    } catch { /* keep original */ }
  }
  return results;
}

// ===== Subscription plans (web: subscriptionPlansApi) =====
export type PlanFeature = {
  plan_feature?: { _id?: string; title?: string };
  feature_type?: { title?: string };
  feature_type_id?: string;
  properties?: { key: string; value: string }[];
};

export type PlanPricing = {
  _id?: string;
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
  const lang = (i18n.language || 'en').split('-')[0];
  const response = await http.get<ApiResponse<SubscriptionPlan[]> | SubscriptionPlan[]>(
    '/api/admin/subscription-plans',
    { params: { locale: lang } },
  );
  const data = (response.data as ApiResponse<SubscriptionPlan[]>).data ?? response.data;
  const plans = Array.isArray(data) ? data : [];

  if (lang !== 'en' && plans.length > 0) {
    const translated = await applyTranslationsToPlans(plans, lang);
    return translated;
  }

  return plans;
}

export async function fetchPublicSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const lang = (i18n.language || 'en').split('-')[0];
  const response = await http.get<ApiResponse<SubscriptionPlan[]> | SubscriptionPlan[]>(
    '/api/subscription-plans/public',
    { params: { locale: lang } },
  );
  const data = (response.data as ApiResponse<SubscriptionPlan[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

export async function fetchSubscriberSubscriptionPlans(): Promise<SubscriptionPlan[]> {
  const lang = (i18n.language || 'en').split('-')[0];
  const response = await http.get<ApiResponse<SubscriptionPlan[]> | SubscriptionPlan[]>(
    '/api/subscriber/subscription-plans',
    { params: { locale: lang } },
  );
  const data = (response.data as ApiResponse<SubscriptionPlan[]>).data ?? response.data;
  return Array.isArray(data) ? data : [];
}

async function applyTranslationsToPlans(plans: SubscriptionPlan[], locale: string): Promise<SubscriptionPlan[]> {
  const results = [...plans];
  for (let i = 0; i < results.length; i++) {
    try {
      const translations = await fetchPlanTranslations(results[i]._id);
      const t = translations.find((tr) => tr.locale === locale);
      if (t) {
        results[i] = {
          ...results[i],
          name: t.name || results[i].name,
          description: t.description || results[i].description,
        };
      }
    } catch { /* keep original */ }
  }
  return results;
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
  const lang = (i18n.language || 'en').split('-')[0];
  const response = await http.get<ApiResponse<TokenPackage[]> | TokenPackage[]>(
    '/api/ai/admin/token-packages',
    { params: { locale: lang } },
  );
  const data = (response.data as ApiResponse<TokenPackage[]>).data ?? response.data;
  const packages = Array.isArray(data) ? data : [];

  if (lang !== 'en' && packages.length > 0) {
    return applyTranslationsToTokenPackages(packages, lang);
  }

  return packages;
}

async function applyTranslationsToTokenPackages(packages: TokenPackage[], locale: string): Promise<TokenPackage[]> {
  const results = [...packages];
  for (let i = 0; i < results.length; i++) {
    try {
      const translations = await fetchTokenPackageTranslations(results[i]._id);
      const t = translations.find((tr) => tr.locale === locale);
      if (t) {
        results[i] = {
          ...results[i],
          name: t.name || results[i].name,
          description: t.description || results[i].description,
          features: t.features?.length ? t.features : results[i].features,
        };
      }
    } catch { /* keep original */ }
  }
  return results;
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
