import { z } from "zod";
import { USER_ROLES } from "@/modules/users/users.types";

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().max(254).email("Enter a valid email address."),
  password: z.string().min(1, "Password is required.").max(128, "Password cannot exceed 128 characters."),
}).strict();
export const sessionSchema = z.object({
  user: z.object({ id: z.string().min(1), name: z.string().min(1), email: z.string().email(), role: z.enum(USER_ROLES) }).strict(),
});
export type LoginValues = z.infer<typeof loginSchema>;
export type SessionUser = z.infer<typeof sessionSchema>["user"];
