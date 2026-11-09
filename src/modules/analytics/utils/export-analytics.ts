import { analyticsReportSchema, type AnalyticsReport } from "../schemas/analytics.schema";

export function analyticsToCsv(report: AnalyticsReport) {
  const validated = analyticsReportSchema.parse(report);
  // Only validated ISO dates and numbers are exported; no untrusted spreadsheet formulas or personal data.
  const rows = validated.daily.map((day) => [day.date, day.revenue.toFixed(2), day.orders, day.pending, day.completed, day.cancelled].join(","));
  return "\uFEFF" + ["Date (UTC),Revenue (INR),Orders,Pending,Completed,Cancelled", ...rows].join("\r\n") + "\r\n";
}

export function downloadAnalyticsCsv(report: AnalyticsReport) {
  const blob = new Blob([analyticsToCsv(report)], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = url;
    link.download = `analytics-${report.range.from}-to-${report.range.to}.csv`;
    document.body.append(link);
    link.click();
  } finally {
    link.remove();
    URL.revokeObjectURL(url);
  }
}
