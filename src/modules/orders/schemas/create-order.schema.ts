import { z } from "zod";
import { moneyInputSchema, moneyValueSchema } from "@/lib/validation/common.schema";

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(100, "Customer name cannot exceed 100 characters."),
  status: z.enum(["pending", "completed", "cancelled"]),
  totalAmount: moneyInputSchema,
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;

export const createOrderPayloadSchema = createOrderSchema.extend({
  totalAmount: moneyValueSchema,
});

export type CreateOrderPayload = z.infer<typeof createOrderPayloadSchema>;
