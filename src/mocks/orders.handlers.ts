import { delay, http, HttpResponse } from "msw";
import { createOrderPayloadSchema } from "@/modules/orders/schemas/create-order.schema";
import type { Order } from "@/modules/orders/orders.types";
import { z } from "zod";
import { updateOrderPayloadSchema } from "@/modules/orders/schemas/update-order.schema";

// shortcut: demo data lives in memory; replace handlers with the persistent backend before production.
const orders: Order[] = [];

export function resetMockOrders(seed: Order[] = []) {
  orders.splice(0, orders.length, ...seed.map((order) => ({ ...order })));
}

export const ordersHandlers = [
  http.get("*/api/orders", ({ request }) => {
    const url = new URL(request.url);
    const result = z.object({
      page: z.coerce.number().int().min(1),
      limit: z.coerce.number().int().min(1).max(100),
      search: z.string().trim().max(100),
      status: createOrderPayloadSchema.shape.status.optional(),
    }).safeParse({
      page: url.searchParams.get("page") ?? "1",
      limit: url.searchParams.get("limit") ?? "10",
      search: url.searchParams.get("search") ?? "",
      status: url.searchParams.get("status") ?? undefined,
    });
    if (!result.success) {
      return HttpResponse.json({ message: "Invalid order filters or pagination." }, { status: 400 });
    }
    const { page, limit, search, status } = result.data;
    const term = search.toLowerCase();
    const filtered = orders.filter((order) =>
      (!status || order.status === status) &&
      (!term || order.customerName.toLowerCase().includes(term) || order.id.toLowerCase().includes(term)),
    );
    return HttpResponse.json({
      data: filtered.slice((page - 1) * limit, page * limit),
      total: filtered.length,
      page,
      limit,
    });
  }),
  http.get("*/api/orders/:id", ({ params }) => {
    const order = orders.find((item) => item.id === params.id);
    return order
      ? HttpResponse.json(order)
      : HttpResponse.json({ message: "Order not found." }, { status: 404 });
  }),
  http.post("*/api/orders", async ({ request }) => {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return HttpResponse.json({ message: "Invalid JSON." }, { status: 400 });
    }
    const result = createOrderPayloadSchema.safeParse(body);
    if (!result.success) {
      return HttpResponse.json({
        message: "Check the order fields.",
        errors: result.error.flatten().fieldErrors,
      }, { status: 422 });
    }
    await delay(300);
    const order: Order = {
      ...result.data,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    orders.unshift(order);
    return HttpResponse.json(order, { status: 201 });
  }),
  http.put("*/api/orders/:id", async ({ request, params }) => {
    const body: unknown = await request.json().catch(() => undefined);
    if (body === undefined) return HttpResponse.json({ message: "Invalid JSON." }, { status: 400 });
    const result = updateOrderPayloadSchema.safeParse(body);
    if (!result.success) {
      return HttpResponse.json({
        message: "Check the order fields.",
        errors: result.error.flatten().fieldErrors,
      }, { status: 422 });
    }
    await delay(150);
    const index = orders.findIndex((order) => order.id === params.id);
    if (index === -1) return HttpResponse.json({ message: "Order not found." }, { status: 404 });
    const order = { ...orders[index], ...result.data };
    orders[index] = order;
    return HttpResponse.json(order);
  }),
  http.delete("*/api/orders/:id", async ({ params }) => {
    await delay(150);
    const index = orders.findIndex((order) => order.id === params.id);
    if (index === -1) return HttpResponse.json({ message: "Order not found." }, { status: 404 });
    orders.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
