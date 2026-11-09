import { z } from "zod";

const DAY_MS = 86_400_000;
export const analyticsRangeSchema = z.object({
  from: z.string().date("Choose a valid start date."),
  to: z.string().date("Choose a valid end date."),
}).refine((range) => range.from <= range.to, { message: "Start date must not be after end date.", path: ["to"] })
  .refine((range) => (Date.parse(range.to) - Date.parse(range.from)) / DAY_MS < 366, {
    message: "Choose a range of at most 366 days, including both dates.", path: ["to"],
  });

export type AnalyticsRange = z.infer<typeof analyticsRangeSchema>;

export function getDefaultAnalyticsRange(): AnalyticsRange {
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - 6);
  return { from: start.toISOString().slice(0, 10), to: end.toISOString().slice(0, 10) };
}

const count = z.number().int().nonnegative();
const summarySchema = z.object({
  revenue: z.number().nonnegative().max(Number.MAX_SAFE_INTEGER / 100).multipleOf(0.01),
  orders: count, pending: count, completed: count, cancelled: count,
});
export const analyticsReportSchema = z.object({
  generatedAt: z.string().datetime(), range: analyticsRangeSchema,
  totals: summarySchema,
  daily: z.array(summarySchema.extend({ date: z.string().date() })).min(1).max(366),
}).refine((report) => {
  const start = Date.parse(report.range.from);
  const days = (Date.parse(report.range.to) - start) / DAY_MS + 1;
  return report.daily.length === days && report.daily.every((day, index) =>
    day.date === new Date(start + index * DAY_MS).toISOString().slice(0, 10) &&
    day.orders === day.pending + day.completed + day.cancelled);
}, { message: "Daily rows must cover the applied range in order with matching status counts." })
  .refine((report) => ["orders", "pending", "completed", "cancelled", "revenue"].every((key) => {
    const field = key as keyof typeof report.totals;
    const scale = field === "revenue" ? 100 : 1;
    return report.daily.reduce((sum, day) => sum + Math.round(day[field] * scale), 0) === Math.round(report.totals[field] * scale);
  }), { message: "Report totals must match daily data." });

export type AnalyticsReport = z.infer<typeof analyticsReportSchema>;
