// @vitest-environment jsdom
import { StrictMode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, configure, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { delay, http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { authGuard, authHandlers, resetMockAuth } from "@/mocks/auth.handlers";
import { ordersHandlers } from "@/mocks/orders.handlers";
import App from "@/App";
import type { SessionUser } from "./auth.schema";

vi.mock("@/modules/dashboard/components/DashboardOverview", () => ({ DashboardOverview: () => <p>Dashboard data is covered by its own tests.</p> }));
vi.mock("@/modules/analytics/components/AnalyticsReportView", () => ({ AnalyticsReportView: () => <p>Analytics data is covered by its own tests.</p> }));
vi.mock("@/modules/orders/components/OrdersTable", () => ({ OrdersTable: () => <p>Orders data is covered by its own tests.</p> }));
vi.mock("@/modules/products/components/ProductsTable", () => ({ ProductsTable: () => <p>Products data is covered by its own tests.</p> }));
vi.mock("@/modules/users/components/UsersTable", () => ({ UsersTable: () => <p>Users data is covered by its own tests.</p> }));

const server = setupServer(...authHandlers, authGuard, ...ordersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
const admin: SessionUser = { id: "admin-1", name: "Existing admin", email: "admin@example.com", role: "admin" };
let client: QueryClient;
beforeAll(() => {
  configure({ asyncUtilTimeout: 5000 }); server.listen({ onUnhandledRequest: "error" });
  apiClient.defaults.baseURL = "http://localhost/api";
});
beforeEach(() => { resetMockAuth(); client = new QueryClient({ defaultOptions: { queries: { retry: false } } }); });
afterEach(() => { cleanup(); client.clear(); server.resetHandlers(); });
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });
function LocationProbe() { const location = useLocation(); return <output aria-label="Current route">{location.pathname + location.search + location.hash}</output>; }
function renderApp(entry: string | { pathname: string; state?: unknown } = "/") {
  return render(<MemoryRouter initialEntries={[entry]}><QueryClientProvider client={client}><StrictMode><App /></StrictMode><LocationProbe /></QueryClientProvider></MemoryRouter>);
}
async function signIn(email = "admin@demo.local", password = "DemoOnly!123") {
  await screen.findByRole("heading", { name: "Sign in" });
  fireEvent.change(screen.getByRole("textbox", { name: "Email address" }), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/^Password/), { target: { value: password } });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
}

it("blocks protected content until restoration finishes, then redirects anonymous deep links to login", async () => {
  server.use(http.get("*/api/auth/session", async () => { await delay(100); return HttpResponse.json({ message: "Unauthenticated" }, { status: 401 }); }));
  renderApp("/orders?status=pending#results");
  expect(screen.getByText("Checking your session...")).toBeTruthy();
  expect(screen.queryByRole("navigation", { name: "Main navigation" })).toBeNull();
  await screen.findByRole("heading", { name: "Sign in" });
  expect(screen.getByLabelText("Current route").textContent).toBe("/login");
});

it("validates credentials locally and clears failed passwords while keeping the email", async () => {
  renderApp("/login"); await screen.findByRole("heading", { name: "Sign in" });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));
  expect(await screen.findByText("Password is required.")).toBeTruthy();
  await signIn("admin@demo.local", "incorrect");
  expect(await screen.findByText("Invalid email or password.")).toBeTruthy();
  expect((screen.getByRole("textbox", { name: "Email address" }) as HTMLInputElement).value).toBe("admin@demo.local");
  expect((screen.getByLabelText(/^Password/) as HTMLInputElement).value).toBe("");
});

it("protects a pending login and returns to an authorized internal deep link", async () => {
  renderApp("/orders?status=pending#results");
  await signIn("manager@demo.local");
  const pending = await screen.findByRole("button", { name: "Signing in..." });
  expect((pending.closest("fieldset") as HTMLFieldSetElement).disabled).toBe(true);
  await screen.findByRole("heading", { level: 1, name: "Orders" });
  expect(screen.getByLabelText("Current route").textContent).toBe("/orders?status=pending#results");
  const navigation = screen.getByRole("navigation", { name: "Main navigation" });
  expect(within(navigation).queryByRole("link", { name: "Users" })).toBeNull();
  expect(within(navigation).queryByRole("link", { name: "Settings" })).toBeNull();
});

it("restores an existing Admin session without showing a login form", async () => {
  resetMockAuth(admin); renderApp("/users");
  expect(await screen.findByRole("heading", { name: "Users", level: 1 })).toBeTruthy();
  expect(screen.getByText("Existing admin")).toBeTruthy();
  expect(screen.queryByRole("heading", { name: "Sign in" })).toBeNull();
});

it("fails closed on restore errors or malformed sessions and permits retry", async () => {
  server.use(http.get("*/api/auth/session", () => HttpResponse.json({ user: { role: "admin" } })));
  renderApp("/users"); await screen.findByRole("alert");
  expect(screen.queryByRole("navigation")).toBeNull();
  resetMockAuth(admin); server.resetHandlers();
  fireEvent.click(screen.getByRole("button", { name: "Retry session" }));
  expect(await screen.findByRole("heading", { name: "Users", level: 1 })).toBeTruthy();
});

it("denies Manager direct Users access without mounting its form", async () => {
  resetMockAuth({ ...admin, role: "manager" }); renderApp("/users");
  expect(await screen.findByRole("heading", { name: "Access denied" })).toBeTruthy();
  expect(screen.queryByRole("textbox", { name: "Full name" })).toBeNull();
  fireEvent.click(screen.getByRole("link", { name: "Return to dashboard" }));
  expect(await screen.findByRole("heading", { name: "Dashboard", level: 1 })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Open users" })).toBeNull();
});

it("limits Viewer navigation and rejects a return URL to a disallowed module", async () => {
  renderApp("/orders"); await signIn("viewer@demo.local");
  await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  const nav = screen.getByRole("navigation", { name: "Main navigation" });
  expect(within(nav).getAllByRole("link").map((link) => link.textContent)).toEqual(["Dashboard", "Analytics"]);
  expect(screen.queryByRole("link", { name: "Open orders" })).toBeNull();
});

it("never redirects to an external URL supplied in login state", async () => {
  renderApp({ pathname: "/login", state: { from: "//evil.example" } });
  await signIn(); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  expect(screen.getByLabelText("Current route").textContent).toBe("/");
});

it("logs out with pending protection and clears private query and mutation caches across identities", async () => {
  resetMockAuth(admin); renderApp(); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  client.setQueryData(["private", "admin"], { secret: "admin-only" });
  client.getMutationCache().build(client, { mutationKey: ["private-mutation"] });
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  const pending = await screen.findByRole("button", { name: "Signing out..." });
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  await screen.findByRole("heading", { name: "Sign in" });
  expect(client.getQueryData(["private", "admin"])).toBeUndefined();
  expect(client.getMutationCache().getAll()).toHaveLength(0);
  client.setQueryData(["private", "leftover"], "old data");
  await signIn("viewer@demo.local"); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  expect(client.getQueryData(["private", "leftover"])).toBeUndefined();
});

it("does not pretend logout succeeded when the server fails; retry remains available", async () => {
  resetMockAuth(admin); renderApp(); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  server.use(http.post("*/api/auth/logout", () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })));
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByText("Could not sign out. Try again.")).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Dashboard", level: 1 })).toBeTruthy();
  server.resetHandlers(); fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  expect(await screen.findByRole("heading", { name: "Sign in" })).toBeTruthy();
});

it("cancels in-flight private queries so old responses cannot refill the cache after logout", async () => {
  resetMockAuth(admin); renderApp(); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  let signal: AbortSignal | undefined;
  let release: () => void = () => {};
  const pending = client.fetchQuery({ queryKey: ["private", "pending"], queryFn: ({ signal: requestSignal }) => {
    signal = requestSignal;
    return new Promise<string>((resolve) => { release = () => resolve("old private data"); });
  } }).catch(() => undefined);
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await screen.findByRole("heading", { name: "Sign in" });
  expect(signal?.aborted).toBe(true);
  await act(async () => { release(); await pending; });
  expect(client.getQueryData(["private", "pending"])).toBeUndefined();
});

it("expires the session on a private API 401 and clears private data, but not on 403", async () => {
  resetMockAuth(admin); renderApp(); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  server.use(http.get("*/api/orders", () => HttpResponse.json({ message: "Forbidden" }, { status: 403 })));
  await act(async () => { await apiClient.get("/orders").catch(() => undefined); });
  expect(screen.getByRole("heading", { name: "Dashboard", level: 1 })).toBeTruthy();
  client.setQueryData(["private"], "secret");
  server.use(http.get("*/api/orders", () => HttpResponse.json({ message: "Expired" }, { status: 401 })));
  await act(async () => { await apiClient.get("/orders").catch(() => undefined); });
  await screen.findByRole("heading", { name: "Sign in" });
  expect(client.getQueryData(["private"])).toBeUndefined();
});

it("ignores a late unauthorized response from the previous identity", async () => {
  resetMockAuth(admin); renderApp(); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  let release: () => void = () => {};
  let started = false;
  const hold = new Promise<void>((resolve) => { release = resolve; });
  server.use(http.get("*/api/orders", async () => { started = true; await hold; return HttpResponse.json({ message: "Old session expired" }, { status: 401 }); }));
  const oldRequest = apiClient.get("/orders").catch(() => undefined);
  await waitFor(() => expect(started).toBe(true));
  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await signIn("viewer@demo.local"); await screen.findByRole("heading", { name: "Dashboard", level: 1 });
  await act(async () => { release(); await oldRequest; });
  expect(screen.getByRole("heading", { name: "Dashboard", level: 1 })).toBeTruthy();
  expect(screen.getByText("Demo viewer")).toBeTruthy();
});
