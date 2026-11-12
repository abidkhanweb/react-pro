import { apiClient, ApiError } from "@/services/api";
import { loginSchema, sessionSchema, type LoginValues } from "./auth.schema";

export async function getSession(signal?: AbortSignal) {
  try {
    const response = await apiClient.get<unknown>("/auth/session", { signal });
    return sessionSchema.parse(response.data).user;
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401) return null;
    throw error;
  }
}
export async function login(values: LoginValues) {
  const response = await apiClient.post<unknown>("/auth/login", loginSchema.parse(values));
  return sessionSchema.parse(response.data).user;
}
export async function logout() {
  try { await apiClient.post("/auth/logout"); }
  catch (error) { if (!(error instanceof ApiError && error.statusCode === 401)) throw error; }
}
