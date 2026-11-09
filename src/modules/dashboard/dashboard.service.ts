import { apiClient, API_ENDPOINTS } from "@/services/api";
import { dashboardSchema } from "./schemas/dashboard.schema";

export async function getDashboardStats(signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(API_ENDPOINTS.dashboard, { signal });
  return dashboardSchema.parse(response.data);
}
