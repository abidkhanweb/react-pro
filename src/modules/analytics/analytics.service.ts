import { apiClient, API_ENDPOINTS } from "@/services/api";
import type { ChartPoint } from "@/components/common/charts/types";

export async function getAnalytics(params: { from: string; to: string }) {
  const response = await apiClient.get<ChartPoint[]>(API_ENDPOINTS.analytics, {
    params,
  });
  return response.data;
}
