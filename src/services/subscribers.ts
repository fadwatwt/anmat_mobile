import { http } from '../lib/http';
import { ApiResponse } from '../types';

export type Subscriber = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  is_active?: boolean;
  type?: string;
  total_users?: number;
  plan_limits?: {
    employees?: { max?: number | string };
    storage?: { maxBytes?: number | string };
  };
  organization?: {
    name: string;
    website?: string;
    email?: string;
    logo?: string;
    country?: string;
    city?: string;
    industry?: { name?: string };
    used_storage?: number;
  };
  createdAt?: string;
};

export type SubscriptionFeature = {
  feature_type_id?: { _id?: string; title?: string; type?: string } | string;
  properties?: { key: string; value: string }[];
};

export type Subscription = {
  _id: string;
  plan_id?: {
    _id?: string;
    name?: string;
    pricing?: { price?: number; discount?: number }[];
    features?: SubscriptionFeature[];
  };
  status?: string;
  starts_at?: string;
  expires_at?: string;
  createdAt?: string;
  extra_features?: SubscriptionFeature[];
};

export type SubscriberSocialQuota = {
  used: number;
  limit: number;
  unlimited: boolean;
  source?: string;
  override?: number;
};

export async function fetchSubscribers(): Promise<Subscriber[]> {
  const response = await http.get<ApiResponse<Subscriber[]>>('/api/admin/subscribers');
  return response.data.data;
}

export async function fetchSubscriberById(id: string): Promise<Subscriber> {
  const response = await http.get<ApiResponse<Subscriber>>(`/api/admin/subscribers/${id}`);
  return response.data.data;
}

export async function toggleSubscriberActivation(id: string): Promise<void> {
  await http.patch(`/api/admin/subscribers/${id}/toggle-activation`);
}

// ===== Subscriber detail: subscriptions, quota, mutations =====

export async function fetchSubscriberSubscriptions(subscriberId: string): Promise<Subscription[]> {
  const res = await http.get<ApiResponse<Subscription[]> | Subscription[]>(
    `/api/subscriptions/admin/list?subscriber_id=${subscriberId}`,
  );
  const data = (res.data as ApiResponse<Subscription[]>).data ?? res.data;
  return Array.isArray(data) ? data : [];
}

export async function fetchSubscriberSocialQuota(subscriberId: string): Promise<SubscriberSocialQuota> {
  const res = await http.get<ApiResponse<SubscriberSocialQuota>>(
    `/api/admin/subscribers/${subscriberId}/social-media-quota`,
  );
  const d = res.data.data || ({} as SubscriberSocialQuota);
  return { used: d.used ?? 0, limit: d.limit ?? 0, unlimited: !!d.unlimited, source: d.source, override: d.override };
}

export async function updateSubscriptionStatus(subscriptionId: string, status: string): Promise<void> {
  await http.patch(`/api/subscriptions/admin/${subscriptionId}/update-status`, { status });
}

export type ExtraFeature = { feature_type_id: string; properties: { key: string; value: string }[] };

export async function updateSubscriptionExtraFeatures(
  subscriptionId: string,
  extraFeatures: ExtraFeature[],
): Promise<void> {
  await http.patch(`/api/subscriptions/admin/${subscriptionId}/extra-features`, { extra_features: extraFeatures });
}

export type SetQuotaPayload =
  | { limit: number }
  | { unlimited: true }
  | { reset: true };

export async function setSubscriberSocialQuota(subscriberId: string, payload: SetQuotaPayload): Promise<void> {
  await http.patch(`/api/admin/subscribers/${subscriberId}/social-media-quota`, { subscriberId, ...payload });
}
