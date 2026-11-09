import { z } from "zod";
import { moneyInputSchema, moneyValueSchema } from "@/lib/validation/common.schema";

export const productFormSchema = z.object({
  name: z.string().trim().min(1, "Product name is required.").max(160, "Product name cannot exceed 160 characters."),
  category: z.string().trim().min(1, "Category is required.").max(80, "Category cannot exceed 80 characters."),
  price: moneyInputSchema,
  stock: z.string().trim().regex(/^(?:0|[1-9]\d*)$/, "Stock must be a whole number of zero or more.")
    .refine((value) => Number.isSafeInteger(Number(value)), "Stock is too large."),
});

export const productPayloadSchema = productFormSchema.extend({
  price: moneyValueSchema,
  stock: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
}).strict();

export const productResponseSchema = productPayloadSchema.extend({ id: z.string().min(1) });

export const productListResponseSchema = z.object({
  data: z.array(productResponseSchema),
  total: z.number().int().nonnegative(),
  page: z.number().int().positive(),
  limit: z.number().int().min(1).max(100),
});

export type ProductFormValues = z.infer<typeof productFormSchema>;
export type ProductPayload = z.infer<typeof productPayloadSchema>;
