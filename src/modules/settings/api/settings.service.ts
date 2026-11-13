import { apiClient } from "@/services/api";
import { storeSettingsSchema, type StoreSettings } from "../schemas/settings.schema";

export async function getStoreSettings(signal?: AbortSignal) {
  const response = await apiClient.get<unknown>("/settings/store", { signal });
  return storeSettingsSchema.parse(response.data);
}
export async function updateStoreSettings(values: StoreSettings) {
  const response = await apiClient.put<unknown>("/settings/store", storeSettingsSchema.parse(values));
  return storeSettingsSchema.parse(response.data);
}
