import { z } from "zod";

export const storeSettingsSchema = z.object({
  storeName: z.string().trim().min(1, "Store name is required.").max(120, "Store name cannot exceed 120 characters."),
  supportEmail: z.string().trim().toLowerCase().max(254, "Email cannot exceed 254 characters.").email("Enter a valid support email address."),
}).strict();
export type StoreSettings = z.infer<typeof storeSettingsSchema>;
