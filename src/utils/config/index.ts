export const env = {
  appName: import.meta.env.VITE_APP_NAME,
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL,
  enableAnalytics: import.meta.env.VITE_ENABLE_ANALYTICS === "true",
  enableBeta: import.meta.env.VITE_ENABLE_BETA === "true",
}