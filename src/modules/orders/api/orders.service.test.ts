import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { ordersHandlers, resetMockOrders } from "@/mocks/orders.handlers";
import { createOrder, getOrder, getOrders, updateOrder, deleteOrder } from "./orders.service";

const server = setupServer(...ordersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  apiClient.defaults.baseURL = "http://localhost/api";
});
afterEach(() => server.resetHandlers());
beforeEach(() => resetMockOrders());
afterAll(() => {
  server.close();
  apiClient.defaults.baseURL = originalBaseURL;
});

it("creates an order through Axios and returns it in the paginated list", async () => {
  const order = await createOrder({ customerName: " Ada ", status: "pending", totalAmount: 10.25 });
  expect(order).toMatchObject({ customerName: "Ada", status: "pending", totalAmount: 10.25 });
  expect(order.id).toBeTruthy();
  expect(Number.isNaN(Date.parse(order.createdAt))).toBe(false);
  const result = await getOrders({ page: 1, limit: 10 });
  expect(result.data).toContainEqual(order);
});

it("rejects invalid HTTP input at the mock API boundary", async () => {
  await expect(apiClient.post("/orders", { customerName: "", status: "unknown", totalAmount: -1 }))
    .rejects.toMatchObject({ statusCode: 422, errors: { customerName: expect.any(Array) } });
  await expect(getOrders({ page: 0, limit: 10 })).rejects.toMatchObject({ statusCode: 400 });
});

it("preserves server field errors so the form can display them", async () => {
  server.use(http.post("*/api/orders", () => HttpResponse.json({
    message: "Could not save order.", errors: { customerName: ["Customer is unavailable."] },
  }, { status: 422 })));
  await expect(createOrder({ customerName: "Ada", status: "pending", totalAmount: 10.25 }))
    .rejects.toMatchObject({ statusCode: 422, errors: { customerName: ["Customer is unavailable."] } });
});

it("loads, updates and deletes a saved order without changing its identity", async () => {
  const order = await createOrder({ customerName: "Ada", status: "pending", totalAmount: 10.25 });
  expect(await getOrder(order.id)).toEqual(order);
  const updated = await updateOrder(order.id, { customerName: "Grace", status: "completed", totalAmount: 20.5 });
  expect(updated).toEqual({ ...order, customerName: "Grace", status: "completed", totalAmount: 20.5 });
  expect(await getOrder(order.id)).toEqual(updated);
  await deleteOrder(order.id);
  expect((await getOrders({ page: 1, limit: 10 })).total).toBe(0);
  await expect(getOrder(order.id)).rejects.toMatchObject({ statusCode: 404 });
});

it("filters before paginating and searches names and IDs without case sensitivity", async () => {
  const createdAt = new Date().toISOString();
  resetMockOrders([
    { id: "one", customerName: "Ada", status: "pending", totalAmount: 1, createdAt },
    { id: "two", customerName: "Grace", status: "completed", totalAmount: 2, createdAt },
    { id: "three", customerName: "ADA BYRON", status: "pending", totalAmount: 3, createdAt },
  ]);
  const result = await getOrders({ page: 2, limit: 1, search: " ada ", status: "pending" });
  expect(result.total).toBe(2);
  expect(result.data.map((order) => order.id)).toEqual(["three"]);
  expect((await getOrders({ page: 1, limit: 10, search: "TWO", status: "all" })).data[0].customerName).toBe("Grace");
  expect((await getOrders({ page: 1, limit: 10, search: "missing" })).total).toBe(0);
});

it("rejects invalid updates at the HTTP boundary and preserves the saved data", async () => {
  const order = await createOrder({ customerName: "Ada", status: "pending", totalAmount: 10.25 });
  for (const payload of [
    { customerName: "", status: "pending", totalAmount: 1 },
    { customerName: "Ada", status: "unknown", totalAmount: 1 },
    { customerName: "Ada", status: "pending", totalAmount: -1 },
    { customerName: "Ada", status: "pending", totalAmount: 1, id: "changed" },
  ]) {
    await expect(apiClient.put(`/orders/${order.id}`, payload)).rejects.toMatchObject({ statusCode: 422 });
  }
  expect(await getOrder(order.id)).toEqual(order);
  await expect(apiClient.get("/orders", { params: { status: "unknown" } })).rejects.toMatchObject({ statusCode: 400 });
});

it("returns 404 for unknown order IDs instead of changing another order", async () => {
  await expect(getOrder("missing")).rejects.toMatchObject({ statusCode: 404 });
  await expect(updateOrder("missing", { customerName: "Ada", status: "pending", totalAmount: 1 })).rejects.toMatchObject({ statusCode: 404 });
  await expect(deleteOrder("missing")).rejects.toMatchObject({ statusCode: 404 });
});
