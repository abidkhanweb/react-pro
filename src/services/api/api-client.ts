import axios from "axios"
import { normalizeApiError } from "./http.errors"

export const apiClient = axios.create({
  baseURL: import.meta.env.DEV && import.meta.env.VITE_ENABLE_MOCKS === "true"
    ? "/api"
    : import.meta.env.VITE_API_BASE_URL || "/api",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
})

/**
 * Request interceptor
 */
apiClient.interceptors.request.use(
  (config) => {
    // 🔒 Later: attach auth token here
    // const token = authStore.getState().token
    // if (token) config.headers.Authorization = `Bearer ${token}`

    return config
  },
  (error) => Promise.reject(error),
)

/**
 * Response interceptor
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(normalizeApiError(error)),
)
