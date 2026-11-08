import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(100, "Customer name cannot exceed 100 characters."),
  status: z.enum(["pending", "completed", "cancelled"]),
  totalAmount: z
    .string()
    .trim()
    .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, "Enter an amount with up to two decimal places.")
    .refine((value) => Number(value) > 0 && Number(value) <= 999999999.99, {
      message: "Amount must be greater than zero and at most 999,999,999.99.",
    }),
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;

export const createOrderPayloadSchema = createOrderSchema.extend({
  totalAmount: z.number().positive().max(999999999.99).multipleOf(0.01),
});

export type CreateOrderPayload = z.infer<typeof createOrderPayloadSchema>;
