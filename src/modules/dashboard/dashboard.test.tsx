// @vitest-environment jsdom
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, configure, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { delay, http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { dashboardKeys } from "@/services/query-keys";
import { dashboardHandlers } from "@/mocks/dashboard.handlers";
import { ordersHandlers, resetMockOrders } from "@/mocks/orders.handlers";
import { productsHandlers, resetMockProducts } from "@/mocks/products.handlers";
import { usersHandlers, resetMockUsers } from "@/mocks/users.handlers";
import { useCreateOrder } from "@/modules/orders/hooks/useCreateOrder";
import { useUpdateOrder } from "@/modules/orders/hooks/useOrder";
import { useOrders } from "@/modules/orders/hooks/useOrders";
import { useProducts, useSaveProduct } from "@/modules/products/hooks/useProduct";
import { useUsers, useSaveUser } from "@/modules/users/hooks/useUsers";
import { formatINR } from "@/utils/format";
import Dashboard from "@/components/featured/dashboard/Dashboard";
import { getDashboardStats } from "./dashboard.service";
import { AuthContext } from "@/modules/auth/auth.context";

// jsdom has no layout engine; supply dimensions while keeping the real chart renderers.
vi.mock("recharts", async (importOriginal) => ({
  ...await importOriginal<typeof import("recharts")>(),
  ResponsiveContainer: ({ children }: { children: ReactElement<Record<string, unknown>> }) =>
    <div>{cloneElement(children, { width: 600, height: 300 })}</div>,
}));

const server = setupServer(...dashboardHandlers, ...ordersHandlers, ...productsHandlers, ...usersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
let client: QueryClient;
const orderPayload = { customerName: "Ada", status: "completed" as const, totalAmount: 12.5 };
const productPayload = { name: "Keyboard", category: "Electronics", price: 10, stock: 5 };
const userPayload = { name: "Ada", email: "ada@example.com", role: "viewer" as const };

beforeAll(() => {
  configure({ asyncUtilTimeout: 5000 });
  server.listen({ onUnhandledRequest: "error" }); apiClient.defaults.baseURL = "http://localhost/api";
});
beforeEach(() => {
  resetMockOrders(); resetMockProducts(); resetMockUsers();
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
});
afterEach(() => { cleanup(); client.clear(); server.resetHandlers(); });
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={client}><AuthContext.Provider value={{
    user: { id: "dashboard-admin", name: "Admin", email: "admin@example.com", role: "admin" },
    status: "ready", signIn: vi.fn(), signOut: vi.fn(), retrySession: vi.fn(), saveProfile: vi.fn(),
  }}><MemoryRouter>{children}</MemoryRouter></AuthContext.Provider></QueryClientProvider>;
}
function renderPage() { return render(<Dashboard />, { wrapper }); }
function seed() {
  const createdAt = new Date().toISOString();
  resetMockOrders([{ ...orderPayload, id: "order-1", createdAt }, { ...orderPayload, id: "order-2", status: "pending", totalAmount: 999, createdAt }]);
  resetMockProducts([{ ...productPayload, id: "product-1" }, { ...productPayload, id: "product-2", name: "Desk", stock: 0 }]);
  resetMockUsers([{ ...userPayload, id: "user-1", createdAt }]);
}

it("shows loading, then real zero totals and useful empty states without fake chart data", async () => {
  renderPage();
  expect(screen.getByRole("status", { name: "Loading dashboard" })).toBeTruthy();
  const kpis = await screen.findByRole("region", { name: "Dashboard KPIs" });
  expect(within(kpis).getByText(formatINR(0))).toBeTruthy();
  expect(within(kpis).getAllByText("0")).toHaveLength(3);
  expect(screen.getByText("No completed-order revenue in the last 7 days.")).toBeTruthy();
  expect(screen.getByText("No orders yet.")).toBeTruthy();
  expect(screen.getByText("No recent orders.")).toBeTruthy();
  expect(screen.getByText("No low-stock products.")).toBeTruthy();
});

it("renders API-backed KPIs, real charts, accessible chart data and previews", async () => {
  seed(); renderPage();
  const kpis = await screen.findByRole("region", { name: "Dashboard KPIs" });
  expect(within(kpis).getByText(formatINR(12.5))).toBeTruthy();
  expect(within(kpis).getByText("User profiles")).toBeTruthy();
  expect(within(kpis).queryByText("Customers")).toBeNull();
  const revenue = screen.getByRole("region", { name: "Revenue chart" });
  expect(revenue.querySelector("svg")).toBeTruthy();
  expect(screen.getByRole("region", { name: "Order status summary" }).querySelector("svg")).toBeTruthy();
  fireEvent.click(screen.getByText("View daily revenue data"));
  expect(within(screen.getByRole("table", { name: "Daily revenue data" })).getByText(formatINR(12.5))).toBeTruthy();
  const recent = screen.getByRole("table", { name: "Recent orders" });
  expect(within(recent).getByText("order-1")).toBeTruthy();
  expect(within(recent).getByText("pending")).toBeTruthy();
  const stockRows = within(screen.getByRole("table", { name: "Low-stock products" })).getAllByRole("row");
  expect(stockRows[1].textContent).toContain("Desk");
  expect(stockRows[1].textContent).toContain("Out of stock");
  expect(stockRows[2].textContent).toContain("5 left");
  expect(screen.getByRole("link", { name: "Manage orders" }).getAttribute("href")).toBe("/orders");
  expect(screen.getByRole("link", { name: "Manage products" }).getAttribute("href")).toBe("/products");
});

it("retries an initial API failure without displaying made-up zero KPIs", async () => {
  server.use(http.get("*/api/dashboard", () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })));
  renderPage(); await screen.findByRole("alert");
  expect(screen.queryByRole("region", { name: "Dashboard KPIs" })).toBeNull();
  expect(screen.getByRole("link", { name: "Open orders" })).toBeTruthy();
  server.resetHandlers(); fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await screen.findByRole("region", { name: "Dashboard KPIs" })).toBeTruthy();
});

it("treats malformed reporting data as a load failure", async () => {
  server.use(http.get("*/api/dashboard", () => HttpResponse.json({ totals: { revenue: "wrong" } })));
  renderPage(); expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Dashboard KPIs" })).toBeNull();
});

it("refreshes updated records and disables repeated refreshes while fetching", async () => {
  renderPage(); await screen.findByRole("region", { name: "Dashboard KPIs" });
  seed();
  server.use(http.get("*/api/dashboard", async () => { await delay(100); return undefined; }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh dashboard" }));
  const pending = await screen.findByRole("button", { name: "Refreshing dashboard..." });
  expect((pending as HTMLButtonElement).disabled).toBe(true);
  await waitFor(() => expect(within(screen.getByRole("region", { name: "Dashboard KPIs" })).getByText(formatINR(12.5))).toBeTruthy());
});

it("retains the previous snapshot after refresh failure and recovers on a subsequent refresh", async () => {
  seed(); renderPage(); await screen.findByRole("region", { name: "Dashboard KPIs" });
  server.use(http.get("*/api/dashboard", () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })));
  fireEvent.click(screen.getByRole("button", { name: "Refresh dashboard" }));
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(within(screen.getByRole("region", { name: "Dashboard KPIs" })).getByText(formatINR(12.5))).toBeTruthy();
  server.resetHandlers(); fireEvent.click(screen.getByRole("button", { name: "Refresh dashboard" }));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
});

async function primeDashboard() {
  await client.fetchQuery({ queryKey: dashboardKeys.stats(), queryFn: () => getDashboardStats() });
}
function expectInvalidated() {
  expect(client.getQueryState(dashboardKeys.stats())?.isInvalidated).toBe(true);
}

it("invalidates a fresh dashboard cache after each Order mutation", async () => {
  const { result } = renderHook(() => ({ create: useCreateOrder(), update: useUpdateOrder(), list: useOrders() }), { wrapper });
  await primeDashboard();
  let id = "";
  await act(async () => { id = (await result.current.create.mutateAsync(orderPayload)).id; });
  expectInvalidated(); await primeDashboard();
  await act(async () => { await result.current.update.mutateAsync({ id, payload: { ...orderPayload, status: "cancelled" } }); });
  expectInvalidated(); await primeDashboard();
  expect(client.getQueryData<Awaited<ReturnType<typeof getDashboardStats>>>(dashboardKeys.stats())?.totals.revenue).toBe(0);
  await act(async () => { await result.current.list.deletion.mutateAsync(id); });
  expectInvalidated();
});

it("invalidates a fresh dashboard cache after each Product mutation", async () => {
  const { result } = renderHook(() => ({ save: useSaveProduct(), list: useProducts() }), { wrapper });
  await primeDashboard();
  let id = "";
  await act(async () => { id = (await result.current.save.mutateAsync({ payload: productPayload })).id; });
  expectInvalidated(); await primeDashboard();
  await act(async () => { await result.current.save.mutateAsync({ id, payload: { ...productPayload, stock: 10 } }); });
  expectInvalidated(); await primeDashboard();
  expect(client.getQueryData<Awaited<ReturnType<typeof getDashboardStats>>>(dashboardKeys.stats())?.totals.lowStock).toBe(0);
  await act(async () => { await result.current.list.deletion.mutateAsync(id); });
  expectInvalidated();
});

it("invalidates a fresh dashboard cache after each User mutation", async () => {
  const { result } = renderHook(() => ({ save: useSaveUser(), list: useUsers() }), { wrapper });
  await primeDashboard();
  let id = "";
  await act(async () => { id = (await result.current.save.mutateAsync({ payload: userPayload })).id; });
  expectInvalidated(); await primeDashboard();
  await act(async () => { await result.current.save.mutateAsync({ id, payload: { ...userPayload, name: "Updated Ada" } }); });
  expectInvalidated(); await primeDashboard();
  await act(async () => { await result.current.list.deletion.mutateAsync(id); });
  expectInvalidated();
});
