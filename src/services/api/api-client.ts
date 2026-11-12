import axios from "axios";
import { normalizeApiError } from "./http.errors";

let sessionRevision = 0;
const requestSessions = new WeakMap<object, number>();
// Ignore late 401s from a previous identity after login/logout clears private queries.
export function advanceAuthSession() { sessionRevision += 1; }

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true"
    ? "/api" : import.meta.env.VITE_API_BASE_URL || "/api",
  headers: { "Content-Type": "application/json" },
  timeout: 15000,
  withCredentials: true,
});

apiClient.interceptors.request.use((config) => {
  requestSessions.set(config, sessionRevision);
  return config;
});
apiClient.interceptors.response.use((response) => response, (error) => {
  if (axios.isAxiosError(error) && error.response?.status === 401 && error.config &&
    !error.config.url?.startsWith("/auth/") && requestSessions.get(error.config) === sessionRevision && typeof window !== "undefined") {
    window.dispatchEvent(new Event("auth:expired"));
  }
  return Promise.reject(normalizeApiError(error));
});
