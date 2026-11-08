import { afterAll, afterEach, beforeAll, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { ordersHandlers } from "@/mocks/orders.handlers";
import { createOrder, getOrders } from "./orders.service";

const server = setupServer(...ordersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;

beforeAll(() => {
  server.listen({ onUnhandledRequest: "error" });
  apiClient.defaults.baseURL = "http://localhost/api";
});
afterEach(() => server.resetHandlers());
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
