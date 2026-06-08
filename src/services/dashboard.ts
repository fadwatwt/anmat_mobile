import { http } from '../lib/http';
import { Analytics, ApiResponse, User } from '../types';

export async function fetchAnalytics(user: User) {
  const endpoint =
    user.type === 'Subscriber'
      ? '/api/subscriber/organization/analytics'
      : '/api/employee/analytics';

  const response = await http.get<ApiResponse<Analytics>>(endpoint);
  return response.data.data;
}
