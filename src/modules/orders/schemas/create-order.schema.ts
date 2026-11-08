import { z } from "zod";

export const createOrderSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(1, "Customer name is required.")
    .max(100, "Customer name cannot exceed 100 characters."),
  status: z.enum(["pending", "completed", "cancelled"]),
});

export type CreateOrderFormValues = z.infer<typeof createOrderSchema>;
