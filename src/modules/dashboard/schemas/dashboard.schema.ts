import { z } from "zod";
import { createOrderPayloadSchema } from "@/modules/orders/schemas/create-order.schema";
import { productResponseSchema } from "@/modules/products/schemas/product.schema";

const count = z.number().int().nonnegative();
// Aggregates can exceed the per-order money limit, but must remain safe in paise.
const amount = z.number().nonnegative().max(Number.MAX_SAFE_INTEGER / 100).multipleOf(0.01);
const recentOrderSchema = createOrderPayloadSchema.extend({
  id: z.string().min(1), createdAt: z.string().datetime(),
});

export const dashboardSchema = z.object({
  generatedAt: z.string().datetime(),
  totals: z.object({ revenue: amount, orders: count, products: count, users: count, lowStock: count }),
  revenueByDay: z.array(z.object({ date: z.string().date(), value: amount })).length(7),
  ordersByStatus: z.object({ pending: count, completed: count, cancelled: count }),
  recentOrders: z.array(recentOrderSchema).max(5),
  lowStockProducts: z.array(productResponseSchema.refine((product) => product.stock <= 5)).max(5),
}).refine((data) => Object.values(data.ordersByStatus).reduce((sum, value) => sum + value, 0) === data.totals.orders, {
  message: "Order-status counts must match the total orders.",
}).refine((data) => data.totals.lowStock <= data.totals.products &&
  data.lowStockProducts.length <= data.totals.lowStock && data.recentOrders.length <= data.totals.orders, {
  message: "Dashboard lists and counts must agree.",
});

export type DashboardStats = z.infer<typeof dashboardSchema>;
