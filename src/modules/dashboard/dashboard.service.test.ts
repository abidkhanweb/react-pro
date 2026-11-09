import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { dashboardHandlers } from "@/mocks/dashboard.handlers";
import { ordersHandlers, resetMockOrders } from "@/mocks/orders.handlers";
import { productsHandlers, resetMockProducts } from "@/mocks/products.handlers";
import { usersHandlers, resetMockUsers } from "@/mocks/users.handlers";
import { createOrder, deleteOrder, updateOrder } from "@/modules/orders/api";
import { createProduct, deleteProduct, updateProduct } from "@/modules/products/api";
import { createUser, deleteUser } from "@/modules/users/api";
import { dashboardSchema } from "./schemas/dashboard.schema";
import { getDashboardStats } from "./dashboard.service";

const server = setupServer(...dashboardHandlers, ...ordersHandlers, ...productsHandlers, ...usersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const order = { id: "one", customerName: "Ada", status: "completed" as const, totalAmount: 0.1, createdAt: "2026-11-09T00:00:00.000Z" };
const product = { id: "one", name: "Keyboard", category: "Electronics", stock: 5, price: 10 };

beforeAll(() => { server.listen({ onUnhandledRequest: "error" }); apiClient.defaults.baseURL = "http://localhost/api"; });
beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-11-09T10:00:00.000Z"));
  resetMockOrders(); resetMockProducts(); resetMockUsers();
});
afterEach(() => { server.resetHandlers(); vi.useRealTimers(); });
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

it("returns genuine zero totals and seven zero-filled UTC dates for empty stores", async () => {
  const stats = await getDashboardStats();
  expect(stats.totals).toEqual({ revenue: 0, orders: 0, products: 0, users: 0, lowStock: 0 });
  expect(stats.ordersByStatus).toEqual({ pending: 0, completed: 0, cancelled: 0 });
  expect(stats.revenueByDay).toHaveLength(7);
  expect(stats.revenueByDay[0]).toEqual({ date: "2026-11-03", value: 0 });
  expect(stats.revenueByDay[6]).toEqual({ date: "2026-11-09", value: 0 });
  expect(stats.recentOrders).toEqual([]);
  expect(stats.lowStockProducts).toEqual([]);
});

it("aggregates all records, not one list page, and counts profiles separately from orders", async () => {
  resetMockOrders(Array.from({ length: 125 }, (_, index) => ({ ...order, id: String(index), status: index < 100 ? "completed" : index < 120 ? "pending" : "cancelled" })));
  resetMockProducts([product, { ...product, id: "two", stock: 0 }, { ...product, id: "three", stock: 6 }]);
  resetMockUsers([{ id: "u1", name: "Ada", email: "ada@example.com", role: "admin", createdAt: order.createdAt }]);
  const stats = await getDashboardStats();
  expect(stats.totals).toEqual({ revenue: 10, orders: 125, products: 3, users: 1, lowStock: 2 });
  expect(stats.ordersByStatus).toEqual({ completed: 100, pending: 20, cancelled: 5 });
  expect(stats.revenueByDay[6].value).toBe(10);
});

it("keeps all-time revenue distinct from the UTC window and sums amounts in paise", async () => {
  resetMockOrders([
    order, { ...order, id: "two", totalAmount: 0.2 },
    { ...order, id: "start", totalAmount: 10, createdAt: "2026-11-03T00:00:00.000Z" },
    { ...order, id: "before", totalAmount: 5, createdAt: "2026-11-02T23:59:59.999Z" },
    { ...order, id: "pending", totalAmount: 100, status: "pending" },
    { ...order, id: "cancelled", totalAmount: 100, status: "cancelled" },
  ]);
  const stats = await getDashboardStats();
  expect(stats.totals.revenue).toBe(15.3);
  expect(stats.revenueByDay[0].value).toBe(10);
  expect(stats.revenueByDay[6].value).toBe(0.3);
  expect(stats.revenueByDay.slice(1, 6).every((day) => day.value === 0)).toBe(true);
});

it("sorts and caps recent orders and low-stock previews without changing source lists", async () => {
  resetMockOrders(Array.from({ length: 8 }, (_, index) => ({ ...order, id: `o${index}`, createdAt: `2026-11-0${index + 1}T10:00:00.000Z` })));
  resetMockProducts(Array.from({ length: 8 }, (_, index) => ({ ...product, id: `p${index}`, name: `Product ${index}`, stock: index })));
  const stats = await getDashboardStats();
  expect(stats.recentOrders.map((item) => item.id)).toEqual(["o7", "o6", "o5", "o4", "o3"]);
  expect(stats.totals.lowStock).toBe(6);
  expect(stats.lowStockProducts.map((item) => item.stock)).toEqual([0, 1, 2, 3, 4]);
  expect((await apiClient.get("/products")).data.data[0].id).toBe("p0");
  expect((await apiClient.get("/orders")).data.data[0].id).toBe("o0");
});

it("reflects creates, status/stock edits and deletions from the same CRUD stores", async () => {
  const savedOrder = await createOrder({ customerName: "Ada", status: "pending", totalAmount: 12.5 });
  const savedProduct = await createProduct({ name: "Desk", category: "Home", price: 50, stock: 8 });
  const savedUser = await createUser({ name: "Ada", email: "ada@example.com", role: "viewer" });
  expect((await getDashboardStats()).totals).toEqual({ revenue: 0, orders: 1, products: 1, users: 1, lowStock: 0 });
  await updateOrder(savedOrder.id, { customerName: "Ada", status: "completed", totalAmount: 12.5 });
  await updateProduct(savedProduct.id, { name: "Desk", category: "Home", price: 50, stock: 0 });
  expect((await getDashboardStats()).totals).toEqual({ revenue: 12.5, orders: 1, products: 1, users: 1, lowStock: 1 });
  await deleteOrder(savedOrder.id); await deleteProduct(savedProduct.id); await deleteUser(savedUser.id);
  expect((await getDashboardStats()).totals).toEqual({ revenue: 0, orders: 0, products: 0, users: 0, lowStock: 0 });
});

it("rejects malformed snapshots instead of rendering misleading metrics", async () => {
  const stats = await getDashboardStats();
  for (const change of [
    { generatedAt: "invalid" }, { totals: { ...stats.totals, revenue: -1 } },
    { totals: { ...stats.totals, orders: 1 } }, { revenueByDay: [] },
    { lowStockProducts: [product] }, { recentOrders: [{ ...order, createdAt: "invalid" }] },
    { revenueByDay: [{ date: "not-a-date", value: 1 }, ...stats.revenueByDay.slice(1)] },
  ]) expect(dashboardSchema.safeParse({ ...stats, ...change }).success).toBe(false);
  server.use(http.get("*/api/dashboard", () => HttpResponse.json({ ...stats, totals: { ...stats.totals, revenue: "12" } })));
  await expect(getDashboardStats()).rejects.toThrow();
});

it("preserves HTTP errors and forwards cancellation", async () => {
  server.use(http.get("*/api/dashboard", () => HttpResponse.json({ message: "Reporting unavailable." }, { status: 503 })));
  await expect(getDashboardStats()).rejects.toMatchObject({ statusCode: 503, message: "Reporting unavailable." });
  const controller = new AbortController(); controller.abort();
  await expect(getDashboardStats(controller.signal)).rejects.toThrow();
});
