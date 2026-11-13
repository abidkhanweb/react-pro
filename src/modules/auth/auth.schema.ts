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

export const profileSchema = z.object({
  name: z.string().trim().min(1, "Display name is required.").max(120, "Display name cannot exceed 120 characters."),
}).strict();
export type ProfileValues = z.infer<typeof profileSchema>;
