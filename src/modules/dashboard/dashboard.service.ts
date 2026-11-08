import { apiClient, API_ENDPOINTS } from "@/services/api";

export type DashboardStats = {
  revenue: number;
  orders: number;
  customers: number;
};

export async function getDashboardStats() {
  const response = await apiClient.get<DashboardStats>(API_ENDPOINTS.dashboard);
  return response.data;
}
