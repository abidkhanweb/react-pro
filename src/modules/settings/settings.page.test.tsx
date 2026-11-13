// @vitest-environment jsdom
import { StrictMode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { delay, http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { settingsKeys } from "@/services/query-keys";
import { authGuard, authHandlers, resetMockAuth } from "@/mocks/auth.handlers";
import { settingsHandlers, resetMockSettings } from "@/mocks/settings.handlers";
import App from "@/App";

vi.mock("@/modules/dashboard/components/DashboardOverview", () => ({ DashboardOverview: () => <p>Dashboard tested separately.</p> }));
const server = setupServer(...authHandlers, authGuard, ...settingsHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const admin = { id: "demo-admin", name: "Original admin", email: "admin@demo.local", role: "admin" as const };
let client: QueryClient;
beforeAll(() => { configure({ asyncUtilTimeout: 5000 }); server.listen({ onUnhandledRequest: "error" }); apiClient.defaults.baseURL = "http://localhost/api"; });
beforeEach(() => { resetMockAuth(admin); resetMockSettings(); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); server.resetHandlers(); });
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });
function renderApp() { return render(<MemoryRouter initialEntries={["/settings"]}><QueryClientProvider client={client}><StrictMode><App /></StrictMode></QueryClientProvider></MemoryRouter>); }
async function ready() { return screen.findByRole("textbox", { name: "Store name" }); }
function change(name: string, value: string) { fireEvent.change(screen.getByRole("textbox", { name }), { target: { value } }); }
async function resetChanges(name: string) {
  await waitFor(() => {
    const button = screen.getByRole("button", { name }) as HTMLButtonElement;
    expect(button.disabled).toBe(false);
    expect((button.closest("fieldset") as HTMLFieldSetElement).disabled).toBe(false);
  });
  fireEvent.click(screen.getByRole("button", { name }));
}

it("loads saved store values and current profile without editable credentials or configuration promises", async () => {
  renderApp(); await ready();
  expect((screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement).value).toBe("Demo Store");
  expect((screen.getByRole("textbox", { name: "Support email" }) as HTMLInputElement).value).toBe("support@demo.local");
  expect((screen.getByRole("textbox", { name: "Display name" }) as HTMLInputElement).value).toBe("Original admin");
  expect(screen.queryByRole("textbox", { name: "Login email" })).toBeNull();
  expect(screen.queryByRole("combobox")).toBeNull();
  expect(screen.getByText(/Currency: INR/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Save store settings" }) as HTMLButtonElement).disabled).toBe(true);
});

it("saves normalized store values, protects pending controls and updates the cache", async () => {
  renderApp(); await ready(); change("Store name", " New Store "); change("Support email", " HELP@EXAMPLE.COM ");
  fireEvent.click(screen.getByRole("button", { name: "Save store settings" }));
  const pending = await screen.findByRole("button", { name: "Saving store..." });
  expect((pending.closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
  await screen.findByText("Store settings saved.");
  expect((screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement).value).toBe("New Store");
  expect(client.getQueryData(settingsKeys.store())).toEqual({ storeName: "New Store", supportEmail: "help@example.com" });
});

it("validates both forms before sending incomplete writes", async () => {
  renderApp(); await ready(); change("Store name", " "); change("Support email", "invalid");
  fireEvent.click(screen.getByRole("button", { name: "Save store settings" }));
  expect(await screen.findByText("Store name is required.")).toBeTruthy();
  expect(screen.getByText("Enter a valid support email address.")).toBeTruthy();
  change("Display name", " "); fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByText("Display name is required.")).toBeTruthy();
});

it("resets to saved values and warns before reload only while changes are unsaved", async () => {
  renderApp(); await ready(); change("Store name", "Unsaved Store");
  const dirty = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(dirty);
  expect(dirty.defaultPrevented).toBe(true);
  await resetChanges("Reset store changes");
  expect((screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement).value).toBe("Demo Store");
  const clean = new Event("beforeunload", { cancelable: true }); window.dispatchEvent(clean);
  expect(clean.defaultPrevented).toBe(false);
  change("Display name", "Unsaved Name");
  await resetChanges("Reset profile changes");
  expect((screen.getByRole("textbox", { name: "Display name" }) as HTMLInputElement).value).toBe("Original admin");
});

it("retains store edits on server failure, maps field errors and succeeds on retry", async () => {
  renderApp(); await ready(); change("Support email", "new@example.com");
  server.use(http.put("*/api/settings/store", () => HttpResponse.json({ message: "Store save rejected.", errors: { supportEmail: ["This email is unavailable."] } }, { status: 422 })));
  fireEvent.click(screen.getByRole("button", { name: "Save store settings" }));
  expect(await screen.findByText("This email is unavailable.")).toBeTruthy();
  expect(screen.getByText("Store save rejected.")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Support email" }) as HTMLInputElement).value).toBe("new@example.com");
  server.resetHandlers(); fireEvent.click(screen.getByRole("button", { name: "Save store settings" }));
  await screen.findByText("Store settings saved.");
  await screen.findByRole("button", { name: "Save store settings" });
  change("Support email", "another@example.com"); await resetChanges("Reset store changes");
  expect((screen.getByRole("textbox", { name: "Support email" }) as HTMLInputElement).value).toBe("new@example.com");
});

it("loads profile independently of a failed store read and can retry store loading", async () => {
  server.use(http.get("*/api/settings/store", () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })));
  renderApp(); await screen.findByRole("button", { name: "Retry store settings" });
  expect(screen.getByRole("textbox", { name: "Display name" })).toBeTruthy();
  expect(screen.queryByRole("textbox", { name: "Store name" })).toBeNull();
  server.resetHandlers(); fireEvent.click(screen.getByRole("button", { name: "Retry store settings" }));
  expect(await ready()).toBeTruthy();
});

it("saves the display name into the header without altering account email or role", async () => {
  renderApp(); await ready(); change("Display name", " New Admin ");
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  const pending = await screen.findByRole("button", { name: "Saving profile..." });
  expect((pending.closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
  await screen.findByText("Profile saved.");
  await screen.findByRole("button", { name: "Save profile" });
  expect(screen.getByText("New Admin")).toBeTruthy();
  expect(screen.getByText("admin@demo.local")).toBeTruthy();
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(within(navigation).getByRole("link", { name: "Users" })).toBeTruthy();
  change("Display name", "Discard"); await resetChanges("Reset profile changes");
  expect((screen.getByRole("textbox", { name: "Display name" }) as HTMLInputElement).value).toBe("New Admin");
});

it("retains profile values and maps name errors after a failed save", async () => {
  renderApp(); await ready(); change("Display name", "New Name");
  server.use(http.put("*/api/auth/profile", () => HttpResponse.json({ message: "Profile rejected.", errors: { name: ["Name unavailable."] } }, { status: 422 })));
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByText("Name unavailable.")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Display name" }) as HTMLInputElement).value).toBe("New Name");
  expect(screen.getByText("Original admin")).toBeTruthy();
});

it("does not trust a profile response that changes protected identity fields", async () => {
  renderApp(); await ready(); change("Display name", "New Name");
  server.use(http.put("*/api/auth/profile", () => HttpResponse.json({ user: { ...admin, id: "someone-else", name: "Injected" } })));
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  expect(await screen.findByText("The profile response changed protected account fields.")).toBeTruthy();
  expect(screen.getByText("Original admin")).toBeTruthy();
  expect(screen.queryByText("Injected")).toBeNull();
});

it("denies Manager Settings before loading its store data", async () => {
  resetMockAuth({ ...admin, role: "manager" });
  let reads = 0;
  server.use(http.get("*/api/settings/store", () => { reads += 1; return undefined; }));
  renderApp(); await screen.findByRole("heading", { name: "Access denied" });
  expect(reads).toBe(0);
  expect(screen.queryByRole("textbox", { name: "Display name" })).toBeNull();
});

it("expires an unauthorized profile write and clears private settings data", async () => {
  renderApp(); await ready(); change("Display name", "Changed");
  server.use(http.put("*/api/auth/profile", () => HttpResponse.json({ message: "Expired" }, { status: 401 })));
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByRole("heading", { name: "Sign in" });
  expect(client.getQueryData(settingsKeys.store())).toBeUndefined();
});

it("preserves dirty store input during a failed background refresh", async () => {
  renderApp(); await ready(); change("Store name", "Keep this draft");
  server.use(http.get("*/api/settings/store", () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })));
  await act(async () => { await client.invalidateQueries({ queryKey: settingsKeys.store() }); });
  await screen.findByRole("button", { name: "Retry store settings" });
  expect((screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement).value).toBe("Keep this draft");
});

it("applies new snapshots to clean fields but preserves drafts until an explicit reset", async () => {
  renderApp(); await ready();
  server.use(http.get("*/api/settings/store", () => HttpResponse.json({ storeName: "Reloaded Store", supportEmail: "help@example.com" })));
  await act(async () => { await client.invalidateQueries({ queryKey: settingsKeys.store() }); });
  await waitFor(() => expect((screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement).value).toBe("Reloaded Store"));
  change("Store name", "Keep my draft");
  server.use(http.get("*/api/settings/store", async () => { await delay(50); return HttpResponse.json({ storeName: "Newest Store", supportEmail: "help@example.com" }); }));
  let refresh: Promise<void> = Promise.resolve();
  act(() => { refresh = client.invalidateQueries({ queryKey: settingsKeys.store() }); });
  await screen.findByText("Refreshing store settings...");
  await act(async () => { await refresh; });
  await waitFor(() => expect(screen.queryByText("Refreshing store settings...")).toBeNull());
  expect((screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement).value).toBe("Keep my draft");
  await resetChanges("Reset store changes");
  expect((screen.getByRole("textbox", { name: "Store name" }) as HTMLInputElement).value).toBe("Newest Store");
});

it("cannot apply a late profile save to a newly signed-in identity", async () => {
  renderApp(); await ready(); change("Display name", "Old save");
  let release: () => void = () => {};
  const hold = new Promise<void>((resolve) => { release = resolve; });
  server.use(http.put("*/api/auth/profile", async () => { await hold; return HttpResponse.json({ user: { ...admin, name: "Old save" } }); }));
  fireEvent.click(screen.getByRole("button", { name: "Save profile" }));
  await screen.findByRole("button", { name: "Saving profile..." });
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByRole("heading", { name: "Sign in" });
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: "viewer@demo.local" } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: "DemoOnly!123" } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  await screen.findByRole("heading", { level: 1, name: "Dashboard" });
  await act(async () => { release(); await delay(20); });
  await waitFor(() => expect(screen.getByText("Demo viewer")).toBeTruthy());
  expect(screen.queryByText("Old save")).toBeNull();
});
