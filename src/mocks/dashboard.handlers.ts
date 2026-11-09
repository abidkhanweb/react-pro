import { http, HttpResponse } from "msw";
import { getMockOrders } from "./orders.handlers";
import { getMockProducts } from "./products.handlers";
import { getMockUserCount } from "./users.handlers";
import type { DashboardStats } from "@/modules/dashboard/schemas/dashboard.schema";

export const dashboardHandlers = [
  http.get("*/api/dashboard", () => {
    const orders = getMockOrders();
    const products = getMockProducts();
    const now = new Date();
    const revenueByDay = Array.from({ length: 7 }, (_, index) => {
      const day = new Date(now);
      day.setUTCDate(day.getUTCDate() - 6 + index);
      return { date: day.toISOString().slice(0, 10), value: 0 };
    });
    const ordersByStatus = { pending: 0, completed: 0, cancelled: 0 };
    let revenuePaise = 0;
    for (const order of orders) {
      ordersByStatus[order.status] += 1;
      if (order.status !== "completed") continue;
      const paise = Math.round(order.totalAmount * 100);
      revenuePaise += paise;
      const day = revenueByDay.find((item) => item.date === order.createdAt.slice(0, 10));
      if (day) day.value += paise;
    }
    const lowStock = products.filter((product) => product.stock <= 5)
      .sort((a, b) => a.stock - b.stock || a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
    const stats: DashboardStats = {
      generatedAt: now.toISOString(),
      totals: { revenue: revenuePaise / 100, orders: orders.length, products: products.length, users: getMockUserCount(), lowStock: lowStock.length },
      revenueByDay: revenueByDay.map((day) => ({ ...day, value: day.value / 100 })),
      ordersByStatus,
      recentOrders: orders.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt) || a.id.localeCompare(b.id)).slice(0, 5),
      lowStockProducts: lowStock.slice(0, 5),
    };
    return HttpResponse.json(stats);
  }),
];
