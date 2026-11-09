import { z } from "zod";

export const moneyInputSchema = z.string().trim()
  .regex(/^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/, "Enter an amount with up to two decimal places.")
  .refine((value) => Number(value) > 0 && Number(value) <= 999999999.99, {
    message: "Amount must be greater than zero and at most 999,999,999.99.",
  });

export const moneyValueSchema = z.number().positive().max(999999999.99).multipleOf(0.01);
