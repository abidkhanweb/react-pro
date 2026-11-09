import { http, HttpResponse } from "msw";
import { analyticsRangeSchema, type AnalyticsReport } from "@/modules/analytics/schemas/analytics.schema";
import { getMockOrders } from "./orders.handlers";

export const analyticsHandlers = [
  http.get("*/api/analytics", ({ request }) => {
    const url = new URL(request.url);
    const result = analyticsRangeSchema.safeParse({ from: url.searchParams.get("from"), to: url.searchParams.get("to") });
    if (!result.success) return HttpResponse.json({ message: "Invalid analytics date range.", errors: result.error.flatten().fieldErrors }, { status: 400 });
    const range = result.data;
    const start = Date.parse(range.from);
    const days = (Date.parse(range.to) - start) / 86_400_000 + 1;
    const daily = Array.from({ length: days }, (_, index) => ({
      date: new Date(start + index * 86_400_000).toISOString().slice(0, 10),
      revenue: 0, orders: 0, pending: 0, completed: 0, cancelled: 0,
    }));
    const byDate = new Map(daily.map((day) => [day.date, day]));
    for (const order of getMockOrders()) {
      const day = byDate.get(order.createdAt.slice(0, 10));
      if (!day) continue;
      day.orders += 1;
      day[order.status] += 1;
      if (order.status === "completed") day.revenue += Math.round(order.totalAmount * 100);
    }
    const totals = daily.reduce((sum, day) => ({
      revenue: sum.revenue + day.revenue, orders: sum.orders + day.orders,
      pending: sum.pending + day.pending, completed: sum.completed + day.completed, cancelled: sum.cancelled + day.cancelled,
    }), { revenue: 0, orders: 0, pending: 0, completed: 0, cancelled: 0 });
    const report: AnalyticsReport = {
      generatedAt: new Date().toISOString(), range,
      totals: { ...totals, revenue: totals.revenue / 100 },
      daily: daily.map((day) => ({ ...day, revenue: day.revenue / 100 })),
    };
    return HttpResponse.json(report);
  }),
];
