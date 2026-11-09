import { z } from "zod";
import { USER_ROLES } from "../users.types";

export const userFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required.").max(120, "Name cannot exceed 120 characters."),
  email: z.string().trim().toLowerCase().max(254, "Email cannot exceed 254 characters.").email("Enter a valid email address."),
  role: z.enum(USER_ROLES),
});

export const userPayloadSchema = userFormSchema.strict();
export const userResponseSchema = userPayloadSchema.extend({ id: z.string().min(1), createdAt: z.string().datetime() });
export const userListResponseSchema = z.object({
  data: z.array(userResponseSchema), total: z.number().int().nonnegative(),
  page: z.number().int().positive(), limit: z.number().int().min(1).max(100),
});

export type UserFormValues = z.infer<typeof userFormSchema>;
export type UserPayload = z.infer<typeof userPayloadSchema>;
