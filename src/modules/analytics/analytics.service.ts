import { apiClient, API_ENDPOINTS } from "@/services/api";
import { analyticsRangeSchema, analyticsReportSchema, type AnalyticsRange } from "./schemas/analytics.schema";

export async function getAnalytics(params: AnalyticsRange, signal?: AbortSignal) {
  const range = analyticsRangeSchema.parse(params);
  const response = await apiClient.get<unknown>(API_ENDPOINTS.analytics, {
    params: range, signal,
  });
  const report = analyticsReportSchema.parse(response.data);
  if (report.range.from !== range.from || report.range.to !== range.to) {
    throw new Error("The analytics response does not match the requested dates.");
  }
  return report;
}
