import { apiClient, API_ENDPOINTS } from "@/services/api";
import type { UserListParams } from "../users.types";
import { userListResponseSchema, userPayloadSchema, userResponseSchema, type UserPayload } from "../schemas/user.schema";

export async function getUsers(params: UserListParams, signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(
    API_ENDPOINTS.users,
    { params: { ...params, role: params.role === "all" ? undefined : params.role }, signal },
  );
  return userListResponseSchema.parse(response.data);
}

export async function getUser(id: string, signal?: AbortSignal) {
  const response = await apiClient.get<unknown>(`${API_ENDPOINTS.users}/${encodeURIComponent(id)}`, { signal });
  return userResponseSchema.parse(response.data);
}

export async function createUser(payload: UserPayload) {
  const response = await apiClient.post<unknown>(API_ENDPOINTS.users, userPayloadSchema.parse(payload));
  return userResponseSchema.parse(response.data);
}

export async function updateUser(id: string, payload: UserPayload) {
  const response = await apiClient.put<unknown>(`${API_ENDPOINTS.users}/${encodeURIComponent(id)}`, userPayloadSchema.parse(payload));
  return userResponseSchema.parse(response.data);
}

export async function deleteUser(id: string) {
  await apiClient.delete(`${API_ENDPOINTS.users}/${encodeURIComponent(id)}`);
}
