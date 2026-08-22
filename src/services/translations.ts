import { http } from '../lib/http';
import { ApiResponse } from '../types';

// ===== Plan translations (web: planTranslationsApi) =====
export type PlanFeatureTranslation = {
  feature_type_id?: string;
  title?: string;
  details?: string;
  properties?: { key: string; value: string }[];
};

export type PlanTranslation = {
  _id?: string;
  locale: string;
  name?: string;
  description?: string;
  feature_translations?: PlanFeatureTranslation[];
};

export async function fetchPlanTranslations(planId: string): Promise<PlanTranslation[]> {
  const res = await http.get<ApiResponse<PlanTranslation[]> | PlanTranslation[]>(
    `/api/admin/subscription-plans/${planId}/translations`,
  );
  const data = (res.data as ApiResponse<PlanTranslation[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function createPlanTranslation(
  planId: string,
  body: { locale: string; name?: string; description?: string; feature_translations?: PlanFeatureTranslation[] },
): Promise<void> {
  await http.post(`/api/admin/subscription-plans/${planId}/translations`, body);
}

export async function updatePlanTranslation(
  planId: string,
  locale: string,
  body: { name?: string; description?: string; feature_translations?: PlanFeatureTranslation[] },
): Promise<void> {
  await http.patch(`/api/admin/subscription-plans/${planId}/translations/${locale}`, body);
}

export async function deletePlanTranslation(planId: string, locale: string): Promise<void> {
  await http.delete(`/api/admin/subscription-plans/${planId}/translations/${locale}`);
}

// ===== Industry translations (web: industryTranslationsApi) =====
export type IndustryTranslation = {
  _id?: string;
  locale: string;
  name?: string;
};

export async function fetchIndustryTranslations(industryId: string): Promise<IndustryTranslation[]> {
  const res = await http.get<ApiResponse<IndustryTranslation[]> | IndustryTranslation[]>(
    `/api/admin/industries/${industryId}/translations`,
  );
  const data = (res.data as ApiResponse<IndustryTranslation[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function createIndustryTranslation(industryId: string, body: { locale: string; name?: string }): Promise<void> {
  await http.post(`/api/admin/industries/${industryId}/translations`, body);
}

export async function updateIndustryTranslation(industryId: string, locale: string, body: { name?: string }): Promise<void> {
  await http.patch(`/api/admin/industries/${industryId}/translations/${locale}`, body);
}

export async function deleteIndustryTranslation(industryId: string, locale: string): Promise<void> {
  await http.delete(`/api/admin/industries/${industryId}/translations/${locale}`);
}

// ===== Token package translations (web: tokenPackageTranslationsApi) =====
export type TokenPackageTranslation = {
  _id?: string;
  locale: string;
  name?: string;
  description?: string;
  features?: string[];
};

export async function fetchTokenPackageTranslations(packageId: string): Promise<TokenPackageTranslation[]> {
  const res = await http.get<ApiResponse<TokenPackageTranslation[]> | TokenPackageTranslation[]>(
    `/api/admin/token-packages/${packageId}/translations`,
  );
  const data = (res.data as ApiResponse<TokenPackageTranslation[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function createTokenPackageTranslation(
  packageId: string,
  body: { locale: string; name?: string; description?: string; features?: string[] },
): Promise<void> {
  await http.post(`/api/admin/token-packages/${packageId}/translations`, body);
}

export async function updateTokenPackageTranslation(
  packageId: string,
  locale: string,
  body: { name?: string; description?: string; features?: string[] },
): Promise<void> {
  await http.patch(`/api/admin/token-packages/${packageId}/translations/${locale}`, body);
}

export async function deleteTokenPackageTranslation(packageId: string, locale: string): Promise<void> {
  await http.delete(`/api/admin/token-packages/${packageId}/translations/${locale}`);
}

// ===== Feature type translations =====
export type FeatureTypeTranslation = {
  _id?: string;
  locale: string;
  title?: string;
  details?: string;
};

export async function fetchFeatureTypeTranslations(featureTypeId: string): Promise<FeatureTypeTranslation[]> {
  const res = await http.get<ApiResponse<FeatureTypeTranslation[]> | FeatureTypeTranslation[]>(
    `/api/admin/subscription-feature-types/${featureTypeId}/translations`,
  );
  const data = (res.data as ApiResponse<FeatureTypeTranslation[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function createFeatureTypeTranslation(
  featureTypeId: string,
  body: { locale: string; title?: string; details?: string },
): Promise<void> {
  await http.post(`/api/admin/subscription-feature-types/${featureTypeId}/translations`, body);
}

export async function updateFeatureTypeTranslation(
  featureTypeId: string,
  locale: string,
  body: { title?: string; details?: string },
): Promise<void> {
  await http.patch(`/api/admin/subscription-feature-types/${featureTypeId}/translations/${locale}`, body);
}

export async function deleteFeatureTypeTranslation(featureTypeId: string, locale: string): Promise<void> {
  await http.delete(`/api/admin/subscription-feature-types/${featureTypeId}/translations/${locale}`);
}
