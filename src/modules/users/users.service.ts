import { apiClient, API_ENDPOINTS, type PaginatedResponse } from "@/services/api";
import type { User } from "./users.types";

export async function getUsers(params: { page: number; limit: number }) {
  const response = await apiClient.get<PaginatedResponse<User>>(
    API_ENDPOINTS.users,
    { params },
  );
  return response.data;
}

export async function deleteUser(id: string) {
  await apiClient.delete(`${API_ENDPOINTS.users}/${encodeURIComponent(id)}`);
}
