import { delay, http, HttpResponse } from "msw";
import { createOrderPayloadSchema } from "@/modules/orders/schemas/create-order.schema";
import type { Order } from "@/modules/orders/orders.types";
import { z } from "zod";

// shortcut: demo data lives in memory; replace handlers with the persistent backend before production.
const orders: Order[] = [];

export const ordersHandlers = [
  http.get("*/api/orders", ({ request }) => {
    const url = new URL(request.url);
    const result = z.object({
      page: z.coerce.number().int().min(1),
      limit: z.coerce.number().int().min(1).max(100),
    }).safeParse({
      page: url.searchParams.get("page") ?? "1",
      limit: url.searchParams.get("limit") ?? "10",
    });
    if (!result.success) {
      return HttpResponse.json({ message: "Invalid pagination." }, { status: 400 });
    }
    const { page, limit } = result.data;
    return HttpResponse.json({
      data: orders.slice((page - 1) * limit, page * limit),
      total: orders.length,
      page,
      limit,
    });
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
];
