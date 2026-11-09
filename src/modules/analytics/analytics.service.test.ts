import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { analyticsHandlers } from "@/mocks/analytics.handlers";
import { dashboardHandlers } from "@/mocks/dashboard.handlers";
import { ordersHandlers, resetMockOrders } from "@/mocks/orders.handlers";
import { createOrder, deleteOrder, updateOrder } from "@/modules/orders/api";
import { getDashboardStats } from "@/modules/dashboard/dashboard.service";
import { analyticsRangeSchema, analyticsReportSchema, getDefaultAnalyticsRange } from "./schemas/analytics.schema";
import { analyticsToCsv } from "./utils/export-analytics";
import { getAnalytics } from "./analytics.service";

const server = setupServer(...analyticsHandlers, ...ordersHandlers, ...dashboardHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const range = { from: "2026-11-03", to: "2026-11-09" };
const order = { id: "one", customerName: "=HYPERLINK(\"unsafe\")", status: "completed" as const, totalAmount: 0.1, createdAt: "2026-11-03T00:00:00.000Z" };
beforeAll(() => { server.listen({ onUnhandledRequest: "error" }); apiClient.defaults.baseURL = "http://localhost/api"; });
beforeEach(() => resetMockOrders());
afterEach(() => server.resetHandlers());
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

it("validates real calendar dates, ordering and a maximum of 366 inclusive days", () => {
  for (const invalid of [
    { from: "", to: range.to }, { ...range, from: "2026-02-30" }, { ...range, to: "2026-11-02" },
    { from: "2026-01-01", to: "2027-01-02" }, { ...range, from: "2026-11-03T00:00:00Z" },
  ]) expect(analyticsRangeSchema.safeParse(invalid).success).toBe(false);
  expect(analyticsRangeSchema.safeParse({ from: "2024-01-01", to: "2024-12-31" }).success).toBe(true);
  expect(analyticsRangeSchema.safeParse({ from: "2024-02-29", to: "2024-02-29" }).success).toBe(true);
});

it("returns zero-filled dates including both endpoints, without requiring orders", async () => {
  const report = await getAnalytics(range);
  expect(report.daily).toHaveLength(7);
  expect(report.daily[0].date).toBe(range.from);
  expect(report.daily[6].date).toBe(range.to);
  expect(report.totals).toEqual({ revenue: 0, orders: 0, pending: 0, completed: 0, cancelled: 0 });
  expect((await getAnalytics({ from: range.from, to: range.from })).daily).toHaveLength(1);
  expect((await getAnalytics({ from: "2024-01-01", to: "2024-12-31" })).daily).toHaveLength(366);
});

it("includes UTC boundary orders and excludes adjacent days; sums completed value in paise", async () => {
  resetMockOrders([
    order, { ...order, id: "two", totalAmount: 0.2 },
    { ...order, id: "end", totalAmount: 10, createdAt: "2026-11-09T23:59:59.999Z" },
    { ...order, id: "before", totalAmount: 99, createdAt: "2026-11-02T23:59:59.999Z" },
    { ...order, id: "after", totalAmount: 99, createdAt: "2026-11-10T00:00:00.000Z" },
    { ...order, id: "pending", totalAmount: 99, status: "pending" },
    { ...order, id: "cancelled", totalAmount: 99, status: "cancelled" },
  ]);
  const report = await getAnalytics(range);
  expect(report.totals).toEqual({ revenue: 10.3, orders: 5, pending: 1, completed: 3, cancelled: 1 });
  expect(report.daily[0]).toMatchObject({ revenue: 0.3, orders: 4, pending: 1, cancelled: 1 });
  expect(report.daily[6].revenue).toBe(10);
  expect(report.daily[1].orders).toBe(0);
});

it("aggregates beyond one CRUD page and agrees with Dashboard for its default window", async () => {
  const defaults = getDefaultAnalyticsRange();
  resetMockOrders(Array.from({ length: 125 }, (_, index) => ({ ...order, id: String(index), createdAt: `${defaults.to}T10:00:00.000Z` })));
  const report = await getAnalytics(defaults);
  expect(report.totals.orders).toBe(125);
  expect(report.totals.revenue).toBe(12.5);
  const dashboard = await getDashboardStats();
  expect(dashboard.revenueByDay.map((day) => day.value)).toEqual(report.daily.map((day) => day.revenue));
});

it("reflects Orders create, status edits and deletion from the same store", async () => {
  const payload = { customerName: "Ada", status: "pending" as const, totalAmount: 20 };
  const saved = await createOrder(payload);
  const defaults = getDefaultAnalyticsRange();
  expect((await getAnalytics(defaults)).totals).toMatchObject({ revenue: 0, pending: 1 });
  await updateOrder(saved.id, { ...payload, status: "completed" });
  expect((await getAnalytics(defaults)).totals).toMatchObject({ revenue: 20, completed: 1, pending: 0 });
  await deleteOrder(saved.id);
  expect((await getAnalytics(defaults)).totals.orders).toBe(0);
});

it("rejects missing, invalid and unbounded date filters at the raw HTTP boundary", async () => {
  for (const params of [{}, { from: range.from }, { ...range, to: "invalid" }, { from: range.to, to: range.from }, { from: "2020-01-01", to: "2026-01-01" }]) {
    await expect(apiClient.get("/analytics", { params })).rejects.toMatchObject({ statusCode: 400 });
  }
  await expect(getAnalytics({ ...range, to: "invalid" })).rejects.toThrow();
});

it("rejects mismatched dates, missing/duplicate days and inconsistent totals", async () => {
  const report = await getAnalytics(range);
  for (const change of [
    { daily: [] }, { generatedAt: "bad" }, { daily: report.daily.map((day) => ({ ...day, date: range.from })) },
    { totals: { ...report.totals, revenue: 1 } }, { totals: { ...report.totals, orders: 1 } },
    { daily: [{ ...report.daily[0], orders: 1 }, ...report.daily.slice(1)] },
    { daily: [{ ...report.daily[0], revenue: -1 }, ...report.daily.slice(1)] },
  ]) expect(analyticsReportSchema.safeParse({ ...report, ...change }).success).toBe(false);
  server.use(http.get("*/api/analytics", () => HttpResponse.json({ ...report, totals: { ...report.totals, orders: "0" } })));
  await expect(getAnalytics(range)).rejects.toThrow();
  server.use(http.get("*/api/analytics", () => HttpResponse.json(report)));
  await expect(getAnalytics({ from: "2026-10-01", to: "2026-10-07" })).rejects.toThrow("does not match");
});

it("preserves API failure messages and forwards cancellation", async () => {
  server.use(http.get("*/api/analytics", () => HttpResponse.json({ message: "Reporting unavailable." }, { status: 503 })));
  await expect(getAnalytics(range)).rejects.toMatchObject({ statusCode: 503, message: "Reporting unavailable." });
  const controller = new AbortController(); controller.abort();
  await expect(getAnalytics(range, controller.signal)).rejects.toThrow();
});

it("exports exactly the validated daily report with fixed numeric columns and no personal data", async () => {
  resetMockOrders([order]);
  const report = await getAnalytics(range);
  const csv = analyticsToCsv(report);
  const lines = csv.slice(1).trimEnd().split("\r\n");
  expect(csv.startsWith("\uFEFF")).toBe(true);
  expect(lines).toHaveLength(8);
  expect(lines[0]).toBe("Date (UTC),Revenue (INR),Orders,Pending,Completed,Cancelled");
  expect(lines[1]).toBe("2026-11-03,0.10,1,0,1,0");
  expect(lines[7]).toBe("2026-11-09,0.00,0,0,0,0");
  expect(csv).not.toContain("HYPERLINK");
  expect(() => analyticsToCsv({ ...report, daily: [{ ...report.daily[0], date: "=unsafe" }] })).toThrow();
});
