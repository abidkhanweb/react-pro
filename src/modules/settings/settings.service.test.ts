import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { delay, http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { authGuard, authHandlers, resetMockAuth } from "@/mocks/auth.handlers";
import { settingsHandlers, resetMockSettings } from "@/mocks/settings.handlers";
import { getSession, login, logout, updateProfile } from "@/modules/auth/auth.service";
import { profileSchema } from "@/modules/auth/auth.schema";
import { getStoreSettings, updateStoreSettings } from "./api/settings.service";
import { storeSettingsSchema } from "./schemas/settings.schema";

const server = setupServer(...authHandlers, authGuard, ...settingsHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const credentials = { email: "admin@demo.local", password: "DemoOnly!123" };
beforeAll(() => { server.listen({ onUnhandledRequest: "error" }); apiClient.defaults.baseURL = "http://localhost/api"; });
beforeEach(() => { resetMockAuth(); resetMockSettings(); });
afterEach(() => server.resetHandlers());
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

it("normalizes editable fields and rejects invalid or protected payload fields", () => {
  expect(storeSettingsSchema.parse({ storeName: " New Store ", supportEmail: " HELP@EXAMPLE.COM " })).toEqual({ storeName: "New Store", supportEmail: "help@example.com" });
  expect(profileSchema.parse({ name: " Admin Name " })).toEqual({ name: "Admin Name" });
  for (const values of [{ storeName: " ", supportEmail: "a@example.com" }, { storeName: "x".repeat(121), supportEmail: "a@example.com" }, { storeName: "Store", supportEmail: "invalid" }, { storeName: "Store", supportEmail: "a@example.com", currency: "USD" }]) expect(storeSettingsSchema.safeParse(values).success).toBe(false);
  for (const values of [{ name: " " }, { name: "x".repeat(121) }, { name: "Admin", role: "admin" }, { name: "Admin", email: "changed@example.com" }, { name: "Admin", password: "secret" }]) expect(profileSchema.safeParse(values).success).toBe(false);
});

it("loads and updates shared store settings for an administrator", async () => {
  await login(credentials);
  expect(await getStoreSettings()).toEqual({ storeName: "Demo Store", supportEmail: "support@demo.local" });
  expect(await updateStoreSettings({ storeName: " New Store ", supportEmail: " HELP@EXAMPLE.COM " })).toEqual({ storeName: "New Store", supportEmail: "help@example.com" });
  expect((await getStoreSettings()).storeName).toBe("New Store");
});

it("updates only the current identity display name and retains it across demo sign-ins", async () => {
  const initial = await login(credentials);
  const saved = await updateProfile({ name: " New Admin " });
  expect(saved).toEqual({ ...initial, name: "New Admin" });
  expect(await getSession()).toEqual(saved);
  await logout(); expect((await login(credentials)).name).toBe("New Admin");
});

it("rejects anonymous and non-admin reads/writes at the API, including the auth/profile endpoint", async () => {
  await expect(getStoreSettings()).rejects.toMatchObject({ statusCode: 401 });
  await expect(updateStoreSettings({ storeName: "Store", supportEmail: "a@example.com" })).rejects.toMatchObject({ statusCode: 401 });
  await expect(updateProfile({ name: "Blocked" })).rejects.toMatchObject({ statusCode: 401 });
  for (const role of ["manager", "viewer"]) {
    await login({ ...credentials, email: `${role}@demo.local` });
    await expect(getStoreSettings()).rejects.toMatchObject({ statusCode: 403 });
    await expect(updateStoreSettings({ storeName: "Store", supportEmail: "a@example.com" })).rejects.toMatchObject({ statusCode: 403 });
    await expect(updateProfile({ name: "Blocked" })).rejects.toMatchObject({ statusCode: 403 });
  }
});

it("rejects invalid raw writes without changing saved settings or protected account fields", async () => {
  const user = await login(credentials);
  for (const body of [{ name: " " }, { name: "Admin", id: "someone-else" }, { name: "Admin", role: "viewer" }, { name: "Admin", email: "changed@example.com" }]) await expect(apiClient.put("/auth/profile", body)).rejects.toMatchObject({ statusCode: 422 });
  await expect(apiClient.put("/settings/store", { storeName: "", supportEmail: "bad" })).rejects.toMatchObject({ statusCode: 422, errors: { storeName: expect.any(Array) } });
  await expect(apiClient.put("/settings/store", { storeName: "Store", supportEmail: "a@example.com", timezone: "Local" })).rejects.toMatchObject({ statusCode: 422 });
  expect(await getSession()).toEqual(user);
  expect((await getStoreSettings()).storeName).toBe("Demo Store");
});

it("does not apply a pending profile write to a different demo session", async () => {
  await login(credentials);
  server.use(http.put("*/api/auth/profile", async () => { await delay(30); return undefined; }));
  const pending = updateProfile({ name: "Old identity name" }).catch((error: unknown) => error);
  await new Promise((resolve) => setTimeout(resolve, 60));
  resetMockAuth({ id: "different-admin", name: "New admin", email: "new@example.com", role: "admin" });
  expect(await pending).toMatchObject({ statusCode: 401 });
  expect((await getSession())?.name).toBe("New admin");
});

it("rejects malformed settings/profile responses and preserves normalized server errors", async () => {
  await login(credentials);
  server.use(http.get("*/api/settings/store", () => HttpResponse.json({ storeName: "Store", supportEmail: "bad" })));
  await expect(getStoreSettings()).rejects.toThrow();
  server.use(http.put("*/api/auth/profile", () => HttpResponse.json({ user: { role: "owner" } })));
  await expect(updateProfile({ name: "Name" })).rejects.toThrow();
  server.use(http.put("*/api/settings/store", () => HttpResponse.json({ message: "Save rejected", errors: { supportEmail: ["Email unavailable."] } }, { status: 422 })));
  await expect(updateStoreSettings({ storeName: "Store", supportEmail: "a@example.com" })).rejects.toMatchObject({ statusCode: 422, errors: { supportEmail: ["Email unavailable."] } });
});

it("forwards cancellation for settings reads", async () => {
  const controller = new AbortController(); controller.abort();
  await expect(getStoreSettings(controller.signal)).rejects.toThrow();
});
