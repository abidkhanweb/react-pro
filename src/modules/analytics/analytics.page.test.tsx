// @vitest-environment jsdom
import { cloneElement, type ReactElement, type ReactNode } from "react";
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { act, cleanup, configure, fireEvent, render, renderHook, screen, waitFor, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setupServer } from "msw/node";
import { delay, http, HttpResponse } from "msw";
import { apiClient } from "@/services/api";
import { analyticsKeys } from "@/services/query-keys";
import { analyticsHandlers } from "@/mocks/analytics.handlers";
import { ordersHandlers, resetMockOrders } from "@/mocks/orders.handlers";
import { useCreateOrder } from "@/modules/orders/hooks/useCreateOrder";
import { useUpdateOrder } from "@/modules/orders/hooks/useOrder";
import { useOrders } from "@/modules/orders/hooks/useOrders";
import { formatINR } from "@/utils/format";
import { getDefaultAnalyticsRange } from "./schemas/analytics.schema";
import { getAnalytics } from "./analytics.service";
import AnalyticsPage from "./analytics.page";

vi.mock("recharts", async (importOriginal) => ({
  ...await importOriginal<typeof import("recharts")>(),
  ResponsiveContainer: ({ children }: { children: ReactElement<Record<string, unknown>> }) =>
    <div>{cloneElement(children, { width: 600, height: 300 })}</div>,
}));
const server = setupServer(...analyticsHandlers, ...ordersHandlers);
const originalBaseURL = apiClient.defaults.baseURL;
let client: QueryClient;
let downloads: string[];
const payload = { customerName: "Ada", status: "completed" as const, totalAmount: 12.5 };

beforeAll(() => {
  configure({ asyncUtilTimeout: 5000 });
  server.listen({ onUnhandledRequest: "error" }); apiClient.defaults.baseURL = "http://localhost/api";
});
beforeEach(() => {
  resetMockOrders(); downloads = [];
  client = new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: Infinity } } });
  Object.defineProperty(URL, "createObjectURL", { configurable: true, writable: true, value: vi.fn(() => "blob:analytics-test") });
  Object.defineProperty(URL, "revokeObjectURL", { configurable: true, writable: true, value: vi.fn() });
  vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(function (this: HTMLAnchorElement) { downloads.push(this.download); });
});
afterEach(() => { cleanup(); client.clear(); server.resetHandlers(); vi.restoreAllMocks(); });
afterAll(() => { server.close(); apiClient.defaults.baseURL = originalBaseURL; });
function wrapper({ children }: { children: ReactNode }) { return <QueryClientProvider client={client}>{children}</QueryClientProvider>; }
function renderPage() { return render(<AnalyticsPage />, { wrapper }); }
function seed() { resetMockOrders([{ ...payload, id: "one", createdAt: new Date().toISOString() }]); }
function setDates(from: string, to: string) {
  fireEvent.change(screen.getByLabelText("Start date (UTC)"), { target: { value: from } });
  fireEvent.change(screen.getByLabelText("End date (UTC)"), { target: { value: to } });
}
function apply() { fireEvent.click(screen.getByRole("button", { name: "Apply dates" })); }
async function reportReady() { return screen.findByRole("region", { name: "Applied analytics report" }); }

it("loads the default seven UTC dates and shows genuine zero states with readable daily data", async () => {
  renderPage(); expect(screen.getByRole("status", { name: "Loading analytics" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
  await reportReady();
  expect(screen.getByText("No orders in this date range.")).toBeTruthy();
  expect(screen.getByText("No completed-order revenue in this period.")).toBeTruthy();
  expect(within(screen.getByRole("table", { name: "Daily analytics report" })).getAllByRole("row")).toHaveLength(8);
  expect((screen.getByLabelText("Start date (UTC)") as HTMLInputElement).value).toBe(getDefaultAnalyticsRange().from);
});

it("renders actual charts and totals from the same data as the daily table", async () => {
  seed(); renderPage(); await reportReady();
  expect(within(screen.getByRole("region", { name: "Analytics totals" })).getByText(formatINR(12.5))).toBeTruthy();
  expect(screen.getByRole("region", { name: "Analytics revenue chart" }).querySelector("svg")).toBeTruthy();
  expect(screen.getByRole("region", { name: "Analytics order statuses" }).querySelector("svg")).toBeTruthy();
  expect(within(screen.getByRole("table", { name: "Daily analytics report" })).getByText(formatINR(12.5))).toBeTruthy();
});

it("validates missing, reversed and overlong ranges without replacing the applied report", async () => {
  let calls = 0;
  server.use(http.get("*/api/analytics", () => { calls += 1; return undefined; }));
  renderPage(); await reportReady();
  setDates("", "2026-11-09"); apply(); expect(await screen.findByRole("alert")).toBeTruthy();
  setDates("2026-11-10", "2026-11-09"); apply();
  expect(await screen.findByText("Start date must not be after end date.")).toBeTruthy();
  setDates("2020-01-01", "2026-01-01"); apply();
  expect(await screen.findByText("Choose a range of at most 366 days, including both dates.")).toBeTruthy();
  expect(calls).toBe(1);
});

it("applies a different period and clears back to the default range", async () => {
  renderPage(); await reportReady();
  setDates("2024-02-29", "2024-02-29"); apply();
  await screen.findByRole("heading", { name: "Report period: 2024-02-29 to 2024-02-29 (UTC)" });
  expect(within(screen.getByRole("table", { name: "Daily analytics report" })).getAllByRole("row")).toHaveLength(2);
  fireEvent.click(screen.getByRole("button", { name: "Clear filters" }));
  const range = getDefaultAnalyticsRange();
  await screen.findByRole("heading", { name: `Report period: ${range.from} to ${range.to} (UTC)` });
  expect((screen.getByLabelText("Start date (UTC)") as HTMLInputElement).value).toBe(range.from);
});

it("exports the applied period rather than unsubmitted draft dates and cleans download resources", async () => {
  seed(); renderPage(); await reportReady();
  setDates("2024-02-29", "2024-02-29");
  fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
  const range = getDefaultAnalyticsRange();
  expect(downloads).toEqual([`analytics-${range.from}-to-${range.to}.csv`]);
  const blob = vi.mocked(URL.createObjectURL).mock.calls[0][0] as Blob;
  const text = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsText(blob);
  });
  expect(text).toContain(`${range.to},12.50,1,0,1,0`);
  expect(text).not.toContain("Ada");
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:analytics-test");
  expect(document.querySelector("a[download]")).toBeNull();
  apply(); await screen.findByRole("heading", { name: "Report period: 2024-02-29 to 2024-02-29 (UTC)" });
  fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
  expect(downloads[1]).toBe("analytics-2024-02-29-to-2024-02-29.csv");
});

it("shows download failures, cleans resources on failure and permits retry", async () => {
  renderPage(); await reportReady();
  vi.mocked(HTMLAnchorElement.prototype.click).mockImplementationOnce(() => { throw new Error("Blocked"); });
  fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
  expect(await screen.findByText("Could not download CSV. Try exporting again.")).toBeTruthy();
  expect(URL.revokeObjectURL).toHaveBeenCalled();
  expect(document.querySelector("a[download]")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Export CSV" }));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(downloads).toHaveLength(1);
});

it("retries API failures and rejects malformed report data without enabling export", async () => {
  server.use(http.get("*/api/analytics", () => HttpResponse.json({ daily: [] })));
  renderPage(); await screen.findByRole("alert");
  expect(screen.queryByRole("button", { name: "Export CSV" })).toBeNull();
  server.use(http.get("*/api/analytics", () => HttpResponse.json({ message: "Unavailable" }, { status: 503 })));
  fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  await screen.findByRole("alert");
  server.resetHandlers(); fireEvent.click(screen.getByRole("button", { name: "Retry" }));
  expect(await reportReady()).toBeTruthy();
});

it("disables export during refresh and after failure, retaining a labelled snapshot until recovery", async () => {
  seed(); renderPage(); await reportReady();
  server.use(http.get("*/api/analytics", async () => { await delay(100); return HttpResponse.json({ message: "Unavailable" }, { status: 503 }); }));
  fireEvent.click(screen.getByRole("button", { name: "Refresh report" }));
  await screen.findByRole("button", { name: "Refreshing analytics..." });
  expect((screen.getByRole("button", { name: "Export CSV" }) as HTMLButtonElement).disabled).toBe(true);
  await screen.findByRole("alert");
  expect((screen.getByRole("button", { name: "Export CSV" }) as HTMLButtonElement).disabled).toBe(true);
  expect(within(screen.getByRole("region", { name: "Analytics totals" })).getByText(formatINR(12.5))).toBeTruthy();
  server.resetHandlers(); fireEvent.click(screen.getByRole("button", { name: "Refresh report" }));
  await waitFor(() => expect((screen.getByRole("button", { name: "Export CSV" }) as HTMLButtonElement).disabled).toBe(false));
  expect(screen.queryByRole("alert")).toBeNull();
});

it("cancels an obsolete range request when a newer period is applied", async () => {
  renderPage(); await reportReady();
  let obsoleteSignal: { readonly aborted?: boolean } | undefined;
  const interceptor = apiClient.interceptors.request.use((config) => {
    if (config.url === "/analytics" && config.params.from === "2024-01-01") obsoleteSignal = config.signal;
    return config;
  });
  server.use(http.get("*/api/analytics", async ({ request }) => {
    if (new URL(request.url).searchParams.get("from") === "2024-01-01") {
      await delay(150);
    }
    return undefined;
  }));
  try {
    setDates("2024-01-01", "2024-01-02"); apply();
    await waitFor(() => expect(obsoleteSignal).toBeDefined());
    setDates("2024-02-01", "2024-02-02"); apply();
    await screen.findByRole("heading", { name: "Report period: 2024-02-01 to 2024-02-02 (UTC)" });
    expect(obsoleteSignal?.aborted).toBe(true);
    expect(screen.queryByRole("heading", { name: "Report period: 2024-01-01 to 2024-01-02 (UTC)" })).toBeNull();
  } finally { apiClient.interceptors.request.eject(interceptor); }
});

it("invalidates all cached date ranges after Orders create, edit and delete", async () => {
  const ranges = [getDefaultAnalyticsRange(), { from: "2024-01-01", to: "2024-01-02" }];
  const prime = async () => {
    for (const range of ranges) await client.fetchQuery({ queryKey: analyticsKeys.revenue(range), queryFn: () => getAnalytics(range) });
  };
  const invalidated = () => { for (const range of ranges) expect(client.getQueryState(analyticsKeys.revenue(range))?.isInvalidated).toBe(true); };
  const { result } = renderHook(() => ({ create: useCreateOrder(), update: useUpdateOrder(), list: useOrders() }), { wrapper });
  await prime(); let id = "";
  await act(async () => { id = (await result.current.create.mutateAsync(payload)).id; });
  invalidated(); await prime();
  await act(async () => { await result.current.update.mutateAsync({ id, payload: { ...payload, status: "cancelled" } }); });
  invalidated(); await prime();
  await act(async () => { await result.current.list.deletion.mutateAsync(id); });
  invalidated();
});
