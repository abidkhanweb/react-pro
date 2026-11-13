import { delay, http, HttpResponse } from "msw";
import { storeSettingsSchema, type StoreSettings } from "@/modules/settings/schemas/settings.schema";

// shortcut: settings reset with the demo worker; durable configuration belongs to the backend milestone.
let store: StoreSettings = { storeName: "Demo Store", supportEmail: "support@demo.local" };
export function resetMockSettings() { store = { storeName: "Demo Store", supportEmail: "support@demo.local" }; }
export const settingsHandlers = [
  http.get("*/api/settings/store", () => HttpResponse.json(store)),
  http.put("*/api/settings/store", async ({ request }) => {
    const body: unknown = await request.json().catch(() => undefined);
    const result = storeSettingsSchema.safeParse(body);
    if (!result.success) return HttpResponse.json({ message: "Check the store settings.", errors: result.error.flatten().fieldErrors }, { status: 422 });
    await delay(150);
    store = result.data;
    return HttpResponse.json(store);
  }),
];
